"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Check,
  DollarSign,
  Stethoscope,
  RefreshCw,
} from "lucide-react";
import { tenantApi, TreatmentCatalogItem } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmModal } from "@/components/ui/custom-modal";

export default function TreatmentCatalogPage() {
  const [items, setItems] = useState<TreatmentCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create form
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState<string>("");
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<TreatmentCatalogItem | null>(null);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const data = await tenantApi.getTreatmentCatalog();
      setItems(data);
    } catch (error) {
      console.error("Error loading treatment catalog", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const priceValue = newPrice ? parseFloat(newPrice) : null;
      await tenantApi.createTreatmentCatalogItem({
        name: newName.trim(),
        default_price: priceValue && priceValue > 0 ? priceValue : null,
      });
      setNewName("");
      setNewPrice("");
      await loadCatalog();
    } catch (error) {
      console.error("Error creating catalog item", error);
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (item: TreatmentCatalogItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPrice(item.default_price != null ? String(item.default_price) : "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditPrice("");
  };

  const handleUpdate = async () => {
    if (!editingId || !editName.trim()) return;
    setSaving(true);
    try {
      const priceValue = editPrice ? parseFloat(editPrice) : null;
      await tenantApi.updateTreatmentCatalogItem(editingId, {
        name: editName.trim(),
        default_price: priceValue && priceValue > 0 ? priceValue : null,
      });
      cancelEdit();
      await loadCatalog();
    } catch (error) {
      console.error("Error updating catalog item", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await tenantApi.deleteTreatmentCatalogItem(deleteTarget.id);
      setDeleteTarget(null);
      await loadCatalog();
    } catch (error) {
      console.error("Error deleting catalog item", error);
    }
  };

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 flex items-center gap-2">
            <BookOpen className="text-primary flex-shrink-0" size={24} />
            <span className="break-words">Catálogo de Tratamientos</span>
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Define tratamientos reutilizables con precio predeterminado. Estos aparecerán como sugerencias al crear historiales médicos.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadCatalog}
          className="bg-muted border-border hover:bg-accent w-full sm:w-auto text-sm"
        >
          <RefreshCw size={16} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
          Refrescar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Stethoscope size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Tratamientos
            </p>
            <p className="text-lg font-bold">{items.length}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <DollarSign size={18} className="text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Con precio
            </p>
            <p className="text-lg font-bold">
              {items.filter((i) => i.default_price != null && i.default_price > 0).length}
            </p>
          </div>
        </div>
      </div>

      {/* Add form */}
      <Card className="bg-card border-border backdrop-blur-sm shadow-xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-purple-500 to-amber-500"></div>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Plus size={18} className="text-primary" />
            Agregar Nuevo Tratamiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                Nombre del Tratamiento *
              </label>
              <Input
                placeholder="Ej: Endodoncia, Limpieza Dental, Extracción..."
                className="bg-muted/50 border-gray-500 dark:border-white/50 focus:border-primary"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="w-full sm:w-40 space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                Precio (Bs) <span className="text-muted-foreground/60">Opcional</span>
              </label>
              <Input
                type="number"
                placeholder="0"
                className="bg-muted/50 border-gray-500 dark:border-white/50 text-amber-500 font-bold focus:border-amber-500"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className={`w-full sm:w-auto h-10 font-semibold transition-all ${
                  newName.trim()
                    ? "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {creating ? (
                  <RefreshCw size={16} className="animate-spin mr-2" />
                ) : (
                  <Plus size={16} className="mr-2" />
                )}
                Agregar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          placeholder="Buscar tratamiento..."
          className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {loading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-24 gap-4">
          <div className="animate-spin w-10 h-10 rounded-full border-2 border-primary border-t-transparent shadow-[0_0_15px_rgba(99,102,241,0.3)]"></div>
          <p className="text-muted-foreground animate-pulse text-sm font-medium tracking-widest">
            CARGANDO CATÁLOGO...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card border-border border-dashed backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6 border border-border/50">
              <BookOpen className="text-muted-foreground" size={40} />
            </div>
            <h3 className="text-xl font-bold mb-3">
              {search ? "Sin resultados" : "Catálogo vacío"}
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {search
                ? `No se encontraron tratamientos que coincidan con "${search}".`
                : "Agrega tu primer tratamiento predefinido para empezar a usarlo como autocompletado en historiales médicos."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden backdrop-blur-md">
          <div className="divide-y divide-border/30">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors group"
              >
                {editingId === item.id ? (
                  /* Edit mode */
                  <div className="flex flex-col sm:flex-row flex-1 gap-2 items-start sm:items-end">
                    <div className="flex-1 w-full space-y-1">
                      <label className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                        Nombre
                      </label>
                      <Input
                        autoFocus
                        className="bg-muted/50 border-primary/50 h-9 text-sm"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdate();
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                    </div>
                    <div className="w-full sm:w-32 space-y-1">
                      <label className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                        Precio (Bs)
                      </label>
                      <Input
                        type="number"
                        placeholder="Opcional"
                        className="bg-muted/50 border-primary/50 h-9 text-sm text-amber-500 font-bold"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdate();
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 hover:text-green-500 hover:bg-green-500/10 rounded-full"
                        onClick={handleUpdate}
                        disabled={!editName.trim() || saving}
                      >
                        {saving ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <Check size={16} />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 hover:text-destructive hover:bg-destructive/10 rounded-full"
                        onClick={cancelEdit}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <>
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Stethoscope size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm group-hover:text-primary transition-colors truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        {item.default_price != null && item.default_price > 0
                          ? `Bs. ${item.default_price.toLocaleString()}`
                          : "Sin precio predeterminado"}
                      </p>
                    </div>
                    {item.default_price != null && item.default_price > 0 && (
                      <span className="text-amber-500 font-bold text-sm hidden sm:block">
                        Bs. {item.default_price.toLocaleString()}
                      </span>
                    )}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:text-primary hover:bg-primary/10 rounded-full"
                        onClick={() => startEdit(item)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:text-destructive hover:bg-destructive/10 rounded-full"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="bg-muted/40 px-4 py-3 border-t border-border">
            <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest">
              Total en catálogo: {filtered.length}{" "}
              {filtered.length !== items.length && `de ${items.length}`}
            </p>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="¿Eliminar tratamiento del catálogo?"
        message={
          <span>
            El tratamiento <strong>{deleteTarget?.name}</strong> será eliminado
            del catálogo. Los historiales existentes no serán afectados.
          </span>
        }
        confirmText="SÍ, ELIMINAR"
        variant="danger"
        icon={<Trash2 size={24} className="text-red-500" />}
      />
    </div>
  );
}
