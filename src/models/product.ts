import mongoose, { Schema, type Document } from "mongoose";

// Key fields from the OpenFoodFacts schema.
// Full field list: https://static.openfoodfacts.org/data/data-fields.txt
export interface IProduct extends Document {
  code: string;                   // barcode (EAN, UPC, etc.)
  product_name: string;
  product_name_en?: string;
  brands?: string;
  categories?: string;
  categories_tags?: string[];
  image_url?: string;
  image_thumb_url?: string;
  ingredients_text?: string;
  ingredients_text_en?: string;
  allergens?: string;
  allergens_tags?: string[];

  // Nutri-Score
  nutriscore_grade?: string;      // a, b, c, d, e
  nutriscore_score?: number;

  // NOVA group (processing level)
  nova_group?: number;            // 1-4

  // Eco-score
  ecoscore_grade?: string;

  // Nutrition per 100g
  nutriments?: {
    energy_100g?: number;         // kJ
    "energy-kcal_100g"?: number;
    fat_100g?: number;
    "saturated-fat_100g"?: number;
    carbohydrates_100g?: number;
    sugars_100g?: number;
    fiber_100g?: number;
    proteins_100g?: number;
    salt_100g?: number;
    sodium_100g?: number;
  };

  serving_size?: string;
  serving_quantity?: number;

  countries?: string;
  countries_tags?: string[];
  lang?: string;

  // Timestamps from OFF
  created_t?: number;
  last_modified_t?: number;

  // Manually added products
  verified?: boolean;
  tags?: string[];
  image_data_url?: string; // base64 for manually uploaded images
}

const ProductSchema = new Schema<IProduct>(
  {
    code: { type: String, index: true },
    product_name: { type: String },
    product_name_en: { type: String },
    brands: { type: String },
    categories: { type: String },
    categories_tags: [{ type: String }],
    image_url: { type: String },
    image_thumb_url: { type: String },
    ingredients_text: { type: String },
    ingredients_text_en: { type: String },
    allergens: { type: String },
    allergens_tags: [{ type: String }],
    nutriscore_grade: { type: String },
    nutriscore_score: { type: Number },
    nova_group: { type: Number },
    ecoscore_grade: { type: String },
    nutriments: { type: Schema.Types.Mixed },
    serving_size: { type: String },
    serving_quantity: { type: Number },
    countries: { type: String },
    countries_tags: [{ type: String }],
    lang: { type: String },
    created_t: { type: Number },
    last_modified_t: { type: Number },
    verified: { type: Boolean, default: false },
    tags: [{ type: String }],
    image_data_url: { type: String },
  },
  {
    // OpenFoodFacts dump uses the "products" collection
    collection: "products",
    // Don't enforce strict schema — OFF has 200+ fields
    strict: false,
  }
);

// Text index for search (includes tags so "verified" is searchable)
ProductSchema.index(
  { product_name: "text", brands: "text", categories: "text", tags: "text" },
  { weights: { product_name: 10, brands: 5, categories: 1, tags: 3 }, name: "product_search" }
);

export const Product =
  mongoose.models.Product ?? mongoose.model<IProduct>("Product", ProductSchema);
