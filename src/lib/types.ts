// Shared types matching the OpenFoodFacts JSONL schema in our DB

export interface Nutriments {
  "energy-kcal_100g"?: number;
  fat_100g?: number;
  "saturated-fat_100g"?: number;
  carbohydrates_100g?: number;
  sugars_100g?: number;
  fiber_100g?: number;
  proteins_100g?: number;
  salt_100g?: number;
}

export interface OFFProduct {
  _id: string;
  code: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  categories?: string;
  categories_tags?: string[];
  ingredients_text?: string;
  ingredients_text_en?: string;
  allergens_tags?: string[];
  nutriscore_grade?: string;
  nutriscore_score?: number;
  nova_group?: number;
  ecoscore_grade?: string;
  nutriments?: Nutriments;
  serving_size?: string;
  serving_quantity?: number;
  // Enriched by our /api/image route
  image_front_url?: string;
  image_front_thumb_url?: string;

  countries_tags?: string[];

  // Manually added
  verified?: boolean;
  tags?: string[];
  image_data_url?: string;
}

/**
 * Constructs the OFF CDN image URL from a barcode.
 * EAN-13: "3017620422003" → "301/762/042/2003"
 * NOTE: requires the product to have an image on OFF servers — falls back to emoji in UI.
 */
export function productImageUrl(code: string, size: 400 | 200 | 100 = 400): string {
  const digits = code.replace(/\D/g, "").padStart(13, "0");
  const path = `${digits.slice(0, 3)}/${digits.slice(3, 6)}/${digits.slice(6, 9)}/${digits.slice(9)}`;
  return `https://images.openfoodfacts.org/images/products/${path}/front_en.${size}.jpg`;
}

/** Friendly display name — prefer English */
export function productDisplayName(p: OFFProduct): string {
  return p.product_name_en || p.product_name || "Unknown Product";
}

/** Normalize grade fields — treat missing/unknown/not-applicable as null */
export function normalizeGrade(grade: string | undefined | null): string | null {
  if (!grade || grade === "unknown" || grade === "not-applicable" || grade === "not_applicable") {
    return null;
  }
  return grade.toLowerCase();
}
