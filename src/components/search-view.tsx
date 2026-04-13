"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Loader2, ChevronRight, PackageSearch, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type OFFProduct, productDisplayName, productImageUrl, normalizeGrade } from "@/lib/types";

const NUTRI_COLORS: Record<string, string> = {
  a: "bg-green-600 text-white",
  b: "bg-lime-500 text-white",
  c: "bg-yellow-400 text-black",
  d: "bg-orange-500 text-white",
  e: "bg-red-600 text-white",
};

const NOVA_LABELS: Record<number, string> = {
  1: "Unprocessed",
  2: "Processed culinary",
  3: "Processed",
  4: "Ultra-processed",
};

const QUICK_FILTERS = [
  { label: "🥗 Healthy picks", q: "__healthy__" },
  { label: "✓ Verified", q: "verified" },
  { label: "⬡ Blockchain Verified", q: "verified" },
  { label: "🍫 Chocolate", q: "chocolate" },
  { label: "🥤 Beverages", q: "beverage" },
  { label: "🧀 Dairy", q: "dairy" },
  { label: "🍪 Cookies", q: "cookies" },
  { label: "🥜 Nuts", q: "nuts" },
  { label: "🍿 Snacks", q: "snacks" },
];

interface SearchResponse {
  total: number;
  results: OFFProduct[];
}

function ResultSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
      <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

function ProductImage({ code, name, dataUrl }: { code: string; name: string; dataUrl?: string }) {
  const [failed, setFailed] = useState(false);

  if (dataUrl) {
    return (
      <div className="h-14 w-14 rounded-xl bg-muted shrink-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt={name} className="h-full w-full object-contain p-1" />
      </div>
    );
  }

  if (failed) {
    return (
      <div className="h-14 w-14 rounded-xl bg-muted shrink-0 flex items-center justify-center text-xl select-none">
        🥫
      </div>
    );
  }
  return (
    <div className="h-14 w-14 rounded-xl bg-muted shrink-0 overflow-hidden relative">
      <Image
        src={productImageUrl(code, 100)}
        alt={name}
        fill
        className="object-contain p-1"
        onError={() => setFailed(true)}
        unoptimized
      />
    </div>
  );
}

function ProductCard({ item }: { item: OFFProduct }) {
  const name = productDisplayName(item);
  const grade = normalizeGrade(item.nutriscore_grade);
  const category =
    item.categories_tags?.[0]?.replace("en:", "").replace(/-/g, " ") ??
    item.categories?.split(",")?.[0]?.trim();
  const novaLabel = item.nova_group ? NOVA_LABELS[item.nova_group] : null;

  return (
    <Link
      href={`/product/${item.code}`}
      className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-muted/30 transition-colors group"
    >
      <ProductImage code={item.code} name={name} dataUrl={item.image_data_url} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold truncate">{name}</p>
          {item.verified && (
            <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              ✓ Verified
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {[item.brands, category ?? novaLabel].filter(Boolean).join(" · ")}
        </p>
      </div>

      {grade ? (
        <span className={`inline-flex items-center justify-center h-7 w-7 rounded-lg text-xs font-black uppercase shrink-0 ${NUTRI_COLORS[grade] ?? "bg-muted"}`}>
          {grade}
        </span>
      ) : null}

      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}

export function SearchView() {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [results, setResults] = useState<OFFProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [isDefault, setIsDefault] = useState(true);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useTransition();

  async function fetchSearch(q: string, offset: number): Promise<SearchResponse> {
    const params = new URLSearchParams({ offset: String(offset) });
    if (q) params.set("q", q);
    const res = await fetch(`/api/search?${params}`);
    if (!res.ok) throw new Error("Search failed");
    return res.json();
  }

  // Load defaults on mount
  useEffect(() => {
    startTransition(async () => {
      try {
        const data = await fetchSearch("", 0);
        setResults(data.results);
        setTotal(data.total);
        setIsDefault(true);
      } catch { /* silent */ }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(q: string) {
    const trimmed = q.trim();
    // "Healthy picks" uses empty query (default sorted by grade) — show label only
    const apiQ = trimmed === "__healthy__" ? "" : trimmed;
    const displayQ = trimmed === "__healthy__" ? "Healthy picks" : trimmed;

    if (!trimmed) return;
    setActiveQuery(displayQ);
    setIsDefault(trimmed === "__healthy__");
    setResults([]);

    startTransition(async () => {
      try {
        const data = await fetchSearch(apiQ, 0);
        setResults(data.results);
        setTotal(data.total);
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  function handleClear() {
    setQuery("");
    setActiveQuery("");
    setIsDefault(true);
    setResults([]);
    startTransition(async () => {
      try {
        const data = await fetchSearch("", 0);
        setResults(data.results);
        setTotal(data.total);
      } catch { /* silent */ }
    });
  }

  function handleLoadMore() {
    const apiQ = isDefault ? "" : activeQuery === "Healthy picks" ? "" : activeQuery;
    setIsLoadingMore(async () => {
      try {
        const data = await fetchSearch(apiQ, results.length);
        setResults((prev) => {
          const existingCodes = new Set(prev.map((r) => r.code));
          const fresh = data.results.filter((r) => !existingCodes.has(r.code));
          return [...prev, ...fresh];
        });
        setTotal(data.total);
      } catch { /* silent */ }
    });
  }

  const hasMore = results.length < total;

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSearch(query); }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Name, brand, barcode, category, ingredient…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-9 rounded-xl h-11"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" disabled={isPending || !query.trim()} className="rounded-xl px-6 h-11">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </form>

      {/* Quick filter chips */}
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map(({ label, q }) => (
          <button
            key={label}
            onClick={() => { setQuery(""); handleSearch(q); }}
            className="rounded-full border border-border bg-card px-3 py-1 text-sm hover:border-primary/60 hover:bg-muted transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Hint */}
      <p className="text-xs text-muted-foreground">
        Search by{" "}
        {["product name", "brand", "barcode", "category", "ingredient", "food group"].map((t, i, arr) => (
          <span key={t}><span className="font-medium text-foreground">{t}</span>{i < arr.length - 1 ? ", " : ""}</span>
        ))}
      </p>

      {/* Loading skeletons */}
      {isPending && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <ResultSkeleton key={i} />)}
        </div>
      )}

      {/* Error */}
      {error && !isPending && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* Results */}
      {!isPending && !error && results.length > 0 && (
        <div className="space-y-4">
          {/* Count line */}
          <p className="text-sm text-muted-foreground">
            {isDefault
              ? `${total.toLocaleString()} products in database — showing ${results.length}`
              : <>
                  <span className="font-semibold text-foreground">{total.toLocaleString()}</span>
                  {" "}result{total !== 1 ? "s" : ""} for &quot;{activeQuery}&quot; — showing {results.length}
                </>
            }
          </p>

          {/* Result cards */}
          <div className="space-y-3">
            {results.map((item) => <ProductCard key={item.code} item={item} />)}
          </div>

          {/* Show more */}
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="w-full rounded-2xl border border-dashed border-border py-4 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoadingMore
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Loading…</>
                : <>Show {Math.min(10, total - results.length)} more of {(total - results.length).toLocaleString()} remaining</>
              }
            </button>
          )}
        </div>
      )}

      {/* No results */}
      {!isPending && !error && results.length === 0 && activeQuery && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <PackageSearch className="h-8 w-8 text-muted-foreground" />
          </span>
          <div>
            <p className="font-semibold">No snacks found</p>
            <p className="text-sm text-muted-foreground">Try a different name, brand, or scan the barcode directly.</p>
          </div>
        </div>
      )}
    </div>
  );
}
