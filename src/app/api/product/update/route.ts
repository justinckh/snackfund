import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/product";

export async function PUT(req: Request) {
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

    if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });
    if (!product_name?.trim()) return NextResponse.json({ error: "Product name is required" }, { status: 400 });

    await connectDB();

    const existing = await Product.findOne({ code }).lean();
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    if (!existing.verified) return NextResponse.json({ error: "Only verified products can be updated" }, { status: 403 });

    const updates: Record<string, unknown> = {
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
      last_modified_t: Math.floor(Date.now() / 1000),
    };

    // Only update image if a new one was provided
    if (image_data_url) updates.image_data_url = image_data_url;

    await Product.updateOne({ code }, { $set: updates });

    return NextResponse.json({ success: true, code });
  } catch (err) {
    console.error("[api/product/update]", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}
