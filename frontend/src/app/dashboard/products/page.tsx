"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tenantApi, Product } from "@/lib/api";

export default function ProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("user_role");
        if (!token || role !== "owner") {
            router.push("/login");
            return;
        }
        loadProducts();
    }, [router]);

    async function loadProducts() {
        try {
            const data = await tenantApi.getProducts();
            setProducts(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error al cargar productos");
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSuccess("");
        setSubmitting(true);

        try {
            await tenantApi.createProduct({
                name,
                description: description || undefined,
                price: parseFloat(price) || 0,
                stock: parseInt(stock) || 0,
            });
            setSuccess("Producto creado exitosamente");
            setName("");
            setDescription("");
            setPrice("");
            setStock("");
            await loadProducts();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error al crear producto");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id: string) {
        try {
            await tenantApi.deleteProduct(id);
            setProducts(products.filter((p) => p.id !== id));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error al eliminar");
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                            <Package size={18} />
                        </div>
                        <span className="text-white font-semibold text-lg">Productos</span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-transparent border-slate-700 hover:bg-slate-800 text-white"
                        onClick={() => router.push("/dashboard")}
                    >
                        <ArrowLeft size={16} className="mr-2" /> Dashboard
                    </Button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
                {/* Form */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Plus size={20} /> Registrar Producto
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-slate-400">Nombre *</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Camiseta básica"
                                required
                                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-400">Descripción</Label>
                            <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Opcional"
                                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-400">Precio</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="0.00"
                                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-400">Stock</Label>
                            <Input
                                type="number"
                                min="0"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                placeholder="0"
                                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <Button
                                type="submit"
                                disabled={submitting || !name}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {submitting ? "Guardando..." : "Guardar Producto"}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Product list */}
                <div>
                    <h2 className="text-xl font-bold text-white mb-4">
                        Mis Productos ({products.length})
                    </h2>

                    {products.length === 0 ? (
                        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500">
                            No hay productos registrados aún.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {products.map((p) => (
                                <div
                                    key={p.id}
                                    className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-medium truncate">{p.name}</h3>
                                        {p.description && (
                                            <p className="text-slate-500 text-sm truncate">{p.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-6 ml-4">
                                        <div className="text-right">
                                            <p className="text-blue-400 font-semibold">${p.price.toFixed(2)}</p>
                                            <p className="text-slate-500 text-xs">{p.stock} en stock</p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(p.id)}
                                            className="text-slate-500 hover:text-red-400 transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
