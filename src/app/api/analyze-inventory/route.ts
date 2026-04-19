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

  const prompt = `You are a nutrition expert analyzing a snack inventory. The following is data extracted from an inventory document.

INVENTORY DATA:
${text.slice(0, 4000)}

Analyze this snack inventory and respond ONLY with valid JSON in this exact shape, no markdown, no code fences:
{
  "overallScore": <integer 0-100, overall healthiness of the inventory>,
  "summary": "<2-3 sentence plain-English overview of the inventory health>",
  "advice": "<2-3 sentences of practical advice to improve the inventory>",
  "categories": [
    { "name": "Healthy", "percentage": <integer>, "color": "#22c55e", "examples": ["<product>", "<product>"] },
    { "name": "Moderate", "percentage": <integer>, "color": "#eab308", "examples": ["<product>", "<product>"] },
    { "name": "Unhealthy", "percentage": <integer>, "color": "#ef4444", "examples": ["<product>", "<product>"] }
  ],
  "flags": [
    { "type": "warning", "message": "<specific concern about the inventory>" },
    { "type": "positive", "message": "<something good about the inventory>" }
  ],
  "topConcerns": ["<concern 1>", "<concern 2>", "<concern 3>"],
  "topStrengths": ["<strength 1>", "<strength 2>", "<strength 3>"]
}

Make sure the category percentages add up to 100.`;

  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 1024,
      temperature: 0.3,
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
