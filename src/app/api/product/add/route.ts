import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/product";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      code,
      product_name,
      brands,
      categories,
      serving_size,
      ingredients_text_en,
      allergens_tags,
      nutriscore_grade,
      nova_group,
      nutriments,
      image_data_url,
    } = body;

    if (!product_name?.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    await connectDB();

    // If barcode provided, check for duplicates
    if (code?.trim()) {
      const existing = await Product.findOne({ code: code.trim() }).lean();
      if (existing) {
        return NextResponse.json({ error: "A product with this barcode already exists" }, { status: 409 });
      }
    }

    const now = Math.floor(Date.now() / 1000);

    const product = await Product.create({
      code: code?.trim() || `manual-${now}`,
      product_name: product_name.trim(),
      product_name_en: product_name.trim(),
      brands: brands?.trim() || undefined,
      categories: categories?.trim() || undefined,
      serving_size: serving_size?.trim() || undefined,
      ingredients_text_en: ingredients_text_en?.trim() || undefined,
      ingredients_text: ingredients_text_en?.trim() || undefined,
      allergens_tags: allergens_tags ?? [],
      nutriscore_grade: nutriscore_grade || undefined,
      nova_group: nova_group ? Number(nova_group) : undefined,
      nutriments: nutriments ?? {},
      verified: true,
      tags: ["verified", "blockchain"],
      image_data_url: image_data_url || undefined,
      created_t: now,
      last_modified_t: now,
      lang: "en",
    });

    return NextResponse.json({ success: true, code: product.code }, { status: 201 });
  } catch (err) {
    console.error("[api/product/add]", err);
    return NextResponse.json({ error: "Failed to save product" }, { status: 500 });
  }
}
