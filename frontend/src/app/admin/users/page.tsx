"use client";

import { useEffect, useState } from "react";
import { adminApi, User } from "@/lib/api";
import { Users, AlertTriangle, Shield, User as UserIcon, CheckCircle, XCircle, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        adminApi
            .getUsers()
            .then(setUsers)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const handleApproveReset = async (userId: string) => {
        try {
            await adminApi.approvePasswordReset(userId);
            setUsers(users.map(u => u.id === userId ? { ...u, reset_approved: true, reset_requested: false } : u));
        } catch (e: any) {
            setError(e.message);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="mb-6 border-b border-border pb-4">
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <Users className="text-primary" />
                    Usuarios Globales
                </h1>
                <p className="text-muted-foreground mt-1">
                    {users.length} usuario{users.length !== 1 ? "s" : ""} registrado{users.length !== 1 ? "s" : ""}
                </p>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                    <AlertTriangle size={18} />
                    <span className="font-medium text-sm">{error}</span>
                </div>
            )}

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/30 text-muted-foreground uppercase text-xs tracking-wider">
                                <th className="text-left px-6 py-4 font-medium">Email</th>
                                <th className="text-left px-6 py-4 font-medium">Rol</th>
                                <th className="text-left px-6 py-4 font-medium">Verificado</th>
                                <th className="text-left px-6 py-4 font-medium">Seguridad</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading
                                ? Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} className="border-b border-border/50 animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-48" /></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-20" /></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-16" /></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-24" /></td>
                                    </tr>
                                ))
                                : users.map((u) => (
                                    <tr key={u.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">{u.email}</td>
                                        <td className="px-6 py-4">
                                            {u.rol_global === "superadmin" ? (
                                                <span className="flex items-center gap-1.5 text-primary text-xs font-semibold bg-primary/10 px-2.5 py-1 rounded-full w-fit">
                                                    <Shield size={12} /> superadmin
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold bg-muted px-2.5 py-1 rounded-full w-fit">
                                                    <UserIcon size={12} /> usuario
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {u.is_verified ? (
                                                <span className="flex items-center gap-1.5 text-emerald-500 text-xs font-medium">
                                                    <CheckCircle size={14} /> Sí
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-destructive text-xs font-medium">
                                                    <XCircle size={14} /> No
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {u.reset_requested ? (
                                                <Button size="sm" variant="destructive" onClick={() => handleApproveReset(u.id)} className="h-7 text-xs flex gap-1.5 items-center">
                                                    <KeyRound size={12} /> Aprobar Reseteo
                                                </Button>
                                            ) : u.reset_approved ? (
                                                <span className="text-xs text-emerald-500 font-medium">Reseteo Habilitado</span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
                {!loading && users.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                        <Users size={40} className="mx-auto mb-3 opacity-30" />
                        <p>No hay usuarios registrados</p>
                    </div>
                )}
            </div>
        </div>
    );
}
