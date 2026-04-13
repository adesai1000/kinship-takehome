// all data calls go through here — Supabase is only used for auth

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export type CustomerRow = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  company: string;
  stage: "lead" | "contacted" | "qualified" | "trial_demo" | "closed";
  notes: string | null;
  stage_changed_at: string;
  created_at: string;
  updated_at: string;
};

let token: string | null = null;

export function setApiToken(accessToken: string) {
  token = accessToken;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  // 204 has no body
  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? `API error ${response.status}`);
  }

  return body as T;
}

export const apiClient = {
  customers: {
    list: (stage?: string) => {
      const qs =
        stage && stage !== "all" ? `?stage=${encodeURIComponent(stage)}` : "";
      return request<CustomerRow[]>(`/api/customers${qs}`);
    },

    create: (payload: {
      id: string;
      name: string;
      email: string;
      company: string;
      stage: string;
      notes?: string;
    }) =>
      request<CustomerRow>("/api/customers", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    update: (
      id: string,
      payload: Partial<{
        name: string;
        email: string;
        company: string;
        stage: string;
        notes: string;
      }>,
    ) =>
      request<CustomerRow>(`/api/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),

    // hits the dedicated stage endpoint so history always gets recorded
    moveStage: (id: string, stage: string) =>
      request<CustomerRow>(`/api/customers/${id}/stage`, {
        method: "PATCH",
        body: JSON.stringify({ stage }),
      }),

    delete: (id: string) =>
      request<void>(`/api/customers/${id}`, { method: "DELETE" }),
  },
};
