import { cn } from "@/lib/utils";
import { Cpu } from "lucide-react";

const gradients = [
  "from-sky-400 to-blue-700",
  "from-indigo-400 to-violet-700",
  "from-cyan-400 to-blue-700",
  "from-blue-500 to-indigo-800",
  "from-slate-500 to-slate-900",
  "from-violet-400 to-blue-700",
];

export function ProductImage({ name, image, className }: { name: string; image?: string; className?: string }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name} className={cn("h-full w-full object-cover", className)} />;
  }
  const h = Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0);
  return (
    <div className={cn("relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br text-white", gradients[h % gradients.length], className)}>
      <div className="absolute inset-3 rounded-2xl border border-white/15" />
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border border-white/15" />
      <Cpu size={64} strokeWidth={1.25} className="relative drop-shadow-lg" />
    </div>
  );
}
