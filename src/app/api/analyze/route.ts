import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { type OFFProduct, productDisplayName } from "@/lib/types";

export async function POST(req: Request) {
  const { product }: { product: OFFProduct } = await req.json();

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 503 });
  }

  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const nm = product.nutriments ?? {};
  const name = productDisplayName(product);

  const prompt = `You are a nutrition expert. Analyze this food product and give a concise, helpful assessment.

Product: ${name}
Brand: ${product.brands ?? "Unknown"}
Nutri-Score: ${product.nutriscore_grade?.toUpperCase() ?? "N/A"} (A=best, E=worst)
NOVA Group: ${product.nova_group ?? "N/A"} (1=unprocessed, 4=ultra-processed)
Ingredients: ${product.ingredients_text_en || product.ingredients_text || "Not available"}
Allergens: ${(product.allergens_tags ?? []).map(t => t.replace("en:", "")).join(", ") || "None listed"}

Nutrition per 100g:
- Calories: ${nm["energy-kcal_100g"] ?? "N/A"} kcal
- Fat: ${nm.fat_100g ?? "N/A"}g (saturated: ${nm["saturated-fat_100g"] ?? "N/A"}g)
- Carbohydrates: ${nm.carbohydrates_100g ?? "N/A"}g (sugars: ${nm.sugars_100g ?? "N/A"}g)
- Fiber: ${nm.fiber_100g ?? "N/A"}g
- Protein: ${nm.proteins_100g ?? "N/A"}g
- Salt: ${nm.salt_100g ?? "N/A"}g

Respond ONLY with valid JSON in this exact shape, no markdown, no code fences:
{
  "score": <integer 0-100, overall healthiness>,
  "summary": "<2-3 sentence plain-English verdict>",
  "pros": ["<up to 3 genuine positives>"],
  "cons": ["<up to 3 genuine concerns>"],
  "advice": "<1-2 sentences of practical advice for the consumer>"
}`;

  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 512,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0]?.message?.content ?? "";
    // Strip markdown code fences if model wraps anyway
    const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    const json = JSON.parse(cleaned);

    return NextResponse.json(json);
  } catch (err) {
    console.error("[api/analyze]", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
