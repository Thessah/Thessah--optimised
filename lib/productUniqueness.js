import { openai, isOpenAIConfigured } from "@/configs/openai";

const DEFAULT_MODEL = process.env.OPENAI_PRODUCT_NAME_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";

function escapeRegExp(value = "") {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeName(value, fallback = "Product") {
    const cleaned = String(value || "").replace(/\s+/g, " ").trim();
    return cleaned || fallback;
}

export function normalizeSlug(value, fallback = "product") {
    const raw = String(value || "").trim().toLowerCase();
    const cleaned = raw
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/(^-|-$)+/g, "");
    return cleaned || fallback;
}

async function doesNameExist(ProductModel, name, excludeId = null) {
    const query = {
        name: { $regex: `^${escapeRegExp(name)}$`, $options: "i" },
    };

    if (excludeId) {
        query._id = { $ne: excludeId };
    }

    const existing = await ProductModel.findOne(query).select("_id").lean();
    return Boolean(existing);
}

async function suggestNamesWithAI({ baseName, category, notes }) {
    if (!isOpenAIConfigured()) {
        return [];
    }

    const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        temperature: 0.4,
        messages: [
            {
                role: "system",
                content: [
                    "You are naming jewelry e-commerce products.",
                    "Return only JSON.",
                    "Output format: {\"suggestions\":[\"name1\",\"name2\",...]}.",
                    "Provide 5 concise, marketable alternatives preserving the core product type.",
                ].join("\n"),
            },
            {
                role: "user",
                content: JSON.stringify({
                    baseName,
                    category: category || "",
                    notes: notes || "",
                }),
            },
        ],
    });

    const raw = String(response?.choices?.[0]?.message?.content || "").replace(/```json|```/gi, "").trim();
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed?.suggestions)) return [];
        return parsed.suggestions.map((name) => normalizeName(name)).filter(Boolean);
    } catch {
        return [];
    }
}

export async function generateUniqueSlug(ProductModel, baseSlug, excludeId = null) {
    const base = normalizeSlug(baseSlug);

    const existingBase = await ProductModel.findOne({ slug: base }).select("_id").lean();
    if (!existingBase || (excludeId && String(existingBase._id) === String(excludeId))) {
        return base;
    }

    let counter = 2;
    while (counter < 10000) {
        const candidate = `${base}-${counter}`;
        const existing = await ProductModel.findOne({ slug: candidate }).select("_id").lean();
        if (!existing || (excludeId && String(existing._id) === String(excludeId))) {
            return candidate;
        }
        counter += 1;
    }

    return `${base}-${Date.now()}`;
}

export async function generateUniqueProductName(ProductModel, desiredName, options = {}) {
    const { excludeId = null, category = "", notes = "", useAI = true } = options;
    const baseName = normalizeName(desiredName);

    if (!(await doesNameExist(ProductModel, baseName, excludeId))) {
        return baseName;
    }

    if (useAI) {
        const aiSuggestions = await suggestNamesWithAI({ baseName, category, notes });
        for (const suggestion of aiSuggestions) {
            if (!(await doesNameExist(ProductModel, suggestion, excludeId))) {
                return suggestion;
            }
        }
    }

    let counter = 2;
    while (counter < 10000) {
        const candidate = `${baseName} ${counter}`;
        if (!(await doesNameExist(ProductModel, candidate, excludeId))) {
            return candidate;
        }
        counter += 1;
    }

    return `${baseName} ${Date.now()}`;
}