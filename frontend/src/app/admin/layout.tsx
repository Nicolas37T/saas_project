"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Shield,
    LayoutDashboard,
    Building2,
    Users,
    CreditCard,
    FileText,
    LogOut,
    Menu,
    X,
} from "lucide-react";

const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/tenants", label: "Tenants", icon: Building2 },
    { href: "/admin/users", label: "Usuarios", icon: Users },
    { href: "/admin/plans", label: "Planes", icon: CreditCard },
    { href: "/admin/subscriptions", label: "Suscripciones", icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("user_role");
        if (!token || role !== "superadmin") {
            router.replace("/login");
        } else {
            setChecking(false);
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user_role");
        router.push("/login");
    };

    if (checking) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950">
                <Shield className="h-10 w-10 text-blue-400 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`${sidebarOpen ? "w-64" : "w-16"
                    } transition-all duration-300 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0`}
            >
                {/* Logo */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between h-16">
                    {sidebarOpen && (
                        <span className="font-bold text-lg flex items-center gap-2 text-white">
                            <Shield className="text-blue-400 flex-shrink-0" size={20} />
                            SaaS Admin
                        </span>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-white hover:bg-slate-800 ml-auto"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                    </Button>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-1">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href || pathname.startsWith(href + "/");
                        return (
                            <Link key={href} href={href}>
                                <Button
                                    variant="ghost"
                                    className={`w-full justify-start gap-3 h-10 ${isActive
                                            ? "bg-blue-600 text-white hover:bg-blue-700"
                                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                                        } ${!sidebarOpen ? "justify-center px-2" : ""}`}
                                >
                                    <Icon size={18} className="flex-shrink-0" />
                                    {sidebarOpen && <span>{label}</span>}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-3 border-t border-slate-800">
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className={`w-full justify-start gap-3 text-slate-400 hover:text-red-400 hover:bg-slate-800 h-10 ${!sidebarOpen ? "justify-center px-2" : ""
                            }`}
                    >
                        <LogOut size={18} className="flex-shrink-0" />
                        {sidebarOpen && <span>Cerrar Sesión</span>}
                    </Button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-auto bg-slate-950">{children}</main>
        </div>
    );
}
