import { ScannerView } from "@/components/scanner-view";

export default function ScanPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Scan Barcode</h1>
        <p className="text-muted-foreground mt-1">
          Hold your camera up to any snack barcode to look it up instantly.
        </p>
      </div>
      <ScannerView />
    </div>
  );
}
