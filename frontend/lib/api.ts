export type ServiceName = "authentication" | "inventory" | "payment" | "notification";

export const serviceConfigs = [
  { name: "Authentication", key: "authentication" as const },
  { name: "Inventory", key: "inventory" as const },
  { name: "Payment", key: "payment" as const },
  { name: "Notification", key: "notification" as const }
];

export class ApiError extends Error {
  constructor(
    message: string,
    public service: ServiceName,
    public status: number,
    public bodyText?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getServiceBaseUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_API_GATEWAY_URL?.trim();
  return value ? value.replace(/\/$/, "") : null;
}

function buildServiceUrl(service: ServiceName, path: string): string {
  const baseUrl = getServiceBaseUrl();
  if (!baseUrl) {
    throw new Error("Missing API gateway base URL. Configure NEXT_PUBLIC_API_GATEWAY_URL.");
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
    throw new ApiError(
      `API ${service} ${response.status}: ${bodyText || response.statusText}`,
      service,
      response.status,
      bodyText
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function checkServiceHealth(service: ServiceName): Promise<boolean> {
  const healthPathMap: Record<ServiceName, string> = {
    authentication: "/health/authentication",
    inventory: "/health/inventory",
    payment: "/health/payment",
    notification: "/health/notification"
  };

  try {
    const response = await fetch(buildServiceUrl(service, healthPathMap[service]), { cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}
