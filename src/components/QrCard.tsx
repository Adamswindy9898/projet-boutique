"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Printer } from "lucide-react";
import { shop } from "@/config/shop";

function useOrigin() {
  const [url, setUrl] = useState("");
  useEffect(() => setUrl(window.location.origin), []);
  return url;
}

export function QrMini({ size = 72 }: { size?: number }) {
  const url = useOrigin();
  if (!url) return null;
  return (
    <div className="inline-block rounded-lg bg-white p-1">
      <QRCodeSVG value={url} size={size} level="M" />
    </div>
  );
}

export function QrCard() {
  const url = useOrigin();
  const ref = useRef<HTMLDivElement>(null);

  const download = () => {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data], { type: "image/svg+xml" }));
    a.download = "code-qr-boutique.svg";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div ref={ref} className="rounded-3xl bg-white p-4 shadow-lg ring-1 ring-slate-100">
        {url ? <QRCodeSVG value={url} size={168} level="M" /> : <div className="h-[168px] w-[168px] animate-pulse rounded-xl bg-slate-100" />}
      </div>
      <p className="text-sm font-semibold text-slate-700">Scannez pour ouvrir la boutique {shop.name}</p>
      <div className="no-print flex gap-2">
        <button onClick={download} className="btn bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
          <Download size={15} /> Télécharger
        </button>
        <button onClick={() => window.print()} className="btn bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
          <Printer size={15} /> Imprimer
        </button>
      </div>
    </div>
  );
}
