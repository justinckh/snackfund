"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CameraOff, Flashlight, FlashlightOff, Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ScanState = "idle" | "requesting" | "scanning" | "found" | "error";

export function ScannerView() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<ScanState>("idle");
  const [manualBarcode, setManualBarcode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [torch, setTorch] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startCamera() {
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("scanning");
      startDecoding();
    } catch {
      setErrorMsg("Camera permission denied. Enter barcode manually below.");
      setState("error");
    }
  }

  async function startDecoding() {
    // Dynamic import to avoid SSR issues
    const { BrowserMultiFormatReader } = await import("@zxing/browser");
    const reader = new BrowserMultiFormatReader();
    if (!videoRef.current) return;

    reader.decodeFromVideoElement(videoRef.current, (result, err) => {
      if (result) {
        setState("found");
        stopCamera();
        router.push(`/product/${result.getText()}`);
      }
      // err is normal when no barcode is in frame
      void err;
    });
  }

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const newVal = !torch;
    await track.applyConstraints({ advanced: [{ torch: newVal } as MediaTrackConstraintSet] });
    setTorch(newVal);
  }

  useEffect(() => () => stopCamera(), []);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = manualBarcode.trim();
    if (trimmed) router.push(`/product/${trimmed}`);
  }

  return (
    <div className="space-y-6">
      {/* Camera box */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-border bg-muted/40 aspect-[4/3] max-h-[480px] flex items-center justify-center">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          muted
        />

        {state === "scanning" && (
          <>
            {/* Scan line animation */}
            <div className="absolute inset-x-8 h-0.5 bg-primary/80 rounded-full animate-bounce top-1/2" />
            {/* Corner brackets */}
            <div className="absolute inset-8 pointer-events-none">
              {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map(
                (pos, i) => (
                  <span
                    key={i}
                    className={`absolute h-8 w-8 border-primary ${pos.includes("top") ? "border-t-2" : "border-b-2"} ${pos.includes("left") ? "border-l-2" : "border-r-2"} rounded-sm`}
                  />
                )
              )}
            </div>
          </>
        )}

        {state === "idle" && (
          <div className="flex flex-col items-center gap-4 text-center p-8">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </span>
            <div>
              <p className="font-semibold">Camera not started</p>
              <p className="text-sm text-muted-foreground">Tap the button below to begin scanning</p>
            </div>
          </div>
        )}

        {state === "requesting" && (
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Requesting camera access…</p>
          </div>
        )}

        {state === "found" && (
          <div className="flex flex-col items-center gap-3 text-center">
            <ScanLine className="h-8 w-8 text-primary" />
            <p className="font-semibold">Barcode found! Loading…</p>
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col items-center gap-3 text-center p-8">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
              <CameraOff className="h-6 w-6 text-destructive" />
            </span>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
          </div>
        )}

        {/* Torch toggle */}
        {state === "scanning" && (
          <button
            onClick={toggleTorch}
            className="absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
          >
            {torch ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center">
        {state === "scanning" ? (
          <Button
            variant="outline"
            onClick={() => {
              stopCamera();
              setState("idle");
            }}
            className="rounded-xl gap-2"
          >
            <CameraOff className="h-4 w-4" />
            Stop Camera
          </Button>
        ) : (
          <Button
            onClick={startCamera}
            disabled={state === "requesting" || state === "found"}
            className="rounded-xl gap-2 px-8"
          >
            <Camera className="h-4 w-4" />
            {state === "requesting" ? "Starting…" : "Start Camera"}
          </Button>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground uppercase tracking-widest">or enter manually</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Manual entry */}
      <form onSubmit={handleManualSubmit} className="flex gap-2 max-w-sm mx-auto">
        <Input
          placeholder="e.g. 0028400315227"
          value={manualBarcode}
          onChange={(e) => setManualBarcode(e.target.value)}
          className="rounded-xl"
        />
        <Button type="submit" className="rounded-xl shrink-0">
          Look up
        </Button>
      </form>
    </div>
  );
}
