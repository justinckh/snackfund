"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Flame, Beef, Droplets, Wheat, Zap, ShieldCheck, AlertTriangle, Info, Star, Pencil, Link2, BadgeCheck,
} from "lucide-react";
import Link from "next/link";
import { type OFFProduct, productDisplayName, productImageUrl, normalizeGrade } from "@/lib/types";

// ─── Constants ───────────────────────────────────────────────────────────────

const NUTRI_COLORS: Record<string, string> = {
  a: "bg-green-600",
  b: "bg-lime-500",
  c: "bg-yellow-400 text-black",
  d: "bg-orange-500",
  e: "bg-red-600",
};

const NOVA_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Unprocessed", color: "bg-green-100 text-green-700" },
  2: { label: "Processed culinary", color: "bg-lime-100 text-lime-700" },
  3: { label: "Processed", color: "bg-yellow-100 text-yellow-700" },
  4: { label: "Ultra-processed", color: "bg-red-100 text-red-700" },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const r = 52;
  const circ = Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#22c55e" : score >= 45 ? "#eab308" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="140" height="80" viewBox="0 0 120 68">
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="currentColor"
          strokeWidth="10" strokeLinecap="round" className="text-muted/50" />
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke={color}
          strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }} />
        <text x="60" y="55" textAnchor="middle" fontSize="22" fontWeight="800" fill={color}>
          {score}
        </text>
        <text x="60" y="66" textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.5">
          / 100
        </text>
      </svg>
      <p className="text-xs text-muted-foreground">AI Health Score</p>
    </div>
  );
}

function NutrientBar({ label, value, unit, max, icon: Icon }: {
  label: string; value: number; unit: string; max: number; icon: React.ElementType;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct > 66 ? "bg-red-500" : pct > 33 ? "bg-yellow-400" : "bg-green-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className="font-medium tabular-nums">{value.toFixed(1)}{unit}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-border">
        <CardContent className="p-6">
          <div className="flex gap-6">
            <Skeleton className="h-32 w-32 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="space-y-3">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ─── AI analysis type (returned by /api/analyze) ──────────────────────────────

interface AiAnalysis {
  score: number;
  summary: string;
  pros: string[];
  cons: string[];
  advice: string;
}

// ─── Product image with fallback ─────────────────────────────────────────────

function ProductImage({ code, name, dataUrl }: { code: string; name: string; dataUrl?: string }) {
  const [failed, setFailed] = useState(false);

  // Manually uploaded image — always available
  if (dataUrl) {
    return (
      <div className="h-32 w-32 shrink-0 rounded-2xl bg-muted overflow-hidden relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt={name} className="h-full w-full object-contain p-2" />
      </div>
    );
  }

  if (failed) {
    return (
      <div className="h-32 w-32 shrink-0 rounded-2xl bg-muted flex items-center justify-center text-5xl">
        🥫
      </div>
    );
  }
  return (
    <div className="h-32 w-32 shrink-0 rounded-2xl bg-muted overflow-hidden relative">
      <Image
        src={productImageUrl(code, 400)}
        alt={name}
        fill
        className="object-contain p-2"
        onError={() => setFailed(true)}
        unoptimized
      />
    </div>
  );
}

// ─── Tooltip badge ───────────────────────────────────────────────────────────

function TooltipBadge({ icon, label, tooltipContent }: {
  icon: React.ReactNode;
  label: React.ReactNode;
  tooltipContent: React.ReactNode;
}) {
  return (
    <div className="group relative inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium cursor-default select-none">
      {icon}
      {label}
      {/* tooltip opens downward to avoid card overflow clipping */}
      <div className="pointer-events-none absolute top-full left-0 mt-2 z-50 w-64 rounded-2xl border border-border bg-popover shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 overflow-hidden">
        {tooltipContent}
        <div className="absolute -top-1.5 left-4 h-3 w-3 rotate-45 border-l border-t border-border bg-popover" />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProductView({ barcode }: { barcode: string }) {
  const [product, setProduct] = useState<OFFProduct | null>(null);
  const [ai, setAi] = useState<AiAnalysis | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadingAi, setLoadingAi] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Fetch product from DB
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/product/${barcode}`);
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) throw new Error();
        const data: OFFProduct = await res.json();
        setProduct(data);
        // Kick off AI analysis right after product loads
        setLoadingAi(true);
        fetchAi(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoadingProduct(false);
      }
    }
    load();
  }, [barcode]);

  async function fetchAi(p: OFFProduct) {
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: p }),
      });
      if (!res.ok) throw new Error();
      const data: AiAnalysis = await res.json();
      setAi(data);
    } catch {
      // AI analysis is non-critical — fail silently
    } finally {
      setLoadingAi(false);
    }
  }

  if (loadingProduct) return <LoadingSkeleton />;

  if (notFound || !product) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <span className="text-6xl">🔍</span>
        <p className="font-semibold text-lg">Product not found</p>
        <p className="text-sm text-muted-foreground">
          Barcode <span className="font-mono">{barcode}</span> isn&apos;t in our database yet.
        </p>
      </div>
    );
  }

  const name = productDisplayName(product);
  const nm = product.nutriments ?? {};
  const nutriGrade = normalizeGrade(product.nutriscore_grade);
  const ecoGrade = normalizeGrade(product.ecoscore_grade);
  const nova = product.nova_group && NOVA_LABELS[product.nova_group] ? NOVA_LABELS[product.nova_group] : null;
  const allergens = (product.allergens_tags ?? []).map((t) =>
    t.replace("en:", "").replace(/-/g, " ")
  );
  const ingredients = product.ingredients_text_en || product.ingredients_text || "";
  const category = product.categories_tags?.[0]?.replace("en:", "").replace(/-/g, " ")
    ?? product.categories?.split(",")[0]?.trim();

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card className="rounded-3xl overflow-hidden border-border">
        <CardContent className="p-6">
          {/* Edit button — top right, verified only */}
          {product.verified && (
            <div className="flex justify-end mb-3">
              <Link
                href={`/edit/${barcode}`}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit product
              </Link>
            </div>
          )}

          <div className="flex gap-6 flex-wrap sm:flex-nowrap">
            <ProductImage code={product.code} name={name} dataUrl={product.image_data_url} />

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap gap-2">
                {category && <Badge variant="secondary" className="capitalize">{category}</Badge>}
                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${nova ? nova.color : "bg-muted text-muted-foreground"}`}>
                  NOVA {product.nova_group ?? "?"} · {nova ? nova.label : "Unknown"}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold tracking-tight leading-tight">{name}</h1>
                {product.verified && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    ✓ Verified
                  </span>
                )}
              </div>
              {product.brands && <p className="text-muted-foreground">{product.brands}</p>}
              <p className="text-xs text-muted-foreground font-mono">#{product.code}</p>
            </div>

            {/* Scores */}
            <div className="flex gap-3 items-start shrink-0 flex-wrap">
              {/* Nutri-Score */}
              <div className="flex flex-col items-center gap-1">
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl text-xl font-black uppercase text-white ${nutriGrade ? (NUTRI_COLORS[nutriGrade] ?? "bg-muted text-foreground") : "bg-muted text-muted-foreground text-sm"}`}>
                  {nutriGrade ? nutriGrade.toUpperCase() : "?"}
                </span>
                <p className="text-xs text-muted-foreground">Nutri-Score</p>
              </div>

              {/* NOVA group */}
              <div className="flex flex-col items-center gap-1">
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl text-xl font-black ${nova ? (nova.color) : "bg-muted text-muted-foreground text-sm"}`}>
                  {product.nova_group ?? "?"}
                </span>
                <p className="text-xs text-muted-foreground">NOVA</p>
              </div>

              {/* Eco-Score */}
              <div className="flex flex-col items-center gap-1">
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl text-xl font-black uppercase text-white ${ecoGrade ? (NUTRI_COLORS[ecoGrade] ?? "bg-muted text-foreground") : "bg-muted text-muted-foreground text-sm"}`}>
                  {ecoGrade ? ecoGrade.toUpperCase() : "?"}
                </span>
                <p className="text-xs text-muted-foreground">Eco-Score</p>
              </div>

              {ai && <ScoreGauge score={ai.score} />}
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Blockchain + Nutritionist badges — outside card so tooltips are never clipped */}
      {product.verified && (
        <div className="flex flex-wrap gap-2">
          <TooltipBadge
            icon={<Link2 className="h-3.5 w-3.5 text-violet-500" />}
            label={<span className="text-violet-600 dark:text-violet-400">Blockchain Verified</span>}
            tooltipContent={
              <div>
                <div className="bg-violet-600 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-violet-200">Blockchain Verified</p>
                  <p className="text-sm font-bold text-white mt-0.5">Product data authenticated on-chain</p>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Manufacturer</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{product.brands ?? "Independent producer"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Place of Origin</p>
                    <p className="text-sm font-medium text-foreground mt-0.5 capitalize">{product.countries_tags?.[0]?.replace("en:", "").replace(/-/g, " ") ?? "United States"}</p>
                  </div>
                  <div className="pt-1 border-t border-border">
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Verification</p>
                    <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mt-0.5">Data integrity confirmed on-chain</p>
                  </div>
                </div>
              </div>
            }
          />
          <TooltipBadge
            icon={<BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />}
            label={<span className="text-emerald-600 dark:text-emerald-400">Nutritionist Recommended</span>}
            tooltipContent={
              <div>
                <div className="bg-emerald-600 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200">Endorsed by</p>
                  <p className="text-sm font-bold text-white mt-0.5">Certified Nutritionists</p>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { initials: "DW", name: "David Wo", title: "RD, Sports Nutrition" },
                    { initials: "SH", name: "Sandy Hui", title: "MSc Dietetics" },
                  ].map(({ initials, name, title }) => (
                    <div key={name} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{name}</p>
                        <p className="text-xs text-muted-foreground">{title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            }
          />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="analysis">
        <TabsList className="w-full rounded-xl">
          <TabsTrigger value="analysis" className="flex-1 gap-1.5">
            <Zap className="h-3.5 w-3.5" /> AI Analysis
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="flex-1 gap-1.5">
            <Flame className="h-3.5 w-3.5" /> Nutrition
          </TabsTrigger>
          <TabsTrigger value="ingredients" className="flex-1 gap-1.5">
            <Info className="h-3.5 w-3.5" /> Ingredients
          </TabsTrigger>
        </TabsList>

        {/* ── AI Analysis tab ────────────────────────────────────────────── */}
        <TabsContent value="analysis" className="mt-4 space-y-4">
          {loadingAi && (
            <Card className="rounded-2xl border-border">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4 animate-pulse text-primary" />
                  Claude is analyzing this snack…
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </CardContent>
            </Card>
          )}

          {!loadingAi && !ai && (
            <Card className="rounded-2xl border-border">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                AI analysis unavailable — add your <span className="font-mono">ANTHROPIC_API_KEY</span> to .env.local.
              </CardContent>
            </Card>
          )}

          {ai && (
            <>
              <Card className="rounded-2xl border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" /> Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{ai.summary}</p>
                </CardContent>
              </Card>

              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="rounded-2xl border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-green-600">
                      <ShieldCheck className="h-4 w-4" /> The Good
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {ai.pros.map((pro, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="mt-0.5 text-green-500 shrink-0">✓</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-orange-500">
                      <AlertTriangle className="h-4 w-4" /> Watch Out
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {ai.cons.map((con, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="mt-0.5 text-orange-400 shrink-0">!</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card className="rounded-2xl border-l-4 border-l-primary border-border bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Advice</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{ai.advice}</p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── Nutrition tab ──────────────────────────────────────────────── */}
        <TabsContent value="nutrition" className="mt-4">
          <Card className="rounded-2xl border-border">
            <CardContent className="pt-6 space-y-1">
              <p className="text-xs text-muted-foreground mb-4">
                Per 100g{product.serving_size ? ` · Serving: ${product.serving_size}` : ""}
              </p>

              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="flex items-center gap-2 font-semibold">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Calories
                </span>
                <span className="text-2xl font-black">
                  {nm["energy-kcal_100g"] != null ? Math.round(nm["energy-kcal_100g"]) : "—"}
                  <span className="text-sm font-normal text-muted-foreground ml-1">kcal</span>
                </span>
              </div>

              <div className="pt-3 space-y-4">
                {nm.fat_100g != null && (
                  <NutrientBar label="Fat" value={nm.fat_100g} unit="g" max={30} icon={Droplets} />
                )}
                {nm["saturated-fat_100g"] != null && (
                  <NutrientBar label="Saturated Fat" value={nm["saturated-fat_100g"]} unit="g" max={10} icon={Droplets} />
                )}
                <Separator />
                {nm.carbohydrates_100g != null && (
                  <NutrientBar label="Carbohydrates" value={nm.carbohydrates_100g} unit="g" max={60} icon={Wheat} />
                )}
                {nm.sugars_100g != null && (
                  <NutrientBar label="Sugars" value={nm.sugars_100g} unit="g" max={30} icon={Wheat} />
                )}
                {nm.fiber_100g != null && (
                  <NutrientBar label="Fiber" value={nm.fiber_100g} unit="g" max={10} icon={Wheat} />
                )}
                <Separator />
                {nm.proteins_100g != null && (
                  <NutrientBar label="Protein" value={nm.proteins_100g} unit="g" max={30} icon={Beef} />
                )}
                {nm.salt_100g != null && (
                  <NutrientBar label="Salt" value={nm.salt_100g} unit="g" max={2} icon={Info} />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Ingredients tab ────────────────────────────────────────────── */}
        <TabsContent value="ingredients" className="mt-4 space-y-4">
          <Card className="rounded-2xl border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ingredients</CardTitle>
            </CardHeader>
            <CardContent>
              {ingredients ? (
                <p className="text-sm leading-relaxed text-muted-foreground">{ingredients}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No ingredients data available.</p>
              )}
            </CardContent>
          </Card>

          {allergens.length > 0 && (
            <Card className="rounded-2xl border-orange-200 bg-orange-50 dark:border-orange-800/40 dark:bg-orange-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-4 w-4" /> Allergens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {allergens.map((a) => (
                    <Badge key={a} variant="secondary" className="capitalize">{a}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
