"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, Loader2, CheckCircle, ImagePlus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const ALLERGEN_OPTIONS = [
  "gluten", "crustaceans", "eggs", "fish", "peanuts",
  "soybeans", "milk", "nuts", "celery", "mustard",
  "sesame", "sulphites", "lupin", "molluscs",
];

type NutrimentKey =
  | "energy-kcal_100g"
  | "fat_100g"
  | "saturated-fat_100g"
  | "carbohydrates_100g"
  | "sugars_100g"
  | "fiber_100g"
  | "proteins_100g"
  | "salt_100g";

const NUTRIMENT_FIELDS: { key: NutrimentKey; label: string; unit: string }[] = [
  { key: "energy-kcal_100g", label: "Calories", unit: "kcal" },
  { key: "fat_100g", label: "Fat", unit: "g" },
  { key: "saturated-fat_100g", label: "Saturated Fat", unit: "g" },
  { key: "carbohydrates_100g", label: "Carbohydrates", unit: "g" },
  { key: "sugars_100g", label: "Sugars", unit: "g" },
  { key: "fiber_100g", label: "Fiber", unit: "g" },
  { key: "proteins_100g", label: "Protein", unit: "g" },
  { key: "salt_100g", label: "Salt", unit: "g" },
];

export function AddProductForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Image
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImageDataUrl(result);
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageDataUrl(null);
    setImagePreview(null);
  }

  // Basic fields
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categories, setCategories] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [nutriScore, setNutriScore] = useState("");
  const [novaGroup, setNovaGroup] = useState("");

  // Nutrition
  const [nutriments, setNutriments] = useState<Partial<Record<NutrimentKey, string>>>({});

  // Allergens
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);

  function toggleAllergen(a: string) {
    setSelectedAllergens((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }

  function setNutriment(key: NutrimentKey, val: string) {
    setNutriments((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const nutrimentsParsed: Partial<Record<NutrimentKey, number>> = {};
    for (const [k, v] of Object.entries(nutriments)) {
      const n = parseFloat(v as string);
      if (!isNaN(n)) nutrimentsParsed[k as NutrimentKey] = n;
    }

    try {
      const res = await fetch("/api/product/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: barcode || undefined,
          product_name: name,
          image_data_url: imageDataUrl || undefined,
          brands: brand,
          categories,
          serving_size: servingSize,
          ingredients_text_en: ingredients,
          allergens_tags: selectedAllergens.map((a) => `en:${a}`),
          nutriscore_grade: nutriScore || undefined,
          nova_group: novaGroup || undefined,
          nutriments: nutrimentsParsed,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push(`/product/${data.code}`), 1200);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <CheckCircle className="h-12 w-12 text-primary" />
        <p className="text-xl font-bold">Product added!</p>
        <p className="text-sm text-muted-foreground">Redirecting to product page…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Image upload */}
      <Card className="rounded-2xl border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Product Image <span className="text-xs font-normal text-muted-foreground">(optional, max 2MB)</span></CardTitle>
        </CardHeader>
        <CardContent>
          {imagePreview ? (
            <div className="relative w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Preview"
                className="h-40 w-40 rounded-xl object-contain bg-muted p-2"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute -top-2 -right-2 rounded-full bg-destructive text-white p-1 hover:bg-destructive/80 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-3 h-40 w-full rounded-xl border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to upload image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          )}
        </CardContent>
      </Card>

      {/* Basic info */}
      <Card className="rounded-2xl border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Product Name <span className="text-destructive">*</span></label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dark Chocolate Bar 85%"
              className="rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Brand</label>
              <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Lindt" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Barcode</label>
              <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="e.g. 3046920028753" className="rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <Input value={categories} onChange={(e) => setCategories(e.target.value)} placeholder="e.g. Chocolate, Snacks" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Serving Size</label>
              <Input value={servingSize} onChange={(e) => setServingSize(e.target.value)} placeholder="e.g. 30g" className="rounded-xl" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scores */}
      <Card className="rounded-2xl border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Scores</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nutri-Score</label>
            <div className="flex gap-1.5">
              {["a", "b", "c", "d", "e"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setNutriScore(nutriScore === g ? "" : g)}
                  className={`flex-1 rounded-lg py-2 text-sm font-black uppercase transition-colors ${
                    nutriScore === g
                      ? g === "a" ? "bg-green-600 text-white"
                        : g === "b" ? "bg-lime-500 text-white"
                        : g === "c" ? "bg-yellow-400 text-black"
                        : g === "d" ? "bg-orange-500 text-white"
                        : "bg-red-600 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">NOVA Group</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNovaGroup(novaGroup === String(n) ? "" : String(n))}
                  className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${
                    novaGroup === String(n)
                      ? n === 1 ? "bg-green-100 text-green-700 ring-2 ring-green-500"
                        : n === 2 ? "bg-lime-100 text-lime-700 ring-2 ring-lime-500"
                        : n === 3 ? "bg-yellow-100 text-yellow-700 ring-2 ring-yellow-500"
                        : "bg-red-100 text-red-700 ring-2 ring-red-500"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nutrition */}
      <Card className="rounded-2xl border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Nutrition <span className="text-xs font-normal text-muted-foreground">per 100g</span></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {NUTRIMENT_FIELDS.map(({ key, label, unit }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-sm font-medium">{label}</label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={nutriments[key] ?? ""}
                    onChange={(e) => setNutriment(key, e.target.value)}
                    placeholder="0"
                    className="rounded-xl pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{unit}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ingredients */}
      <Card className="rounded-2xl border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ingredients</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder="e.g. Cocoa mass, sugar, cocoa butter, vanilla extract."
            rows={3}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </CardContent>
      </Card>

      {/* Allergens */}
      <Card className="rounded-2xl border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Allergens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ALLERGEN_OPTIONS.map((a) => {
              const active = selectedAllergens.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAllergen(a)}
                  className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors ${
                    active
                      ? "border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
                      : "border-border bg-card text-muted-foreground hover:border-orange-300 hover:bg-orange-50/50"
                  }`}
                >
                  {active ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  <span className="capitalize">{a}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      <Button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full rounded-xl h-11 gap-2"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
        ) : (
          <>
            <CheckCircle className="h-4 w-4" />
            Add Verified Product
          </>
        )}
      </Button>
    </form>
  );
}
