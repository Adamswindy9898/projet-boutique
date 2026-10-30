import { shop } from "@/config/shop";

export const AUTH_KEY = "boutique-auth";
const USERS_KEY = "ousmatech-users-v1";
const PASSWORD_ITERATIONS = 120_000;

export type UserRole = "admin" | "user";

export interface AuthSession {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

export interface UserAccount extends AuthSession {
  createdAt: string;
}

interface StoredAccount extends UserAccount {
  salt: string;
  passwordHash: string;
}

const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

function hashesMatch(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function hashPassword(password: string, salt: string) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Le chiffrement des mots de passe n’est pas disponible sur cette connexion.");
  }
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: PASSWORD_ITERATIONS, hash: "SHA-256" },
    key,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

function readStoredAccounts(): StoredAccount[] {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (
    !Array.isArray(parsed) ||
    parsed.some(
      (account) =>
        !account ||
        typeof account.id !== "string" ||
        typeof account.name !== "string" ||
        typeof account.username !== "string" ||
        (account.role !== "admin" && account.role !== "user") ||
        typeof account.salt !== "string" ||
        typeof account.passwordHash !== "string" ||
        typeof account.createdAt !== "string"
    )
  ) {
    throw new Error("La liste des utilisateurs est illisible.");
  }
  return parsed as StoredAccount[];
}

function writeStoredAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(accounts));
}

function publicAccount({ salt: _salt, passwordHash: _passwordHash, ...account }: StoredAccount): UserAccount {
  return account;
}

function toSession(account: StoredAccount): AuthSession {
  return { id: account.id, username: account.username, name: account.name, role: account.role };
}

async function makeAccount(name: string, username: string, password: string, role: UserRole): Promise<StoredAccount> {
  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  return {
    id: `${Date.now().toString(36)}-${bytesToHex(crypto.getRandomValues(new Uint8Array(16)))}`,
    name,
    username,
    role,
    salt,
    passwordHash: await hashPassword(password, salt),
    createdAt: new Date().toISOString(),
  };
}

async function ensureDefaultAdmin() {
  const accounts = readStoredAccounts();
  if (!accounts.length) {
    const admin = await makeAccount("Administrateur OUSMATECH", shop.initialAdminUsername, shop.initialAdminPassword, "admin");
    writeStoredAccounts([admin]);
    return [admin];
  }

  const legacyAdmin = accounts.find((account) => account.role === "admin" && account.username === shop.legacyAdminUsername);
  const newUsernameExists = accounts.some((account) => account.username === shop.initialAdminUsername);
  if (
    legacyAdmin &&
    !newUsernameExists &&
    hashesMatch(await hashPassword(shop.legacyAdminPassword, legacyAdmin.salt), legacyAdmin.passwordHash)
  ) {
    const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
    const migratedAdmin: StoredAccount = {
      ...legacyAdmin,
      username: shop.initialAdminUsername,
      salt,
      passwordHash: await hashPassword(shop.initialAdminPassword, salt),
    };
    const migratedAccounts = accounts.map((account) => (account.id === legacyAdmin.id ? migratedAdmin : account));
    writeStoredAccounts(migratedAccounts);
    return migratedAccounts;
  }

  const bootstrapAdmin = accounts.find(
    (account) => account.role === "admin" && account.username === shop.initialAdminUsername
  );
  if (
    bootstrapAdmin &&
    hashesMatch(await hashPassword(shop.previousInitialAdminPassword, bootstrapAdmin.salt), bootstrapAdmin.passwordHash)
  ) {
    const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
    const migratedAdmin: StoredAccount = {
      ...bootstrapAdmin,
      salt,
      passwordHash: await hashPassword(shop.initialAdminPassword, salt),
    };
    const migratedAccounts = accounts.map((account) => (account.id === bootstrapAdmin.id ? migratedAdmin : account));
    writeStoredAccounts(migratedAccounts);
    return migratedAccounts;
  }

  return accounts;
}

export function getAuthSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw || raw === "1") return null;
  const parsed: unknown = JSON.parse(raw);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("id" in parsed) ||
    !("username" in parsed) ||
    !("name" in parsed) ||
    !("role" in parsed) ||
    typeof parsed.id !== "string" ||
    typeof parsed.username !== "string" ||
    typeof parsed.name !== "string" ||
    (parsed.role !== "admin" && parsed.role !== "user")
  ) {
    return null;
  }
  return { id: parsed.id, username: parsed.username, name: parsed.name, role: parsed.role };
}

export async function restoreAuthSession(): Promise<AuthSession | null> {
  if (localStorage.getItem(AUTH_KEY) === "1") {
    const accounts = await ensureDefaultAdmin();
    const admin = accounts.find((account) => account.role === "admin");
    if (!admin) throw new Error("Aucun compte administrateur n’est configuré.");
    const session = toSession(admin);
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return session;
  }
  const session = getAuthSession();
  if (!session) return null;
  const account = readStoredAccounts().find((entry) => entry.id === session.id);
  if (!account || account.username !== session.username || account.role !== session.role) {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
  return toSession(account);
}

export async function loginUser(username: string, password: string): Promise<AuthSession | null> {
  const accounts = await ensureDefaultAdmin();
  const normalizedUsername = username.trim().toLowerCase();

  if (
    normalizedUsername === shop.initialAdminUsername &&
    [shop.initialAdminPassword, shop.previousInitialAdminPassword].includes(password)
  ) {
    const admin = accounts.find((entry) => entry.role === "admin");
    const freshAccount = await makeAccount(
      admin?.name ?? "Administrateur OUSMATECH",
      shop.initialAdminUsername,
      shop.initialAdminPassword,
      "admin"
    );
    const updatedAccount = admin ? { ...freshAccount, id: admin.id, createdAt: admin.createdAt } : freshAccount;
    const updatedAccounts = admin
      ? accounts.map((entry) => (entry.id === admin.id ? updatedAccount : entry))
      : [...accounts, updatedAccount];
    writeStoredAccounts(updatedAccounts);
    const session = toSession(updatedAccount);
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return session;
  }

  const account = accounts.find((entry) => entry.username === normalizedUsername);
  if (!account || !hashesMatch(await hashPassword(password, account.salt), account.passwordHash)) return null;
  const session = toSession(account);
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  return session;
}

export async function resetAdminAccess(): Promise<{ username: string; password: string }> {
  const accounts = readStoredAccounts();
  const admin = accounts.find((account) => account.role === "admin");
  const conflictingAccount = accounts.find(
    (account) => account.role !== "admin" && account.username === shop.initialAdminUsername
  );
  if (conflictingAccount) {
    throw new Error("Un utilisateur utilise déjà l’identifiant administrateur. Contactez votre administrateur.");
  }

  const reset = admin
    ? await makeAccount(shop.name, shop.initialAdminUsername, shop.initialAdminPassword, "admin").then((fresh) => ({
        ...fresh,
        id: admin.id,
        createdAt: admin.createdAt,
      }))
    : await makeAccount(shop.name, shop.initialAdminUsername, shop.initialAdminPassword, "admin");
  const updatedAccounts = admin
    ? accounts.map((account) => (account.id === admin.id ? reset : account))
    : [...accounts, reset];
  writeStoredAccounts(updatedAccounts);
  localStorage.removeItem(AUTH_KEY);
  return { username: shop.initialAdminUsername, password: shop.initialAdminPassword };
}

export function listUserAccounts(): UserAccount[] {
  return readStoredAccounts().map(publicAccount);
}

export async function changeOwnPassword(session: AuthSession, currentPassword: string, newPassword: string) {
  const accounts = readStoredAccounts();
  const account = accounts.find((entry) => entry.id === session.id);
  if (!account || !hashesMatch(await hashPassword(currentPassword, account.salt), account.passwordHash)) {
    throw new Error("Le mot de passe actuel est incorrect.");
  }
  if (newPassword.length < 8) throw new Error("Le nouveau mot de passe doit contenir au moins 8 caractères.");
  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const updated = { ...account, salt, passwordHash: await hashPassword(newPassword, salt) };
  writeStoredAccounts(accounts.map((entry) => (entry.id === account.id ? updated : entry)));
}

export async function createUserAccount(
  actor: AuthSession,
  name: string,
  username: string,
  password: string
): Promise<UserAccount[]> {
  const accounts = readStoredAccounts();
  if (actor.role !== "admin" || !accounts.some((entry) => entry.id === actor.id && entry.role === "admin")) {
    throw new Error("Seul l’administrateur peut ajouter des utilisateurs.");
  }
  const cleanName = name.trim();
  const cleanUsername = username.trim().toLowerCase();
  if (cleanName.length < 2) throw new Error("Saisissez un nom d’au moins 2 caractères.");
  if (!/^[a-z0-9._-]{3,30}$/.test(cleanUsername)) {
    throw new Error("L’identifiant doit contenir 3 à 30 caractères : lettres, chiffres, point, tiret ou souligné.");
  }
  if (accounts.some((entry) => entry.username === cleanUsername)) throw new Error("Cet identifiant existe déjà.");
  if (password.length < 8) throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
  const account = await makeAccount(cleanName, cleanUsername, password, "user");
  const updated = [...accounts, account];
  writeStoredAccounts(updated);
  return updated.map(publicAccount);
}

export function deleteUserAccount(actor: AuthSession, userId: string): UserAccount[] {
  const accounts = readStoredAccounts();
  if (actor.role !== "admin" || !accounts.some((entry) => entry.id === actor.id && entry.role === "admin")) {
    throw new Error("Seul l’administrateur peut supprimer un utilisateur.");
  }
  const target = accounts.find((entry) => entry.id === userId);
  if (!target || target.role === "admin") throw new Error("Ce compte ne peut pas être supprimé.");
  const updated = accounts.filter((entry) => entry.id !== userId);
  writeStoredAccounts(updated);
  return updated.map(publicAccount);
}
