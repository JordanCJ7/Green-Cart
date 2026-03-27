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

export function getServiceBaseUrl(service: ServiceName): string | null {
  // Service to path prefix mapping (used when routing through API Gateway)
  const servicePathMap: Record<ServiceName, string> = {
    authentication: "/auth",
    inventory: "/inventory",
    payment: "/payment",
    notification: "/notification"
  };

  // Try service-specific URL first (for backward compatibility)
  const serviceEnvMap: Record<ServiceName, string | undefined> = {
    authentication: process.env.NEXT_PUBLIC_AUTH_API_URL,
    inventory: process.env.NEXT_PUBLIC_INVENTORY_API_URL,
    payment: process.env.NEXT_PUBLIC_PAYMENT_API_URL,
    notification: process.env.NEXT_PUBLIC_NOTIFICATION_API_URL
  };

  const serviceUrl = serviceEnvMap[service]?.trim();
  if (serviceUrl) {
    return serviceUrl.replace(/\/$/, "");
  }

  // Fall back to API Gateway base URL with service path
  const gatewayUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (gatewayUrl) {
    return `${gatewayUrl.replace(/\/$/, "")}${servicePathMap[service]}`;
  }

  return null;
}

function buildServiceUrl(service: ServiceName, path: string): string {
  const baseUrl = getServiceBaseUrl(service);
  if (!baseUrl) {
    throw new Error(
      `Missing base URL for ${service}. Configure either NEXT_PUBLIC_API_BASE_URL (for API Gateway) ` +
      `or NEXT_PUBLIC_*_API_URL (for direct service URLs).`
    );
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
