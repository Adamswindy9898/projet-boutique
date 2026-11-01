"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && navigator.standalone === true);
    const ios =
      /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsStandalone(standalone);
    setIsIos(ios);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setIsStandalone(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (isStandalone || dismissed || (!installEvent && !isIos)) return null;

  const install = async () => {
    if (!installEvent) {
      setShowIosGuide((current) => !current);
      return;
    }
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") setInstallEvent(null);
  };

  return (
    <aside className="no-print fixed bottom-4 right-4 z-[70] w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-brand-50 p-2 text-brand-700">
          <Download size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">Installer OUSMATECH</p>
          <p className="mt-0.5 text-xs text-slate-500">Ajoutez l’application à l’écran d’accueil de votre appareil.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            setShowIosGuide(false);
          }}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Masquer l’installation"
        >
          <X size={16} />
        </button>
      </div>
      <button type="button" onClick={install} className="btn-primary mt-3 w-full">
        {isIos && !installEvent ? <Share size={16} /> : <Download size={16} />}
        {isIos && !installEvent ? "Comment installer" : "Installer l’application"}
      </button>
      {isIos && showIosGuide && (
        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
          Dans Safari, touchez <strong>Partager</strong>, puis <strong>Sur l’écran d’accueil</strong> et enfin <strong>Ajouter</strong>.
        </p>
      )}
    </aside>
  );
}
