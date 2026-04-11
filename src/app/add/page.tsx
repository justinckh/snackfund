import { AddProductForm } from "@/components/add-product-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AddProductPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/search"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Search
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-extrabold tracking-tight">Add Product</h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            ✓ Verified
          </span>
        </div>
        <p className="text-muted-foreground">
          Manually added products are tagged as <strong>Verified</strong> and instantly searchable.
        </p>
      </div>

      <AddProductForm />
    </div>
  );
}
