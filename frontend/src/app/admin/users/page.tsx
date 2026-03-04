"use client";

import { useEffect, useState } from "react";
import { adminApi, User } from "@/lib/api";
import { Users, AlertTriangle, Shield, User as UserIcon, CheckCircle, XCircle } from "lucide-react";

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

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Users className="text-blue-400" />
                    Usuarios Globales
                </h1>
                <p className="text-slate-400 mt-1">
                    {users.length} usuario{users.length !== 1 ? "s" : ""} registrado{users.length !== 1 ? "s" : ""}
                </p>
            </div>

            {error && (
                <div className="mb-6 flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-4">
                    <AlertTriangle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase text-xs tracking-wider">
                            <th className="text-left px-6 py-4">Email</th>
                            <th className="text-left px-6 py-4">Rol</th>
                            <th className="text-left px-6 py-4">Verificado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading
                            ? Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i} className="border-b border-slate-800/50 animate-pulse">
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-48" /></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-20" /></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-800 rounded w-16" /></td>
                                </tr>
                            ))
                            : users.map((u) => (
                                <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{u.email}</td>
                                    <td className="px-6 py-4">
                                        {u.rol_global === "superadmin" ? (
                                            <span className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold bg-blue-400/10 px-2 py-1 rounded-full w-fit">
                                                <Shield size={12} /> superadmin
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold bg-slate-700 px-2 py-1 rounded-full w-fit">
                                                <UserIcon size={12} /> usuario
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {u.is_verified ? (
                                            <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
                                                <CheckCircle size={14} /> Sí
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-red-400 text-xs">
                                                <XCircle size={14} /> No
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
                {!loading && users.length === 0 && (
                    <div className="text-center py-16 text-slate-500">
                        <Users size={40} className="mx-auto mb-3 opacity-30" />
                        <p>No hay usuarios registrados</p>
                    </div>
                )}
            </div>
        </div>
    );
}
