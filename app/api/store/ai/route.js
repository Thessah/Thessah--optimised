import { openai, isOpenAIConfigured } from "@/configs/openai";
import authSeller from "@/middlewares/authSeller";
import { requireFirebaseAuth } from "@/lib/firebase-auth-helper";
import { NextResponse } from "next/server";

const DEFAULT_MODEL = process.env.OPENAI_PRODUCT_AUTOFILL_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";

function cleanJson(raw) {
    if (!raw) return "";
    return String(raw).replace(/```json|```/gi, "").trim();
}

function normalizeArray(input) {
    if (!Array.isArray(input)) return [];
    return input.map((v) => String(v || "").trim()).filter(Boolean);
}

function normalizeDetails(input) {
    if (!Array.isArray(input)) return [];
    return input
        .map((item) => ({
            label: String(item?.label || "").trim(),
            value: String(item?.value || "").trim(),
        }))
        .filter((row) => row.label && row.value);
}

async function generateProductDraft({ imageUrl, notes }) {
    const messages = [
        {
            role: "system",
            content: [
                "You are a product listing assistant for a jewelry e-commerce store called Thessah.",
                "Analyze the product image carefully and return ONLY valid JSON.",
                "Do not include markdown, code fences, or explanatory text - only pure JSON.",
                "Do not provide price data.",
                "Brand is fixed as 'thessah'.",
                "IMPORTANT: Include realistic category suggestions (e.g., 'Gold Necklace', 'Silver Ring', 'Bracelet', 'Earrings', 'Pendant').",
                "IMPORTANT: Include target audience from: men, women, kids (pick at least one based on product design/size).",
                "IMPORTANT: Provide a good short description and full description.",
                "IMPORTANT: For metalDetails include AT LEAST 5 rows. Examples: Gold Type, Karat/Purity, Metal Color, Metal Weight, Hallmark, Plating, Finish, Stone Type, Stone Weight, Carat.",
                "IMPORTANT: For generalDetails include AT LEAST 5 rows. Examples: Occasion, Style, Collection, Design, Certification, Origin, Gender, Warranty, SKU Type, Packaging.",
                "Return ONLY this JSON format with no extra text:",
                '{"name":"Gold Diamond Ring","shortDescription":"Beautiful diamond ring","description":"Detailed description here","categorySuggestions":["Gold Ring"],"targetAudience":["women"],"tags":["diamond","wedding"],"metalDetails":[{"label":"Gold Type","value":"18K"},{"label":"Karat","value":"22K"},{"label":"Metal Color","value":"Yellow Gold"},{"label":"Metal Weight","value":"5g"},{"label":"Hallmark","value":"BIS 916"}],"generalDetails":[{"label":"Occasion","value":"Wedding"},{"label":"Style","value":"Traditional"},{"label":"Collection","value":"Bridal"},{"label":"Gender","value":"Women"},{"label":"Certification","value":"BIS Certified"}]}'
            ].join("\n"),
        },
        {
            role: "user",
            content: [
                {
                    type: "text",
                    text: `Analyze this jewelry product image. Return ONLY valid JSON (no markdown or explanations). Extra context: ${notes || "none"}`,
                },
                { type: "image_url", image_url: { url: imageUrl } },
            ],
        },
    ];

    const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages,
        temperature: 0.3,
    });

    const raw = response?.choices?.[0]?.message?.content;
    console.log('[AI Raw Response]', raw);
    
    if (!raw) {
        throw new Error('AI returned empty response');
    }

    let parsed;
    try {
        parsed = JSON.parse(cleanJson(raw));
    } catch (parseError) {
        console.error('[JSON Parse Error]', parseError.message, 'Raw:', raw);
        throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }

    if (!parsed) {
        throw new Error('AI returned invalid JSON');
    }

    const result = {
        name: String(parsed?.name || "").trim(),
        brand: "thessah",
        shortDescription: String(parsed?.shortDescription || "").trim(),
        description: String(parsed?.description || "").trim(),
        categorySuggestions: normalizeArray(parsed?.categorySuggestions),
        targetAudience: normalizeArray(parsed?.targetAudience).map((x) => x.toLowerCase()),
        tags: normalizeArray(parsed?.tags),
        metalDetails: normalizeDetails(parsed?.metalDetails),
        generalDetails: normalizeDetails(parsed?.generalDetails),
    };

    console.log('[AI Parsed Result]', result);
    return result;
}

export async function POST(request) {
    try {
        if (!isOpenAIConfigured()) {
            return NextResponse.json({ error: "AI is disabled (missing OPENAI_API_KEY)" }, { status: 503 });
        }

        const { uid: userId } = await requireFirebaseAuth(request);
        const storeId = await authSeller(userId);
        if (!storeId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 });
        }

        const { imageUrl, base64Image, mimeType, notes } = await request.json();
        let resolvedImageUrl = String(imageUrl || "").trim();

        if (!resolvedImageUrl && base64Image && mimeType) {
            resolvedImageUrl = `data:${mimeType};base64,${base64Image}`;
        }

        if (!resolvedImageUrl) {
            return NextResponse.json({ error: "Missing image input" }, { status: 400 });
        }

        const draft = await generateProductDraft({
            imageUrl: resolvedImageUrl,
            notes: String(notes || "").trim(),
        });

        return NextResponse.json(draft);
    } catch (error) {
        console.error("[STORE AI]", error);
        const message = String(error?.message || "Failed to generate AI draft");
        const upstreamStatus = Number(error?.status || error?.response?.status || 0);

        if (upstreamStatus >= 400 && upstreamStatus <= 599) {
            return NextResponse.json({ error: message }, { status: upstreamStatus });
        }

        if (
            message.includes("Authorization header missing") ||
            message.includes("No token provided") ||
            message.includes("Invalid or expired token") ||
            message.includes("Firebase Admin Auth not available")
        ) {
            return NextResponse.json({ error: message }, { status: 401 });
        }

        if (message.includes("OpenAI is not configured") || message.includes("AI is disabled")) {
            return NextResponse.json({ error: message }, { status: 503 });
        }

        if (
            message.includes("Failed to parse AI response") ||
            message.includes("AI returned empty response") ||
            message.includes("AI returned invalid JSON")
        ) {
            return NextResponse.json({ error: message }, { status: 502 });
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
