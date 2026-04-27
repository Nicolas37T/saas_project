"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
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
import { ThemeToggle } from "@/components/theme-toggle";

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
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(true);
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

    useEffect(() => {
        const handleResize = () => {
            const desk = window.innerWidth >= 768;
            setIsDesktop(desk);
            if (desk) setSidebarOpen(true);
            else setSidebarOpen(false);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user_role");
        router.push("/login");
    };

    if (checking) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Shield className="h-12 w-12 text-primary animate-pulse" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Mobile Header & Overlay */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-card/80 backdrop-blur-md z-30 flex items-center justify-between px-4">
                <div className="flex items-center gap-2 font-bold text-lg text-foreground">
                    <Image src="/logo.png" alt="TRZ Corp. Dental" width={120} height={32} className="h-8 w-auto object-contain" />
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </Button>
                </div>
            </div>

            {/* Overlay Mobile */}
            {!isDesktop && sidebarOpen && (
                <div 
                    className="fixed inset-0 top-16 bg-black/50 backdrop-blur-sm z-40"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed md:relative top-16 md:top-0 h-[calc(100vh-4rem)] md:h-screen bg-card border-r border-border flex flex-col flex-shrink-0 z-50 transition-all duration-300
                    ${isDesktop ? (sidebarOpen ? "w-64" : "w-20") : (sidebarOpen ? "w-64 left-0" : "w-64 -left-full")}
                `}
            >
                {/* Logo Desktop */}
                <div className="hidden md:flex p-4 border-b border-border items-center justify-between h-16">
                    {sidebarOpen && (
                        <span className="font-bold text-lg flex items-center gap-2">
                            <Image src="/logo.png" alt="TRZ Corp. Dental" width={120} height={32} className="h-8 w-auto object-contain" />
                        </span>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground hover:bg-accent ml-auto"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <Menu size={18} />
                    </Button>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href || pathname.startsWith(href + "/");
                        return (
                            <Link key={href} href={href} onClick={() => !isDesktop && setSidebarOpen(false)}>
                                <Button
                                    variant="ghost"
                                    className={`w-full justify-start gap-3 h-11 mb-1 rounded-xl transition-all ${
                                        isActive
                                            ? "bg-primary/10 text-primary font-medium"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                    } ${(!sidebarOpen && isDesktop) ? "justify-center px-2" : "px-4"}`}
                                >
                                    <Icon size={20} className="flex-shrink-0" />
                                    {(sidebarOpen || !isDesktop) && <span>{label}</span>}
                                </Button>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-border">
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className={`w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors ${
                            (!sidebarOpen && isDesktop) ? "justify-center px-2" : "px-4"
                        }`}
                    >
                        <LogOut size={20} className="flex-shrink-0" />
                        {(sidebarOpen || !isDesktop) && <span>Cerrar Sesión</span>}
                    </Button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background pt-16 md:pt-0 w-full max-w-[100vw] relative">
                {/* Desktop Header */}
                <header className="hidden md:flex h-16 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-30 items-center justify-between px-8">
                    <h2 className="text-xl font-semibold text-foreground">
                        {navItems.find(i => pathname === i.href || pathname.startsWith(i.href + "/"))?.label || "Panel de Control"}
                    </h2>
                    <ThemeToggle />
                </header>
                <div className="p-0 relative">
                    {children}
                </div>
            </main>
        </div>
    );
}
