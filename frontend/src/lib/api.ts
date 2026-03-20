const RAILWAY_BACKEND = "https://saasproject-production-0c1a.up.railway.app";

const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window === "undefined") return "http://localhost:8000";

  const host = window.location.hostname;
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("192.168.") ||
    host.startsWith("10.")
  ) {
    return `http://${host}:8000`;
  }
  return RAILWAY_BACKEND;
};

export const API_BASE = getApiBase();

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
    console.error("❌ API Error URL:", `${API_BASE}${path}`);
    console.error("❌ API Error Status:", res.status);
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
  creator_name?: string;
  assigned_doctor_id?: string;
  is_shared?: boolean;
  history_id?: string;
  history_number?: number;
}

export interface Appointment {
  id: string;
  appointment_date: string;
  notes?: string;
  appointment_status: string;
  status: boolean;
  patient_id: string;
  assigned_doctor_id?: string;
}

export interface Treatment {
  id: string;
  description: string;
  price: number;
  procedure_status: string;
  treatment_date?: string;
  status: boolean;
  odontogram_id?: string;
  odontogram?: Odontogram;
  payments?: Payment[];
  created_at?: string;
  updated_at?: string;
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
  patient_id?: string;
  patient?: Patient;
  treatments?: Treatment[];
  created_at?: string;
  updated_at?: string;
}

export interface SettingData {
  business_name: string;
  logo_url?: string;
  phone?: string;
  cellphone?: string;
  address?: string;
  currency?: string;
}

export interface Medicine {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role?: Role;
  status: boolean;
  created_at: string;
}

export interface EmployeeCreate {
  username: string;
  email: string;
  full_name: string;
  password: string;
  role_id: string;
}

export interface PatientShare {
  id: string;
  patient_id: string;
  doctor_id: string;
  created_at: string;
  doctor_name?: string;
}

export const tenantApi = {
  // Config / Settings
  getTenantConfig: async (): Promise<SettingData> => {
    return apiFetch("/api/tenant/settings");
  },
  updateTenantConfig: async (
    data: Partial<SettingData>,
  ): Promise<SettingData> => {
    return apiFetch("/api/tenant/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Employees
  getEmployees: async (): Promise<Employee[]> => {
    return apiFetch("/api/tenant/employees/");
  },
  getDoctors: async (): Promise<Employee[]> => {
    return apiFetch("/api/tenant/employees/doctors/");
  },
  getRoles: async (): Promise<Role[]> => {
    return apiFetch("/api/tenant/roles/");
  },
  createEmployee: async (data: EmployeeCreate): Promise<Employee> => {
    return apiFetch("/api/tenant/employees", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateEmployee: async (
    id: string,
    data: Partial<EmployeeCreate>,
  ): Promise<Employee> => {
    return apiFetch(`/api/tenant/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  deleteEmployee: async (id: string): Promise<{ ok: boolean }> => {
    return apiFetch(`/api/tenant/employees/${id}`, {
      method: "DELETE",
    });
  },

  // Patients
  getPatients: () => apiFetch<Patient[]>("/api/tenant/patients/"),
  getPatient: (id: string) => apiFetch<Patient>(`/api/tenant/patients/${id}`),
  checkPatientHistory: (id: string) =>
    apiFetch<{ has_history: boolean }>(
      `/api/tenant/patients/${id}/has-history`,
    ),
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
  sharePatient: (patientId: string, doctorId: string) =>
    apiFetch<PatientShare>(`/api/tenant/patients/${patientId}/share`, {
      method: "POST",
      body: JSON.stringify({ doctor_id: doctorId }),
    }),
  unsharePatient: (patientId: string, doctorId: string) =>
    apiFetch<{ ok: boolean }>(
      `/api/tenant/patients/${patientId}/share/${doctorId}`,
      {
        method: "DELETE",
      },
    ),

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
  deleteAppointment: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/tenant/appointments/${id}`, {
      method: "DELETE",
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
  getOdontogramsByPatient: (patientId: string) =>
    apiFetch<Odontogram[]>(`/api/tenant/odontograms/?patient_id=${patientId}`),
  createOdontogram: (data: Partial<Odontogram>) =>
    apiFetch<Odontogram>("/api/tenant/odontograms/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateOdontogram: (id: string, data: Partial<Odontogram>) =>
    apiFetch<Odontogram>(`/api/tenant/odontograms/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteOdontogram: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/tenant/odontograms/${id}`, {
      method: "DELETE",
    }),

  // Treatments per tooth
  getTreatments: () => apiFetch<Treatment[]>("/api/tenant/treatments/"),
  getTreatmentsByOdontogram: (odontogramId: string) =>
    apiFetch<Treatment[]>(`/api/tenant/treatments/?odontogram_id=${odontogramId}`),
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
  deleteTreatment: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/tenant/treatments/${id}`, {
      method: "DELETE",
    }),

  // Medicines
  getMedicines: () => apiFetch<Medicine[]>("/api/tenant/medicines/"),
  createMedicine: (data: { name: string }) =>
    apiFetch<Medicine>("/api/tenant/medicines/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateMedicine: (id: string, name: string) =>
    apiFetch<Medicine>(`/api/tenant/medicines/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),
  deleteMedicine: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/tenant/medicines/${id}`, {
      method: "DELETE",
    }),
};
