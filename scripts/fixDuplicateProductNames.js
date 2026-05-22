/* eslint-disable no-console */
import connectDB from "../lib/mongoose.js";
import Product from "../models/Product.js";
import { generateUniqueProductName, generateUniqueSlug } from "../lib/productUniqueness.js";

async function findDuplicateNameGroups() {
    return Product.aggregate([
        {
            $project: {
                _id: 1,
                name: { $ifNull: ["$name", ""] },
                normalizedName: {
                    $toLower: {
                        $trim: { input: { $ifNull: ["$name", ""] } },
                    },
                },
            },
        },
        {
            $match: {
                normalizedName: { $ne: "" },
            },
        },
        {
            $group: {
                _id: "$normalizedName",
                ids: { $push: "$_id" },
                count: { $sum: 1 },
            },
        },
        {
            $match: {
                count: { $gt: 1 },
            },
        },
    ]);
}

async function run() {
    await connectDB();

    const duplicateGroups = await findDuplicateNameGroups();
    if (!duplicateGroups.length) {
        console.log("No duplicate product names found.");
        return;
    }

    console.log(`Found ${duplicateGroups.length} duplicate name groups.`);

    let updatedCount = 0;

    for (const group of duplicateGroups) {
        const products = await Product.find({ _id: { $in: group.ids } })
            .sort({ createdAt: 1, _id: 1 })
            .lean();

        if (products.length < 2) continue;

        const keeper = products[0];
        console.log(`Keeping original name for ${keeper._id}: \"${keeper.name}\"`);

        for (let i = 1; i < products.length; i += 1) {
            const product = products[i];
            const newName = await generateUniqueProductName(Product, product.name, {
                excludeId: product._id,
                category: product.category || "",
                notes: product.shortDescription || product.description || "",
                useAI: true,
            });
            const newSlug = await generateUniqueSlug(Product, newName, product._id);

            await Product.updateOne(
                { _id: product._id },
                { $set: { name: newName, slug: newSlug } }
            );

            updatedCount += 1;
            console.log(`Updated ${product._id}: \"${product.name}\" -> \"${newName}\" (${newSlug})`);
        }
    }

    console.log(`Done. Updated ${updatedCount} duplicate products.`);
}

run()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Failed to fix duplicate product names:", error);
        process.exit(1);
    });