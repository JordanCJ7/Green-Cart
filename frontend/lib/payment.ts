import { apiFetch } from "./api";
import { getAccessToken } from "./auth";

export interface InitiatePaymentRequest {
  orderId: string;
  customerId: string;
  amount: number; // LKR major unit (e.g., 1500.00)
  currency: string;
  returnUrl: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
}

export interface PayHereCheckoutPayload {
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  currency: string;
  amount: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  hash: string;
}

export interface InitiatePaymentResponse {
  transactionId: string;
  checkoutUrl: string;
  paymentPayload: PayHereCheckoutPayload;
  status: string;
  createdAt: string;
}

export interface PaymentStatusResponse {
  transactionId: string;
  orderId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "cancelled" | "expired";
  payHereId?: string;
  payHereStatus?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

function getAuthHeaders(): HeadersInit {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Please login again. Access token not found.");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function apiInitiatePayment(
  payload: InitiatePaymentRequest
): Promise<InitiatePaymentResponse> {
  return apiFetch<InitiatePaymentResponse>("payment", "/", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function apiGetPaymentStatus(
  transactionId: string
): Promise<PaymentStatusResponse> {
  return apiFetch<PaymentStatusResponse>("payment", `/${transactionId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
}

export function submitPayHereForm(checkoutUrl: string, payload: PayHereCheckoutPayload): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = checkoutUrl;

  Object.entries(payload).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}
