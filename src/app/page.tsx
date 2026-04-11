import Link from "next/link";
import {
  Scan,
  Search,
  Zap,
  ShieldCheck,
  TrendingUp,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/product";
import { type OFFProduct, productDisplayName, normalizeGrade } from "@/lib/types";

const NUTRI_COLORS: Record<string, string> = {
  a: "bg-green-100 text-green-700",
  b: "bg-lime-100 text-lime-700",
  c: "bg-yellow-100 text-yellow-700",
  d: "bg-orange-100 text-orange-700",
  e: "bg-red-100 text-red-700",
};

function ScoreRing({ grade }: { grade: string | null }) {
  if (!grade) return (
    <div className="h-12 w-12 shrink-0 rounded-xl bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
      ?
    </div>
  );
  return (
    <div className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-lg font-black uppercase ${NUTRI_COLORS[grade] ?? "bg-muted"}`}>
      {grade}
    </div>
  );
}

async function getSuggestions(): Promise<OFFProduct[]> {
  try {
    await connectDB();
    const products = await Product.find(
      { nutriscore_grade: { $in: ["a", "b"] }, product_name_en: { $exists: true, $ne: "" } },
      { code: 1, product_name: 1, product_name_en: 1, brands: 1, categories: 1, nutriscore_grade: 1, nova_group: 1 }
    )
      .limit(5)
      .lean();
    return products as unknown as OFFProduct[];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const suggestions = await getSuggestions();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-16">
      {/* Hero */}
      <section className="flex flex-col items-center text-center gap-6 pt-6">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm">
          <Zap className="h-3.5 w-3.5 text-primary" />
          AI-powered nutrition analysis
        </Badge>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
          Know exactly what&apos;s in
          <br />
          <span className="text-primary">your snack.</span>
        </h1>

        <p className="max-w-xl text-muted-foreground text-lg leading-relaxed">
          Scan a barcode or search any snack to get instant nutrition data, an
          AI health score, and personalized advice — backed by 3M+ products.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/scan" className={cn(buttonVariants({ size: "lg" }), "gap-2 rounded-xl px-6")}>
            <Scan className="h-5 w-5" />
            Scan Barcode
          </Link>
          <Link href="/search" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2 rounded-xl px-6")}>
            <Search className="h-5 w-5" />
            Search Snack
          </Link>
        </div>
      </section>

      {/* Feature pills */}
      <section className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Scan, title: "Instant Scan", desc: "Point your camera at any barcode and get results in seconds." },
          { icon: ShieldCheck, title: "AI Health Score", desc: "Claude analyzes ingredients and gives you a plain-English verdict." },
          { icon: TrendingUp, title: "Nutrition Facts", desc: "Full breakdown of macros, nutri-score, NOVA group and eco-score." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-5 flex gap-4 items-start">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </span>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Suggestions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Suggested Snacks</h2>
          </div>
          <Link href="/search" className="flex items-center gap-1 text-sm text-primary hover:underline">
            Browse all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {suggestions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Connect your database to see suggestions.
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((item) => {
              const name = productDisplayName(item);
              const grade = normalizeGrade(item.nutriscore_grade);
              const category = item.categories?.split(",")?.[0]?.trim();
              return (
                <Link
                  key={item.code}
                  href={`/product/${item.code}`}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 hover:border-primary/40 hover:bg-muted/30 transition-colors group"
                >
                  <ScoreRing grade={grade} />

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {[item.brands, category].filter(Boolean).join(" · ")}
                    </p>
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
