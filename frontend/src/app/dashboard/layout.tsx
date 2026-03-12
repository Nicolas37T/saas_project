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
  Contact
} from "lucide-react";
import { tenantApi } from "@/lib/api";

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse w-12 h-12 rounded-full border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent animate-spin"></div>
      </div>
    );
  }

  const role = typeof window !== 'undefined' ? localStorage.getItem("user_role") : "empleado";
  const isPrivileged = role === "owner" || role === "admin" || role === "superadmin" || role === "administrador";

  const navItems = [
    { name: "Inicio", href: "/dashboard", icon: <Activity size={20} /> },
    {
      name: "Pacientes",
      href: "/dashboard/patients",
      icon: <Users size={20} />,
    },
    {
      name: "Historial Médico",
      href: "/dashboard/historyPatients",
      icon: <ClipboardClock size={20} />,
    },
    {
      name: "Citas",
      href: "/dashboard/appointments",
      icon: <CalendarDays size={20} />,
    },
    {
      name: "Tratamientos",
      href: "/dashboard/treatments",
      icon: <Stethoscope size={20} />,
    },
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
    <div className="min-h-screen bg-slate-950 text-slate-300 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-md fixed h-full z-20">
        <div className="p-6 flex items-center gap-3">
          {tenantLogo ? (
            <img src={tenantLogo} alt="Logo" className="h-8 w-8 object-contain rounded-full shadow-lg" />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Building2 size={18} />
            </div>
          )}
          <span className="text-white font-bold text-lg tracking-tight capitalize truncate" title={tenantName || subdomain}>
            {tenantName || subdomain}
          </span>
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
                    ? "bg-blue-600/10 text-blue-400 font-medium"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => {
              localStorage.clear();
              router.push("/login");
            }}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile Header & Overlay */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {tenantLogo ? (
            <img src={tenantLogo} alt="Logo" className="h-8 w-8 object-contain rounded-full shadow-lg" />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white">
              <Building2 size={18} />
            </div>
          )}
          <span className="text-white font-bold tracking-tight capitalize truncate max-w-[150px]" title={tenantName || subdomain}>
            {tenantName || subdomain}
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-slate-400"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-slate-950/95 backdrop-blur-md z-20 flex flex-col">
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
                      ? "bg-blue-600/20 text-blue-400 font-medium"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
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
        <header className="hidden md:flex h-20 border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10 items-center justify-between px-8">
          <h2 className="text-xl font-semibold text-white">
            {navItems.find(
              (i) =>
                pathname === i.href ||
                (i.href !== "/dashboard" && pathname.startsWith(i.href)),
            )?.name || "Dashboard"}
          </h2>
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-white transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border border-slate-900"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-slate-800"></div>
          </div>
        </header>

        <div className="flex-1 p-6 lg:p-10 relative">{children}</div>
      </main>
    </div>
  );
}
