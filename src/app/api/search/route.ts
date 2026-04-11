import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/product";

const PROJECTION = {
  code: 1,
  product_name: 1,
  product_name_en: 1,
  brands: 1,
  categories: 1,
  categories_tags: 1,
  nutriscore_grade: 1,
  nova_group: 1,
  pnns_groups_1: 1,
  nutriments: 1,
  verified: 1,
  tags: 1,
  image_data_url: 1,
};

const PAGE_SIZE = 20;
const EXTRA_SIZE = 10;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);
  const limit = offset === 0 ? PAGE_SIZE : EXTRA_SIZE;

  await connectDB();

  try {
    // No query → return default suggestions (healthiest products)
    if (!q) {
      const filter = {
        nutriscore_grade: { $in: ["a", "b", "c", "d", "e"] },
        product_name_en: { $exists: true, $ne: "" },
      };
      const [total, results] = await Promise.all([
        Product.countDocuments(filter),
        Product.find(filter, PROJECTION)
          .sort({ nutriscore_score: 1 })
          .skip(offset)
          .limit(limit)
          .lean(),
      ]);
      return NextResponse.json({ total, results });
    }

    // Exact barcode lookup
    if (/^\d{6,14}$/.test(q)) {
      const byCode = await Product.findOne({ code: q }, PROJECTION).lean();
      if (byCode) return NextResponse.json({ total: 1, results: [byCode] });
    }

    // Full-text search
    const textFilter = { $text: { $search: q } };
    const [textTotal, textResults] = await Promise.all([
      Product.countDocuments(textFilter),
      Product.find(textFilter, { score: { $meta: "textScore" }, ...PROJECTION })
        .sort({ score: { $meta: "textScore" }, _id: 1 })
        .skip(offset)
        .limit(limit)
        .lean(),
    ]);

    if (textTotal >= 1) {
      return NextResponse.json({ total: textTotal, results: textResults });
    }

    // Fallback: regex across all relevant fields
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const regexFilter = {
      $or: [
        { product_name: regex },
        { product_name_en: regex },
        { brands: regex },
        { categories: regex },
        { pnns_groups_1: regex },
        { ingredients_text_en: regex },
        { tags: regex },
      ],
    };
    const [regexTotal, regexResults] = await Promise.all([
      Product.countDocuments(regexFilter),
      Product.find(regexFilter, PROJECTION).sort({ _id: 1 }).skip(offset).limit(limit).lean(),
    ]);

    return NextResponse.json({ total: regexTotal, results: regexResults });
  } catch (err) {
    console.error("[api/search]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
