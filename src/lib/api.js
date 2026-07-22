import { API_URL } from "../config";

// REST client for the backend's /api routes. On this backend only auth
// (/api/auth/register, /api/auth/login) and a couple of user lookups
// (/api/users/search, /api/users/add-contact) are HTTP; everything else rides
// the socket. Responses look like { success, ... } on 200 and { message } on
// error — normalize both into the { ok, error, ... } shape the app speaks.
function normalize(res, data) {
  if (!res.ok || data?.success === false) {
    return {
      ok: false,
      error: data?.error || data?.message || `Ошибка ${res.status}`,
      status: res.status,
      code: data?.code ?? null,
      email: data?.email ?? null,
    };
  }
  return { ok: true, ...(data ?? {}) };
}

export async function apiPost(path, body, token) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body ?? {}),
    });
  } catch {
    return { ok: false, error: "Сервер недоступен" };
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Some routes answer with an empty body; treat it as no payload.
  }
  return normalize(res, data);
}

export async function apiGet(path) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`);
  } catch {
    return { ok: false, error: "Сервер недоступен" };
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    // ignore empty body
  }
  return normalize(res, data);
}
