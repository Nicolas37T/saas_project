"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Users,
  CalendarDays,
  Activity,
  CreditCard,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Stethoscope,
  Menu,
  X,
  ClipboardClock,
  User as UserIcon,
  Contact,
  Pill,
  DollarSign,
  BookOpen
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { tenantApi, API_BASE } from "@/lib/api";

// Helper function to decode JWT and get user info
function decodeJWT(token: string): { email?: string; full_name?: string; sub?: string } | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function BillingBadge({ subStatus }: { subStatus: any }) {
  if (!subStatus) return null;

  let daysLeft = 0;
  if (subStatus && subStatus.end_date) {
    const end = new Date(subStatus.end_date);
    end.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    daysLeft = Math.max(0, Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  const isLow = daysLeft <= 3;

  return (
    <Link 
      href="/dashboard/billing"
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all hover:scale-105 border ${
        isLow 
          ? "bg-red-500/10 text-red-600 border-red-500/50 animate-pulse" 
          : "bg-primary/10 text-primary border-primary/20"
      }`}
    >
      <CreditCard size={12} />
      <span>{subStatus.plan_name || "Plan"}</span>
      <span className="opacity-50">•</span>
      <span>{daysLeft} días restantes</span>
    </Link>
  );
}

function UserMenuHeader({
  navItems,
  pathname,
  userName,
  subStatus,
  onLogout,
}: {
  navItems: { name: string; href: string }[];
  pathname: string;
  userName: string;
  subStatus: any;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const pageTitle =
    navItems.find(
      (i) => pathname === i.href || (i.href !== "/dashboard" && pathname.startsWith(i.href))
    )?.name || "Dashboard";

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <header className="hidden md:flex h-16 border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-10 items-center justify-between px-8">
      <h2 className="text-xl font-semibold">{pageTitle}</h2>
      <div className="flex items-center gap-4">
        <BillingBadge subStatus={subStatus} />
        <ThemeToggle />
        {/* User menu */}
        <div ref={ref} className="relative">
          <button
            id="user-menu-trigger"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-accent transition-colors group"
            aria-haspopup="true"
            aria-expanded={open}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-semibold shadow-sm select-none">
              {initials}
            </div>
            {userName && (
              <span className="text-sm font-medium text-foreground max-w-[140px] truncate">
                {userName}
              </span>
            )}
            <svg
              className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-border bg-popover shadow-xl shadow-black/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 z-50">
              <div className="px-4 py-3 border-b border-border/60">
                <p className="text-xs text-muted-foreground">Sesión iniciada como</p>
                <p className="text-sm font-semibold truncate mt-0.5">{userName || "Usuario"}</p>
              </div>
              <div className="p-1.5">
                <button
                  id="logout-button"
                  onClick={() => { setOpen(false); onLogout(); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                >
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [subdomain, setSubdomain] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantLogo, setTenantLogo] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subStatus, setSubStatus] = useState<any>(null);

  const role = typeof window !== 'undefined' ? localStorage.getItem("user_role") : "empleado";
  const isPrivileged = role === "owner" || role === "admin" || role === "superadmin" || role === "administrador";
  const isReceptionist = role === "recepcionista";

  useEffect(() => {
    async function loadTenantData() {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("user_role");
      const sub = localStorage.getItem("tenant_subdomain");

      if (!token || !sub) {
        router.push("/login");
        return;
      }

      setSubdomain(sub);

      // Decode token to get user name
      const decoded = decodeJWT(token);
      if (decoded?.full_name) {
        setUserName(decoded.full_name);
      } else if (decoded?.email) {
        setUserName(decoded.email.split('@')[0]);
      }

        try {
          const config = await tenantApi.getTenantConfig();
          if (config) {
              setTenantName(config.business_name || sub);
              setTenantLogo(config.logo_url || "");
          }
        } catch (e: any) {
          setTenantName(sub);
          // Si es 403 y es owner, probablemente está suspendido
          if (e.message.includes("expirado") || e.message.includes("suspendida")) {
              if (isPrivileged && pathname !== "/dashboard/billing") {
                  router.push("/dashboard/billing");
              }
          }
        }

        // Fetch billing status for the badge
        if (isPrivileged) {
          try {
            const res = await fetch(`${API_BASE}/api/tenant/billing/status`, {
                headers: { "Authorization": `Bearer ${token}`, "X-Tenant": sub }
            });
            if (res.ok) setSubStatus(await res.json());
          } catch (e) {}
        }

      setLoading(false);
    }
    loadTenantData();
  }, [router]);



  // Protection: Redirect if receptionist tries to access restricted routes
  useEffect(() => {
    if (!loading && isReceptionist) {
      const restrictedPaths = ["/dashboard/historyPatients", "/dashboard/treatments", "/dashboard/settings", "/dashboard/employees"];
      if (restrictedPaths.some(path => pathname.startsWith(path))) {
        router.push("/dashboard");
      }
    }
  }, [loading, isReceptionist, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse w-12 h-12 rounded-full border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent animate-spin"></div>
      </div>
    );
  }

  const navItems = [
    { name: "Inicio", href: "/dashboard", icon: <Activity size={20} /> },
    {
      name: "Pacientes",
      href: "/dashboard/patients",
      icon: <Users size={20} />,
    },
    ...(!isReceptionist ? [
      {
        name: "Historial Médico",
        href: "/dashboard/historyPatients",
        icon: <ClipboardClock size={20} />,
      },
    ] : []),
    {
      name: "Citas",
      href: "/dashboard/appointments",
      icon: <CalendarDays size={20} />,
    },
    ...(!isReceptionist ? [
      {
        name: "Tratamientos",
        href: "/dashboard/treatments",
        icon: <Stethoscope size={20} />,
      },
      {
        name: "Recetas",
        href: "/dashboard/prescription",
        icon: <Pill size={20} />,
      },
      {
        name: "Cotizaciones",
        href: "/dashboard/price",
        icon: <DollarSign size={20} />,
      },
      {
        name: "Catálogo",
        href: "/dashboard/treatment-catalog",
        icon: <BookOpen size={20} />,
      }
    ] : []),
    {
      name: "Pagos",
      href: "/dashboard/payments",
      icon: <CreditCard size={20} />,
    },
    ...(isPrivileged ? [
      {
        name: "Empleados",
        href: "/dashboard/employees",
        icon: <Contact size={20} />,
      },
      {
        name: "Configuración",
        href: "/dashboard/settings",
        icon: <SettingsIcon size={20} />,
      },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar backdrop-blur-md fixed h-full z-20">
        <div className="p-6 flex items-start gap-3">
          {tenantLogo ? (
            <img src={tenantLogo} alt="Logo" className="h-8 w-8 object-contain rounded-full shadow-lg flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground shadow-lg flex-shrink-0">
              <Building2 size={18} />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-lg tracking-tight truncate" title={tenantName || subdomain}>
              {tenantName || subdomain}
            </span>
            {userName && (
              <span className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                <UserIcon size={16} />
                {userName}
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>


      </aside>

      {/* Mobile Header & Overlay */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-sidebar/80 backdrop-blur-md z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {tenantLogo ? (
            <img src={tenantLogo} alt="Logo" className="h-8 w-8 object-contain rounded-full shadow-lg flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground flex-shrink-0">
              <Building2 size={18} />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-bold tracking-tight capitalize truncate max-w-[120px]" title={tenantName || subdomain}>
              {tenantName || subdomain}
            </span>
            {userName && (
              <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <UserIcon size={10} />
                {userName}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPrivileged && <BillingBadge subStatus={subStatus} />}
          <ThemeToggle />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground flex-shrink-0"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="md:hidden fixed inset-0 top-16 bg-black/50 backdrop-blur-sm z-10"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="md:hidden fixed inset-0 top-16 bg-background z-20 flex flex-col">
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${
                      isActive
                        ? "bg-primary/20 text-primary font-medium"
                        : "text-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            {/* Logout — fijo al fondo, siempre visible */}
            <div className="p-4 border-t border-border flex-shrink-0">
              <button
                id="mobile-logout-button"
                onClick={() => {
                  setSidebarOpen(false);
                  localStorage.clear();
                  router.push("/login");
                }}
                className="flex items-center gap-3 w-full px-4 py-3.5 text-destructive hover:bg-destructive/10 rounded-xl transition-colors font-medium"
              >
                <LogOut size={20} />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-screen flex flex-col w-full max-w-[100vw] overflow-x-hidden relative">
        {/* Desktop Topbar */}
        <UserMenuHeader
          navItems={navItems}
          pathname={pathname}
          userName={userName}
          subStatus={subStatus}
          onLogout={() => { localStorage.clear(); router.push("/login"); }}
        />

        <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-10 relative w-full">{children}</div>
      </main>
    </div>
  );
}
