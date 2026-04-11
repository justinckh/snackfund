import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/product";

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  await connectDB();

  const product = await Product.findOne({ code }).lean();

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (!product.verified) {
    return NextResponse.json({ error: "Only verified products can be deleted" }, { status: 403 });
  }

  await Product.deleteOne({ code });

  return NextResponse.json({ success: true });
}
