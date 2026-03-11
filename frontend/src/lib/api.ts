const RAILWAY_BACKEND = "https://saasproject-production-0c1a.up.railway.app";
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? "http://localhost:8000"
    : typeof window !== "undefined" &&
        !window.location.hostname.includes("localhost")
      ? RAILWAY_BACKEND
      : "http://localhost:8000");

if (typeof window !== "undefined") {
  console.log("🛠️ SaaS API Base URL:", API_BASE);
  console.log(
    "🛠️ Current Tenant:",
    localStorage.getItem("tenant_subdomain") || "NONE (Global)",
  );
}

function getToken(): string {
  return typeof window !== "undefined"
    ? localStorage.getItem("token") || ""
    : "";
}

function getTenant(): string {
  return typeof window !== "undefined"
    ? localStorage.getItem("tenant_subdomain") || ""
    : "";
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const tenant = getTenant();
  const token = getToken();

  // Solo loguear en desarrollo para no ensuciar prod, o dejarlo para debug local
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  ) {
    console.log(`🚀 API Request: ${path} | Tenant: ${tenant || "GLOBAL"}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Tenant": tenant,
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
  if (!res.ok) {
    console.error("❌ API Error Data:", data);
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : JSON.stringify(data.detail) || "Error en la petición",
    );
  }
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
  },
};

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
  createPlan: (data: {
    name: string;
    price: number;
    billing_cycle: string;
    max_users: number;
  }) =>
    apiFetch<Plan>("/admin/plans", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getSubscriptions: () => apiFetch<Subscription[]>("/admin/subscriptions"),
  updateSubscription: (
    subId: string,
    data: { status?: string; plan_id?: string },
  ) =>
    apiFetch<{ message: string; status: string; plan_id: string }>(
      `/admin/subscriptions/${subId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    ),
};

// ─── TENANT DENTAL API ────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  birth_day?: string;
  address?: string;
  description?: string;
  status: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Appointment {
  id: string;
  appointment_date: string;
  notes?: string;
  appointment_status: string;
  status: boolean;
  patient_id: string;
}

export interface Treatment {
  id: string;
  description: string;
  price: number;
  status_treatments: string;
  duration_minutes?: number;
  date?: string;
  status: boolean;
}

export interface MedicalHistory {
  id: string;
  conditions?: string;
  allergies?: string;
  medications?: string;
  description?: string;
  status: boolean;
  patient_id: string;
  treatment_id?: string;
  created_at: string;
  created_by?: string;
}

export interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  treatment_id: string;
  created_at: string;
}

export interface Odontogram {
  id: string;
  tooth_number: number;
  tooth_type: string;
  notes?: string;
  status: boolean;
  treatment_id: string;
}

export const tenantApi = {
  // Patients
  getPatients: () => apiFetch<Patient[]>("/api/tenant/patients/"),
  getPatient: (id: string) => apiFetch<Patient>(`/api/tenant/patients/${id}`),
  createPatient: (data: Partial<Patient>) =>
    apiFetch<Patient>("/api/tenant/patients/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updatePatient: (id: string, data: Partial<Patient>) =>
    apiFetch<Patient>(`/api/tenant/patients/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deletePatient: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/tenant/patients/${id}`, {
      method: "DELETE",
    }),

  // Medical History
  getMedicalHistories: (patientId: string) =>
    apiFetch<MedicalHistory[]>(
      `/api/tenant/patients/${patientId}/medical-history`,
    ),
  createMedicalHistory: (patientId: string, data: Partial<MedicalHistory>) =>
    apiFetch<MedicalHistory>(
      `/api/tenant/patients/${patientId}/medical-history`,
      { method: "POST", body: JSON.stringify(data) },
    ),

  // Full Composite History
  getAllMedicalHistories: () =>
    apiFetch<any[]>("/api/tenant/patients/all-medical-histories"),

  getMedicalHistoryDetail: (historyId: string) =>
    apiFetch<any>(`/api/tenant/patients/medical-history-detail/${historyId}`),

  createFullMedicalHistory: (patientId: string, data: any) =>
    apiFetch<MedicalHistory>(`/api/tenant/patients/${patientId}/full-history`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateFullMedicalHistory: (historyId: string, data: any) =>
    apiFetch<any>(`/api/tenant/patients/medical-history-update/${historyId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteMedicalHistory: (historyId: string) =>
    apiFetch<{ ok: boolean }>(
      `/api/tenant/patients/medical-history-delete/${historyId}`,
      {
        method: "DELETE",
      },
    ),

  // Treatments
  getTreatments: () => apiFetch<Treatment[]>("/api/tenant/treatments/"),
  createTreatment: (data: Partial<Treatment>) =>
    apiFetch<Treatment>("/api/tenant/treatments/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTreatment: (id: string, data: Partial<Treatment>) =>
    apiFetch<Treatment>(`/api/tenant/treatments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Appointments
  getAppointments: () => apiFetch<Appointment[]>("/api/tenant/appointments/"),
  createAppointment: (data: Partial<Appointment>) =>
    apiFetch<Appointment>("/api/tenant/appointments/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAppointment: (id: string, data: Partial<Appointment>) =>
    apiFetch<Appointment>(`/api/tenant/appointments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Payments
  getPayments: () => apiFetch<Payment[]>("/api/tenant/payments/"),
  createPayment: (data: Partial<Payment>) =>
    apiFetch<Payment>("/api/tenant/payments/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Odontograms
  getOdontograms: () => apiFetch<Odontogram[]>("/api/tenant/odontograms/"),
  createOdontogram: (data: Partial<Odontogram>) =>
    apiFetch<Odontogram>("/api/tenant/odontograms/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
