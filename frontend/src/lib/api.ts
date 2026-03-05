export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
if (typeof window !== "undefined") {
    console.log("🛠️ SaaS API Base URL:", API_BASE);
}

function getToken(): string {
    return typeof window !== "undefined"
        ? localStorage.getItem("token") || ""
        : "";
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
            ...(options?.headers || {}),
        },
    });

    if (res.status === 401) {
        if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("user_role");
            window.location.href = "/login";
        }
        throw new Error("No autorizado");
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Error en la petición");
    return data as T;
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface AdminStats {
    total_tenants: number;
    active_tenants: number;
    suspended_tenants: number;
    total_users: number;
    total_plans: number;
    mrr_estimado: number;
}

export interface Plan {
    id: string;
    name: string;
    price: number;
    billing_cycle: string;
    max_users: number;
}

export interface Tenant {
    id: string;
    business_name: string;
    subdomain: string;
    db_name: string;
    status: string;
    plan: {
        id: string;
        name: string;
        price: number;
        billing_cycle: string;
    } | null;
}

export interface User {
    id: string;
    email: string;
    rol_global: string;
    is_verified: boolean;
}

export interface Subscription {
    id: string;
    tenant_id: string;
    tenant_name: string;
    plan_id: string;
    plan_name: string;
    status: string;
    start_date: string;
    end_date: string;
    external_id: string | null;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const publicApi = {
    getPlans: async () => {
        const res = await fetch(`${API_BASE}/plans`);
        if (!res.ok) throw new Error("Error al cargar planes");
        return res.json() as Promise<Plan[]>;
    }
}

export const adminApi = {
    getStats: () => apiFetch<AdminStats>("/admin/stats"),
    getTenants: () => apiFetch<Tenant[]>("/admin/tenants"),
    getTenant: (id: string) => apiFetch<Tenant>(`/admin/tenants/${id}`),
    updateTenantStatus: (id: string, status: "active" | "suspended") =>
        apiFetch<Tenant>(`/admin/tenants/${id}/status`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
        }),
    deleteTenant: (id: string) =>
        apiFetch<{ message: string }>(`/admin/tenants/${id}`, { method: "DELETE" }),
    getUsers: () => apiFetch<User[]>("/admin/users"),
    getPlans: () => apiFetch<Plan[]>("/admin/plans"),
    createPlan: (data: { name: string; price: number; billing_cycle: string; max_users: number }) =>
        apiFetch<Plan>("/admin/plans", { method: "POST", body: JSON.stringify(data) }),
    getSubscriptions: () => apiFetch<Subscription[]>("/admin/subscriptions"),
    updateSubscription: (subId: string, data: { status?: string; plan_id?: string }) =>
        apiFetch<{ message: string, status: string, plan_id: string }>(`/admin/subscriptions/${subId}`, {
            method: "PATCH",
            body: JSON.stringify(data)
        }),
};
