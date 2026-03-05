const API_BASE = "http://localhost:8000";

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
    plan: { id: string; name: string } | null;
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

export interface Product {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    created_at: string | null;
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

// ─── TENANT (Owner) API ───────────────────────────────────────────────────────

export const tenantApi = {
    getProducts: () => apiFetch<Product[]>("/products"),
    createProduct: (data: { name: string; description?: string; price: number; stock: number }) =>
        apiFetch<Product>("/products", { method: "POST", body: JSON.stringify(data) }),
    deleteProduct: (id: string) =>
        apiFetch<{ message: string }>(`/products/${id}`, { method: "DELETE" }),
};

// ─── DENTAL TYPES ─────────────────────────────────────────────────────────────

export interface DentalPatient {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    email: string | null;
    birthdate: string | null;
    address: string | null;
    notes: string | null;
    created_at: string | null;
}

export interface MedicalHistory {
    id?: string;
    conditions: string;
    allergies: string;
    medications: string;
    notes: string;
}

export interface OdontogramEntry {
    id: string;
    tooth_number: number;
    condition: string;
    notes: string | null;
}

export interface DentalTreatment {
    id: string;
    name: string;
    description: string | null;
    price: number;
}

export interface TreatmentRecord {
    id: string;
    treatment_id: string | null;
    treatment_name: string | null;
    tooth_number: number | null;
    description: string | null;
    cost: number;
    status: string;
    treatment_date: string | null;
    notes: string | null;
}

export interface DentalAppointment {
    id: string;
    patient_id: string;
    patient_name: string;
    appointment_date: string;
    start_time: string;
    end_time: string | null;
    status: string;
    notes: string | null;
}

export interface PatientBalance {
    total: number;
    paid: number;
    pending: number;
}

// ─── DENTAL API ───────────────────────────────────────────────────────────────

export const dentalApi = {
    // Pacientes
    getPatients: () => apiFetch<DentalPatient[]>("/dental/patients"),
    createPatient: (data: { first_name: string; last_name: string; phone?: string; email?: string; birthdate?: string; address?: string; notes?: string }) =>
        apiFetch<DentalPatient>("/dental/patients", { method: "POST", body: JSON.stringify(data) }),
    getPatient: (id: string) => apiFetch<DentalPatient>(`/dental/patients/${id}`),
    updatePatient: (id: string, data: Record<string, unknown>) =>
        apiFetch<DentalPatient>(`/dental/patients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deletePatient: (id: string) =>
        apiFetch<{ message: string }>(`/dental/patients/${id}`, { method: "DELETE" }),

    // Historial
    getHistory: (patientId: string) => apiFetch<MedicalHistory>(`/dental/patients/${patientId}/history`),
    saveHistory: (patientId: string, data: MedicalHistory) =>
        apiFetch<{ message: string }>(`/dental/patients/${patientId}/history`, { method: "POST", body: JSON.stringify(data) }),

    // Odontograma
    getOdontogram: (patientId: string) => apiFetch<OdontogramEntry[]>(`/dental/patients/${patientId}/odontogram`),
    saveOdontogramEntry: (patientId: string, data: { tooth_number: number; condition: string; notes?: string }) =>
        apiFetch<{ message: string }>(`/dental/patients/${patientId}/odontogram`, { method: "POST", body: JSON.stringify(data) }),

    // Catálogo de tratamientos
    getTreatments: () => apiFetch<DentalTreatment[]>("/dental/treatments"),
    createTreatment: (data: { name: string; description?: string; price: number }) =>
        apiFetch<DentalTreatment>("/dental/treatments", { method: "POST", body: JSON.stringify(data) }),
    deleteTreatment: (id: string) =>
        apiFetch<{ message: string }>(`/dental/treatments/${id}`, { method: "DELETE" }),

    // Tratamientos realizados
    getRecords: (patientId: string) => apiFetch<TreatmentRecord[]>(`/dental/patients/${patientId}/records`),
    createRecord: (patientId: string, data: { treatment_id?: string; tooth_number?: number; description?: string; cost: number; notes?: string }) =>
        apiFetch<{ id: string; message: string }>(`/dental/patients/${patientId}/records`, { method: "POST", body: JSON.stringify(data) }),
    markRecordPaid: (recordId: string) =>
        apiFetch<{ message: string }>(`/dental/records/${recordId}/pay`, { method: "PATCH" }),

    // Balance
    getBalance: (patientId: string) => apiFetch<PatientBalance>(`/dental/patients/${patientId}/balance`),

    // Citas
    getAppointments: (params?: { patient_id?: string; fecha?: string }) => {
        const query = new URLSearchParams();
        if (params?.patient_id) query.set("patient_id", params.patient_id);
        if (params?.fecha) query.set("fecha", params.fecha);
        const qs = query.toString();
        return apiFetch<DentalAppointment[]>(`/dental/appointments${qs ? `?${qs}` : ""}`);
    },
    createAppointment: (data: { patient_id: string; appointment_date: string; start_time: string; end_time?: string; notes?: string }) =>
        apiFetch<{ id: string; message: string }>("/dental/appointments", { method: "POST", body: JSON.stringify(data) }),
    updateAppointment: (id: string, data: { status?: string; notes?: string }) =>
        apiFetch<{ message: string }>(`/dental/appointments/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteAppointment: (id: string) =>
        apiFetch<{ message: string }>(`/dental/appointments/${id}`, { method: "DELETE" }),
};
