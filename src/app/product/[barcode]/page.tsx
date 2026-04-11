import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProductView } from "@/components/product-view";

interface Props {
  params: Promise<{ barcode: string }>;
}

export default async function ProductPage({ params }: Props) {
  const { barcode } = await params;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <ProductView barcode={barcode} />
    </div>
  );
}
