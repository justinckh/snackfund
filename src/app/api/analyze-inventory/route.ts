import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import * as XLSX from "xlsx";

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 503 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const fileName = file.name.toLowerCase();

  let text = "";

  try {
    if (fileName.endsWith(".csv") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
      text = rows.map((r) => r.join(", ")).join("\n");
    } else if (fileName.endsWith(".pdf")) {
      const { getDocumentProxy, extractText } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text: extracted } = await extractText(pdf, { mergePages: true });
      text = extracted;
    } else {
      return NextResponse.json({ error: "Unsupported file type. Use CSV, XLSX, or PDF." }, { status: 400 });
    }
  } catch (err) {
    console.error("[analyze-inventory] parse error:", err);
    return NextResponse.json({ error: `Failed to parse file: ${(err as Error).message}` }, { status: 400 });
  }

  if (!text.trim()) {
    return NextResponse.json({ error: "Could not extract any text from the file." }, { status: 400 });
  }

  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  // ── Step 1: Pre-screening ────────────────────────────────────────────────────
  const screenPrompt = `You are a document classifier. Read the following extracted text and determine if it is a snack or food inventory, purchase order, or product list containing snack/food items.

TEXT:
${text.slice(0, 2000)}

Respond ONLY with valid JSON, no markdown:
{ "isSnackInventory": <true or false>, "reason": "<one sentence explanation>" }`;

  let isSnackInventory = true;
  let screenReason = "";

  try {
    const screen = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 100,
      temperature: 0,
      messages: [{ role: "user", content: screenPrompt }],
    });
    const screenRaw = screen.choices[0]?.message?.content ?? "";
    const screenCleaned = screenRaw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    const screenJson = JSON.parse(screenCleaned);
    isSnackInventory = screenJson.isSnackInventory;
    screenReason = screenJson.reason;
  } catch {
    // If screening fails, proceed anyway
  }

  if (!isSnackInventory) {
    return NextResponse.json({
      notSnackInventory: true,
      reason: screenReason,
    }, { status: 422 });
  }

  // ── Step 2: Full analysis ────────────────────────────────────────────────────
  const prompt = `You are a registered dietitian and nutritionist analyzing a snack inventory for a client. Your role is to provide professional, evidence-based nutritional guidance.

INVENTORY DATA:
${text.slice(0, 4000)}

Analyze this snack inventory thoroughly and respond ONLY with valid JSON in this exact shape, no markdown, no code fences:
{
  "overallScore": <integer 0-100, overall nutritional quality of the inventory>,
  "summary": "<3 sentences: first describe what the inventory contains, then give an overall nutritional assessment, then note the most significant pattern you observe>",
  "advice": "<3-4 sentences of specific, actionable nutritionist recommendations — mention nutrients, portion guidance, or substitution ideas based on what is actually in this inventory>",
  "flavourProfile": [
    { "name": "Sweet", "percentage": <integer>, "color": "#f472b6", "examples": ["<product>", "<product>"] },
    { "name": "Savoury", "percentage": <integer>, "color": "#fb923c", "examples": ["<product>", "<product>"] },
    { "name": "Spicy", "percentage": <integer>, "color": "#ef4444", "examples": ["<product>", "<product>"] },
    { "name": "Nuts & Seeds", "percentage": <integer>, "color": "#a78bfa", "examples": ["<product>", "<product>"] },
    { "name": "Other", "percentage": <integer>, "color": "#94a3b8", "examples": ["<product>", "<product>"] }
  ],
  "flags": [
    { "type": "warning", "message": "<specific nutritional concern with context — e.g. high sodium, excess added sugar>" },
    { "type": "warning", "message": "<second concern>" },
    { "type": "positive", "message": "<a genuine nutritional strength of this inventory>" },
    { "type": "positive", "message": "<second strength>" }
  ],
  "topConcerns": ["<specific concern with nutrient detail>", "<concern 2>", "<concern 3>"],
  "topStrengths": ["<specific strength with nutrient detail>", "<strength 2>", "<strength 3>"]
}

Rules:
- flavourProfile percentages must add up to exactly 100
- Omit any flavour category with 0% rather than including it
- Base your analysis only on what is in the inventory, not generic advice
- Be specific — name actual products from the inventory in your flags and concerns`;

  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 1200,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    const json = JSON.parse(cleaned);

    return NextResponse.json(json);
  } catch (err) {
    console.error("[api/analyze-inventory]", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
