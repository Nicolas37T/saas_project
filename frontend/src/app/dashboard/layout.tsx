"use client";

import { useEffect, useState } from "react";
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
  Pill
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { tenantApi } from "@/lib/api";

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
      } catch (e) {
        setTenantName(sub);
      }

      setLoading(false);
    }
    loadTenantData();
  }, [router]);

  const role = typeof window !== 'undefined' ? localStorage.getItem("user_role") : "empleado";
  const isPrivileged = role === "owner" || role === "admin" || role === "superadmin" || role === "administrador";
  const isReceptionist = role === "recepcionista";

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
      }
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

        <nav className="flex-1 px-4 py-6 space-y-2">
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

        <div className="p-4 border-t border-border">
          <button
            onClick={() => {
              localStorage.clear();
              router.push("/login");
            }}
            className="flex items-center gap-3 w-full px-4 py-3 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
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
        <div className="md:hidden fixed inset-0 top-16 bg-background/95 backdrop-blur-md z-20 flex flex-col">
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
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-screen flex flex-col">
        {/* Desktop Topbar */}
        <header className="hidden md:flex h-20 border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-10 items-center justify-between px-8">
          <h2 className="text-xl font-semibold">
            {navItems.find(
              (i) =>
                pathname === i.href ||
                (i.href !== "/dashboard" && pathname.startsWith(i.href)),
            )?.name || "Dashboard"}
          </h2>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border border-background"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 border-2 border-border"></div>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-10 relative">{children}</div>
      </main>
    </div>
  );
}
