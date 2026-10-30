"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, KeyRound, RotateCcw, UserRound } from "lucide-react";
import { shop } from "@/config/shop";
import { Logo } from "@/components/Logo";
import { loginUser, resetAdminAccess, restoreAuthSession } from "@/lib/auth";

export default function ConnexionPage() {
  const router = useRouter();
  const [username, setUsername] = useState(shop.initialAdminUsername);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryDetails, setRecoveryDetails] = useState<{ username: string; password: string } | null>(null);

  useEffect(() => {
    restoreAuthSession()
      .then((session) => {
        if (session) router.replace("/admin");
      })
      .catch(() => setError("Impossible de vérifier les comptes sur cet appareil."));
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const session = await loginUser(username, password);
      if (!session) {
        setError("Identifiant ou mot de passe incorrect.");
        setPassword("");
        return;
      }
      router.push("/admin");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Connexion impossible. Réessayez.");
    } finally {
      setBusy(false);
    }
  };

  const recoverAdmin = async () => {
    setBusy(true);
    setError("");
    try {
      const credentials = await resetAdminAccess();
      setUsername(credentials.username);
      setPassword("");
      setRecoveryDetails(credentials);
      setShowRecovery(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Réinitialisation impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-900 to-brand-600 p-4">
      <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={error ? { x: [0, -10, 10, -6, 6, 0], opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: error ? 0.4 : 0.5 }}
        key={String(Boolean(error))}
        className="relative w-full max-w-sm rounded-3xl border border-white/60 bg-white/95 p-7 shadow-2xl shadow-blue-950/25 backdrop-blur-xl"
      >
        <div className="flex flex-col items-center text-center">
          <Logo size={72} />
          <h1 className="mt-4 text-xl font-extrabold text-slate-900">Espace gérant</h1>
          <p className="text-sm text-slate-500">{shop.name}</p>
        </div>
        <label htmlFor="username" className="label mt-6">Identifiant</label>
        <div className="relative">
          <UserRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="username"
            autoComplete="username"
            autoFocus
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Votre identifiant"
            className="input !pl-10"
          />
        </div>
        <label htmlFor="password" className="label mt-4">Mot de passe</label>
        <div className="relative">
          <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Votre mot de passe"
            className="input !pl-10"
          />
        </div>
        {error && <p role="alert" className="mt-3 text-center text-sm font-medium text-rose-600">{error}</p>}
        {recoveryDetails && (
          <div role="status" className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-bold">Accès administrateur réinitialisé sur cet appareil.</p>
            <p className="mt-2">Identifiant : <strong>{recoveryDetails.username}</strong></p>
            <p>Mot de passe : <strong className="select-all">{recoveryDetails.password}</strong></p>
            <p className="mt-2 text-xs">Les comptes utilisateurs et les données de la boutique n’ont pas été supprimés.</p>
          </div>
        )}
        <button type="submit" disabled={busy} className="btn-primary mt-5 w-full !py-3">
          {busy ? "Connexion…" : "Se connecter"}
        </button>
        <p className="mt-3 text-center text-xs text-slate-500">
          Première connexion : <span className="font-semibold">{shop.initialAdminUsername}</span> /{" "}
          <span className="font-semibold">{shop.initialAdminPassword}</span>
        </p>
        <div className="mt-4 border-t border-slate-100 pt-4 text-center">
          {!showRecovery ? (
            <button type="button" onClick={() => setShowRecovery(true)} className="text-sm font-semibold text-brand-700 hover:text-brand-900">
              Mot de passe oublié ?
            </button>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-left">
              <p className="text-xs leading-relaxed text-amber-900">
                Réinitialise le compte administrateur sur ce navigateur. Les autres comptes et les données de la boutique seront conservés.
              </p>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => setShowRecovery(false)} className="btn-ghost !px-3 !py-2 text-xs">Annuler</button>
                <button type="button" disabled={busy} onClick={recoverAdmin} className="btn-primary !px-3 !py-2 text-xs">
                  <RotateCcw size={14} /> Réinitialiser l’accès
                </button>
              </div>
            </div>
          )}
        </div>
        <Link href="/" className="mt-4 flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700">
          <ArrowLeft size={14} /> Retour à la boutique
        </Link>
      </motion.form>
    </div>
  );
}
