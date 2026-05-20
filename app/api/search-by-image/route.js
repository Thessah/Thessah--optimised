
import { NextResponse } from 'next/server';
import { ensureOpenAI, isOpenAIConfigured } from '@/configs/openai';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image');
    if (!image) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    // Convert image to base64
    const arrayBuffer = await image.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = image.type || 'image/jpeg';

    // Use OpenAI (ChatGPT) for image-based keyword extraction
    if (!isOpenAIConfigured()) {
      return NextResponse.json({ error: 'AI provider is not configured. Set OPENAI_API_KEY.' }, { status: 500 });
    }
    const client = ensureOpenAI();
    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    const prompt = `You are an expert product identifier for an e-commerce site. Analyze the image and return ONLY the most relevant product keyword (e.g., "shoes", "headphones", "t-shirt"). Do not return sentences, descriptions, or extra text. Output just the keyword as a plain string.`;
    const response = await client.chat.completions.create({
      model,
      response_format: { type: "text" },
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    });
    const keyword = response.choices?.[0]?.message?.content?.trim() || "";
    return NextResponse.json({ keyword });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Image search failed' }, { status: 500 });
  }
}
