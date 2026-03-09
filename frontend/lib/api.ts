export type ServiceName = "authentication" | "inventory" | "payment" | "notification";

export const serviceConfigs = [
  { name: "Authentication", key: "authentication" as const },
  { name: "Inventory", key: "inventory" as const },
  { name: "Payment", key: "payment" as const },
  { name: "Notification", key: "notification" as const }
];

export function getServiceBaseUrl(service: ServiceName): string | null {
  const serviceEnvMap: Record<ServiceName, string | undefined> = {
    authentication: process.env.NEXT_PUBLIC_AUTH_API_URL,
    inventory: process.env.NEXT_PUBLIC_INVENTORY_API_URL,
    payment: process.env.NEXT_PUBLIC_PAYMENT_API_URL,
    notification: process.env.NEXT_PUBLIC_NOTIFICATION_API_URL
  };

  const value = serviceEnvMap[service]?.trim();
  return value ? value.replace(/\/$/, "") : null;
}

function buildServiceUrl(service: ServiceName, path: string): string {
  const baseUrl = getServiceBaseUrl(service);
  if (!baseUrl) {
    throw new Error(`Missing base URL for ${service}. Configure NEXT_PUBLIC_*_API_URL variables.`);
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

export async function apiFetch<T>(
  service: ServiceName,
  path: string,
  init?: RequestInit
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildServiceUrl(service, path), {
    ...init,
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`API ${service} ${response.status}: ${bodyText || response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function checkServiceHealth(service: ServiceName): Promise<boolean> {
  try {
    const response = await fetch(buildServiceUrl(service, "/health"), { cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}
