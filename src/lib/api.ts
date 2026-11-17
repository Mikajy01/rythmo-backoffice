/**
 * Client HTTP du back-office. Toutes les erreurs de l'API ont la forme
 * `{ error: { code, message, details } }` ; elles deviennent des `ApiError`.
 */
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
const TOKEN_KEY = 'rythmo.admin.token';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* stockage indisponible : la session ne survivra pas à un rechargement */
  }
}

let onUnauthorized: (() => void) | null = null;
/** Appelé quand l'API refuse le jeton : l'application revient à l'écran de connexion. */
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

type Query = Record<string, string | number | boolean | undefined | null>;

function withQuery(path: string, query?: Query): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `${path}?${text}` : path;
}

async function request<T>(method: string, path: string, body?: unknown, query?: Query): Promise<T> {
  const token = getToken();
  let response: Response;
  try {
    response = await fetch(`${BASE}${withQuery(path, query)}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('NETWORK', 'Le serveur est injoignable. Vérifie ta connexion et réessaie.', 0);
  }

  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* corps non JSON */
  }

  if (response.ok) return json as T;

  const error = (json as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
  if (response.status === 401 && token && path !== '/admin/auth/login') onUnauthorized?.();
  throw new ApiError(
    error?.code ?? 'HTTP_ERROR',
    error?.message ?? 'Une erreur est survenue.',
    response.status,
    error?.details ?? null,
  );
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, undefined, query),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

export const errorMessage = (error: unknown): string =>
  error instanceof ApiError ? error.message : 'Une erreur est survenue. Réessaie dans un instant.';
