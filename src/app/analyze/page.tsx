"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Loader2, AlertTriangle, CheckCircle, X, ShieldCheck, TrendingUp, FileX, BadgeCheck } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface FlavorCategory {
  name: string;
  percentage: number;
  color: string;
  examples: string[];
}

interface Flag {
  type: "warning" | "positive";
  message: string;
}

interface AnalysisResult {
  overallScore: number;
  summary: string;
  advice: string;
  flavourProfile: FlavorCategory[];
  flags: Flag[];
  topConcerns: string[];
  topStrengths: string[];
}

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
      <p className="text-xs text-muted-foreground">Inventory Health Score</p>
    </div>
  );
}

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [wrongDoc, setWrongDoc] = useState<{ reason: string } | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    const allowed = [".csv", ".xlsx", ".xls", ".pdf"];
    if (!allowed.some((ext) => f.name.toLowerCase().endsWith(ext))) {
      setError("Please upload a CSV, Excel (.xlsx/.xls), or PDF file.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB.");
      return;
    }
    setError("");
    setResult(null);
    setWrongDoc(null);
    setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function reset() {
    setFile(null);
    setResult(null);
    setWrongDoc(null);
    setError("");
  }

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    setWrongDoc(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/analyze-inventory", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.status === 422 && data.notSnackInventory) {
        setWrongDoc({ reason: data.reason });
        return;
      }
      if (!res.ok) { setError(data.error ?? "Analysis failed."); return; }
      setResult(data);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Inventory Analysis</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload your snack inventory (CSV, Excel, or PDF) to get a nutritionist-grade health breakdown.
        </p>
      </div>

      {/* Upload area */}
      <Card className="rounded-2xl border-border">
        <CardContent className="pt-6">
          {file ? (
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button onClick={reset} className="rounded-full p-1 hover:bg-muted transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <label
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex flex-col items-center justify-center gap-3 h-48 w-full rounded-xl border-2 border-dashed border-border bg-muted/20 cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-colors"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Drop your file here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">CSV, Excel (.xlsx / .xls), PDF · Max 10MB</p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.pdf"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </label>
          )}

          {error && <p className="mt-3 text-sm text-destructive text-center">{error}</p>}

          <Button
            onClick={handleAnalyze}
            disabled={!file || loading}
            className="w-full mt-4 rounded-xl h-11 gap-2"
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing inventory…</>
              : <><TrendingUp className="h-4 w-4" /> Analyze Inventory</>
            }
          </Button>
        </CardContent>
      </Card>

      {/* Wrong document notice */}
      {wrongDoc && (
        <Card className="mt-6 rounded-2xl border-orange-300 bg-orange-50 dark:border-orange-800/40 dark:bg-orange-950/20">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <FileX className="h-8 w-8 text-orange-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-orange-700 dark:text-orange-400">Document not recognised as a snack inventory</p>
                <p className="text-sm text-orange-600 dark:text-orange-500">{wrongDoc.reason}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please upload a snack or food inventory list, purchase order, or product catalogue containing snack items.
                </p>
                <button onClick={reset} className="mt-3 text-sm font-medium text-orange-700 dark:text-orange-400 underline underline-offset-2">
                  Try a different file
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-5">
          <Separator />

          {/* Score + summary */}
          <Card className="rounded-2xl border-border">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ScoreGauge score={result.overallScore} />
                <div className="flex-1 space-y-2">
                  <h2 className="font-bold text-lg">Overall Inventory Health</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Flavour profile pie chart */}
          <Card className="rounded-2xl border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Flavour Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={result.flavourProfile}
                    dataKey="percentage"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {result.flavourProfile.map((cat) => (
                      <Cell key={cat.name} fill={cat.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value}%`]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                  />
                  <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-3 mt-2">
                {result.flavourProfile.map((cat) => (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium" style={{ color: cat.color }}>{cat.name}</span>
                      <span className="font-bold tabular-nums">{cat.percentage}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
                    </div>
                    {cat.examples.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">e.g. {cat.examples.join(", ")}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Strengths + Concerns */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="rounded-2xl border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-green-600">
                  <ShieldCheck className="h-4 w-4" /> Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.topStrengths.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-orange-500">
                  <AlertTriangle className="h-4 w-4" /> Concerns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.topConcerns.map((c, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Flags */}
          {result.flags.length > 0 && (
            <Card className="rounded-2xl border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Nutritional Flags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.flags.map((flag, i) => (
                  <div key={i} className={`flex gap-2 items-start rounded-xl px-3 py-2.5 text-sm ${
                    flag.type === "warning"
                      ? "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400"
                      : "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400"
                  }`}>
                    {flag.type === "warning"
                      ? <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      : <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    }
                    {flag.message}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Nutritionist advice */}
          <Card className="rounded-2xl border-l-4 border-l-emerald-500 border-border bg-emerald-50/50 dark:bg-emerald-950/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-emerald-600" />
                Nutritionist Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{result.advice}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
