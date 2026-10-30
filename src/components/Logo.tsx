"use client";

import { useState } from "react";
import { Cpu, Zap } from "lucide-react";
import { shop } from "@/config/shop";
import { cn } from "@/lib/utils";

export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-brand-700 text-cyan-300 shadow-md ring-1 ring-white/15", className)}
        style={{ width: size, height: size }}
      >
        <Cpu size={size * 0.58} strokeWidth={1.7} />
        <Zap className="absolute fill-cyan-300 text-cyan-300" size={size * 0.23} strokeWidth={2.5} />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={shop.logo}
      alt={`Logo ${shop.name}`}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={cn("shrink-0 rounded-full bg-transparent object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
