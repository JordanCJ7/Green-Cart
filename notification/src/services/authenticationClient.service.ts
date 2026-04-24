import { env } from "../config/env.js";

export interface UserContact {
  userId: string;
  email?: string;
  phone?: string;
}

export async function getUserContactById(userId: string): Promise<UserContact | null> {
  if (!env.INTERNAL_API_KEY) {
    throw new Error("INTERNAL_API_KEY is required to call authentication internal APIs");
  }

  const url = `${env.AUTHENTICATION_SERVICE_URL.replace(/\/$/, "")}/internal/users/${encodeURIComponent(userId)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-internal-api-key": env.INTERNAL_API_KEY,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Auth service ${res.status}: ${text || res.statusText}`);
  }

  const body = (await res.json()) as { user: UserContact };
  return body.user;
}
