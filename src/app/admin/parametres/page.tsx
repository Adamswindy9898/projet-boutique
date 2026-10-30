"use client";

import { FormEvent, useEffect, useState } from "react";
import { KeyRound, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import { Loading, PageHeader, useToast } from "@/components/ui";
import {
  changeOwnPassword,
  createUserAccount,
  deleteUserAccount,
  getAuthSession,
  listUserAccounts,
} from "@/lib/auth";
import type { AuthSession, UserAccount } from "@/lib/auth";
import { fmtDate } from "@/lib/utils";

export default function SettingsPage() {
  const toast = useToast();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [userError, setUserError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [confirmUserPassword, setConfirmUserPassword] = useState("");

  useEffect(() => {
    try {
      const current = getAuthSession();
      if (!current) {
        window.location.replace("/connexion");
        return;
      }
      setSession(current);
      setAccounts(listUserAccounts());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Chargement des paramètres impossible.");
    } finally {
      setReady(true);
    }
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

  const addUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUserError("");
    if (!session) return;
    if (userPassword !== confirmUserPassword) {
      setUserError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    try {
      const updated = await createUserAccount(session, name, username, userPassword);
      setAccounts(updated);
      setName("");
      setUsername("");
      setUserPassword("");
      setConfirmUserPassword("");
      toast("Utilisateur ajouté. Il peut maintenant se connecter.");
    } catch (error) {
      setUserError(error instanceof Error ? error.message : "Création du compte impossible.");
    }
  };

  const removeUser = (account: UserAccount) => {
    if (!session || !window.confirm(`Supprimer le compte de ${account.name} (${account.username}) ?`)) return;
    try {
      setAccounts(deleteUserAccount(session, account.id));
      toast("Utilisateur supprimé.");
    } catch (error) {
      setUserError(error instanceof Error ? error.message : "Suppression du compte impossible.");
    }
  };

  if (!ready) return <Loading />;

  return (
    <div>
      <PageHeader title="Paramètres" subtitle="Gérez votre mot de passe et les comptes de la boutique." />

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

        {session?.role === "admin" ? (
          <section className="card p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="rounded-2xl bg-cyan-50 p-3 text-cyan-700"><UserPlus size={20} /></span>
              <div>
                <h2 className="font-extrabold text-slate-900">Ajouter un utilisateur</h2>
                <p className="text-sm text-slate-500">Le compte aura accès à la gestion de la boutique.</p>
              </div>
            </div>
            <form onSubmit={addUser} className="space-y-4">
              <div>
                <label htmlFor="new-user-name" className="label">Nom de l’utilisateur</label>
                <input id="new-user-name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Awa Diop" className="input" />
              </div>
              <div>
                <label htmlFor="new-username" className="label">Identifiant de connexion</label>
                <input id="new-username" required minLength={3} maxLength={30} autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ex. awa.diop" className="input" />
                <p className="mt-1 text-xs text-slate-400">Lettres minuscules, chiffres, point, tiret ou souligné.</p>
              </div>
              <div>
                <label htmlFor="new-user-password" className="label">Mot de passe temporaire</label>
                <input id="new-user-password" type="password" autoComplete="new-password" minLength={8} required value={userPassword} onChange={(e) => setUserPassword(e.target.value)} className="input" />
              </div>
              <div>
                <label htmlFor="confirm-user-password" className="label">Confirmer le mot de passe</label>
                <input id="confirm-user-password" type="password" autoComplete="new-password" minLength={8} required value={confirmUserPassword} onChange={(e) => setConfirmUserPassword(e.target.value)} className="input" />
              </div>
              {userError && <p role="alert" className="text-sm font-medium text-rose-600">{userError}</p>}
              <button type="submit" className="btn-primary w-full sm:w-auto"><UserPlus size={16} /> Créer le compte</button>
            </form>
          </section>
        ) : (
          <section className="card flex items-start gap-3 p-5 sm:p-6">
            <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><ShieldCheck size={20} /></span>
            <div>
              <h2 className="font-extrabold text-slate-900">Accès utilisateur</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">Votre compte peut gérer la boutique. Seul l’administrateur peut ajouter ou supprimer des comptes.</p>
            </div>
          </section>
        )}
      </div>

      {session?.role === "admin" && (
        <section className="card mt-5 overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 p-5">
            <span className="rounded-2xl bg-indigo-50 p-3 text-indigo-700"><Users size={20} /></span>
            <div>
              <h2 className="font-extrabold text-slate-900">Comptes utilisateurs</h2>
              <p className="text-sm text-slate-500">{accounts.length} compte{accounts.length > 1 ? "s" : ""} enregistré{accounts.length > 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center gap-3 p-4 sm:px-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-extrabold text-brand-700">
                  {account.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">{account.name}</p>
                  <p className="truncate text-xs text-slate-500">{account.username} · Depuis le {fmtDate(account.createdAt)}</p>
                </div>
                <span className={account.role === "admin" ? "badge bg-brand-100 text-brand-700" : "badge bg-slate-100 text-slate-600"}>
                  {account.role === "admin" ? "Administrateur" : "Utilisateur"}
                </span>
                {account.role !== "admin" && (
                  <button type="button" onClick={() => removeUser(account)} className="rounded-xl p-2 text-rose-500 transition hover:bg-rose-50 hover:text-rose-700" aria-label={`Supprimer ${account.name}`}>
                    <Trash2 size={17} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="border-t border-amber-100 bg-amber-50/70 px-5 py-3 text-xs leading-relaxed text-amber-900">
            Les comptes sont enregistrés dans ce navigateur et ne sont pas synchronisés entre appareils. Pour une authentification sécurisée en production, une base de données et un serveur sont nécessaires.
          </p>
        </section>
      )}
    </div>
  );
}
