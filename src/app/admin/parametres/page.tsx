"use client";

import { FormEvent, useEffect, useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Loading, PageHeader, useToast } from "@/components/ui";
import { changeOwnPassword, getAuthSession } from "@/lib/auth";
import type { AuthSession } from "@/lib/auth";

export default function SettingsPage() {
  const toast = useToast();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let active = true;
    getAuthSession()
      .then((current) => {
        if (!active) return;
        if (!current) window.location.replace("/connexion");
        else setSession(current);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : "Chargement des paramètres impossible.");
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError("");
    if (!session) return;
    if (newPassword !== confirmPassword) {
      setPasswordError("Les deux nouveaux mots de passe ne correspondent pas.");
      return;
    }
    try {
      await changeOwnPassword(session, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast("Mot de passe modifié avec succès.");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Modification du mot de passe impossible.");
    }
  };

  if (!ready) return <Loading />;

  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Gérez les accès sécurisés de la boutique." />

      {loadError && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{loadError}</p>}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="rounded-2xl bg-brand-50 p-3 text-brand-700"><KeyRound size={20} /></span>
            <div>
              <h2 className="font-extrabold text-slate-900">Changer mon mot de passe</h2>
              <p className="text-sm text-slate-500">Connecté en tant que {session?.username}</p>
            </div>
          </div>
          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label htmlFor="current-password" className="label">Mot de passe actuel</label>
              <input id="current-password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input" />
            </div>
            <div>
              <label htmlFor="new-password" className="label">Nouveau mot de passe</label>
              <input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input" />
              <p className="mt-1 text-xs text-slate-400">8 caractères minimum.</p>
            </div>
            <div>
              <label htmlFor="confirm-password" className="label">Confirmer le nouveau mot de passe</label>
              <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input" />
            </div>
            {passwordError && <p role="alert" className="text-sm font-medium text-rose-600">{passwordError}</p>}
            <button type="submit" className="btn-primary w-full sm:w-auto">Enregistrer le mot de passe</button>
          </form>
        </section>

        <section className="card flex items-start gap-3 p-5 sm:p-6">
          <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><ShieldCheck size={20} /></span>
          <div>
            <h2 className="font-extrabold text-slate-900">Compte gérant sécurisé</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              L’accès et les données de la boutique sont protégés par Supabase. Les nouveaux comptes doivent être créés
              dans Supabase et explicitement autorisés par l’administrateur du projet.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
