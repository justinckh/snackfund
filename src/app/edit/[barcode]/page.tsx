import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/product";
import { EditProductForm } from "@/components/edit-product-form";
import type { OFFProduct } from "@/lib/types";

interface Props {
  params: Promise<{ barcode: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { barcode } = await params;

  await connectDB();
  const raw = await Product.findOne({ code: barcode, verified: true }).lean();

  if (!raw) notFound();

  const product = JSON.parse(JSON.stringify(raw));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href={`/product/${barcode}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to product
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-extrabold tracking-tight">Edit Product</h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            ✓ Verified
          </span>
        </div>
        <p className="text-muted-foreground text-sm">Update details or delete this product.</p>
      </div>

      <EditProductForm product={product as OFFProduct} />
    </div>
  );
}
