"use client";

import { useEffect, useState } from "react";
import { Plus, Search, UserPlus, Mail, Shield, User, Loader2, X, Check, Trash2, Edit2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { tenantApi, Employee, Role } from "@/lib/api";
import { CustomModal, ConfirmModal, SuccessModal } from "@/components/ui/custom-modal";
import { Button } from "@/components/ui/button";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    role_id: "",
  });

  // Modal: Success message
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successInfo, setSuccessInfo] = useState({ title: "", message: "" });
  
  // Modal: Error message
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-sugerir username basado en email si está vacío y estamos creando
  useEffect(() => {
    if (!editingEmployee && formData.email && !formData.username) {
      const suggested = formData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      setFormData(prev => ({ ...prev, username: suggested }));
    }
  }, [formData.email, editingEmployee]);

  const fetchData = async () => {
    try {
      const [empData, rolesData] = await Promise.all([
        tenantApi.getEmployees(),
        tenantApi.getRoles(),
      ]);
      setEmployees(empData);
      setRoles(rolesData);
      if (rolesData.length > 0 && !formData.role_id) {
          setFormData(prev => ({ ...prev, role_id: rolesData[0].id }));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setFormData({
      username: "",
      email: "",
      full_name: "",
      password: "",
      role_id: roles.length > 0 ? roles[0].id : "",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      username: emp.username,
      email: emp.email,
      full_name: emp.full_name,
      password: "", // Password remains empty unless user wants to change it
      role_id: emp.role?.id || "",
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingEmployee) {
        const updateData: any = { ...formData };
        if (!updateData.password) delete updateData.password;
        
        await tenantApi.updateEmployee(editingEmployee.id, updateData);
        setSuccessInfo({ title: "Empleado Actualizado", message: "La información del empleado ha sido actualizada con éxito." });
      } else {
        await tenantApi.createEmployee(formData);
        setSuccessInfo({ title: "Empleado Creado", message: "La cuenta del nuevo empleado ha sido creada con éxito." });
      }
      
      setShowModal(false);
      setIsSuccessModalOpen(true);
      fetchData();
    } catch (error: any) {
      setErrorText(error.message || "Error al procesar la solicitud");
      setIsErrorModalOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSaving(true);
    try {
      await tenantApi.deleteEmployee(id);
      setEmployees(employees.filter(e => e.id !== id));
      setShowDeleteConfirm(null);
      setSuccessInfo({ title: "Empleado Eliminado", message: "La cuenta ha sido desactivada correctamente." });
      setIsSuccessModalOpen(true);
    } catch (error: any) {
      setErrorText(error.message || "Error al eliminar empleado");
      setIsErrorModalOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Empleados</h1>
          <p className="text-muted-foreground mt-1">Administra el personal de tu clínica y sus accesos.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-primary/20 font-medium"
        >
          <UserPlus size={18} />
          Nuevo Empleado
        </button>
      </div>

      <div className="bg-card backdrop-blur-md border border-border rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                    type="text"
                    placeholder="Buscar por nombre, email o usuario..."
                    className="w-full bg-muted border border-border rounded-xl py-2.5 pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="text-sm text-muted-foreground">
                Mostrando {filteredEmployees.length} empleados activos
            </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={40} />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="py-20 text-center">
            <User className="mx-auto text-muted-foreground mb-4" size={48} />
            <p className="text-muted-foreground text-lg">No se encontraron empleados activos.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-6 py-4 text-muted-foreground font-medium text-sm border-b border-border">Empleado</th>
                    <th className="px-6 py-4 text-muted-foreground font-medium text-sm border-b border-border">Usuario</th>
                    <th className="px-6 py-4 text-muted-foreground font-medium text-sm border-b border-border">Rol</th>
                    <th className="px-6 py-4 text-muted-foreground font-medium text-sm border-b border-border">Estado</th>
                    <th className="px-6 py-4 text-muted-foreground font-medium text-sm border-b border-border text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary border border-primary/20 font-bold">
                            {emp.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{emp.full_name}</div>
                            <div className="text-muted-foreground text-xs flex items-center gap-1">
                              <Mail size={12} /> {emp.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">@{emp.username}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium uppercase tracking-wider">
                          {emp.role?.name || "Sin Rol"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {emp.status ? (
                          <span className="flex items-center gap-1.5 text-green-500 text-sm">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Activo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
                            <span className="w-2 h-2 rounded-full bg-muted-foreground"></span>
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                              <button
                                  onClick={() => handleOpenEdit(emp)}
                                  className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                  title="Editar"
                              >
                                  <Edit2 size={18} />
                              </button>
                              <button
                                  onClick={() => {
                                      setEditingEmployee(emp);
                                      setShowDeleteConfirm(emp.id);
                                  }}
                                  className="p-2 text-muted-foreground  hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                                  title="Eliminar"
                              >
                                  <Trash2 size={18} />
                              </button>
                          </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filteredEmployees.map((emp) => (
                <div key={emp.id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary border border-primary/20 font-bold flex-shrink-0">
                        {emp.full_name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">{emp.full_name}</div>
                        <div className="text-muted-foreground text-xs flex items-center gap-1">
                          <Mail size={12} /> {emp.email}
                        </div>
                        <div className="text-muted-foreground text-xs mt-0.5">@{emp.username}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {emp.status ? (
                        <span className="flex items-center gap-1.5 text-green-500 text-xs">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          Activo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                          <span className="w-2 h-2 rounded-full bg-muted-foreground"></span>
                          Inactivo
                        </span>
                      )}
                      <div className="flex gap-1">
                        <button
                            onClick={() => handleOpenEdit(emp)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                            title="Editar"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            onClick={() => {
                                setEditingEmployee(emp);
                                setShowDeleteConfirm(emp.id);
                            }}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                            title="Eliminar"
                        >
                            <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium uppercase tracking-wider">
                      {emp.role?.name || "Sin Rol"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal Nueva/Editar Cuenta */}
      <CustomModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingEmployee ? "Editar Empleado" : "Nuevo Empleado"}
      >
            <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium ml-1">Nombre Completo</label>
                    <input
                        required
                        type="text"
                        className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Ej: Dr. Juan Perez"
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium ml-1">Nombre de Usuario</label>
                    <input
                        required
                        type="text"
                        className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="jperez"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                    />
                </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium ml-1">Correo Electrónico</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        required
                        type="email"
                        className="w-full bg-muted border border-border rounded-xl py-2.5 pl-10 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="juan@ejemplo.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium ml-1">
                    {editingEmployee ? "Cambiar Contraseña (opcional)" : "Contraseña"}
                </label>
                <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        required={!editingEmployee}
                        type={showPassword ? "text" : "password"}
                        className="w-full bg-muted border border-border rounded-xl py-2.5 pl-10 pr-12 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder={editingEmployee ? "Dejar en blanco para no cambiar" : "••••••••"}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium ml-1">Rol Asignado</label>
                <select
                  required
                  className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                  value={formData.role_id}
                  onChange={(e) => setFormData({...formData, role_id: e.target.value})}
                >
                  <option value="" disabled>Seleccionar Rol</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  onClick={() => setShowModal(false)}
                  variant="ghost"
                  className="flex-1 hover:bg-accent"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                  {editingEmployee ? "Guardar" : "Crear"}
                </Button>
              </div>
            </form>
      </CustomModal>

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmModal
        isOpen={!!showDeleteConfirm}
        onClose={() => {
            setShowDeleteConfirm(null);
            setEditingEmployee(null);
        }}
        onConfirm={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
        title="¿Eliminar empleado?"
        message={
            <span>
                <strong>{editingEmployee?.full_name}</strong> será desactivado del sistema. No podrá acceder al sistema, pero sus datos se conservarán en la base de datos.
            </span>
        }
        variant="danger"
        confirmText="Sí, eliminar"
        isLoading={isSaving}
        icon={<Trash2 size={26} className="text-destructive" />}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title={successInfo.title}
        message={successInfo.message}
      />

      {/* Error Modal */}
      <CustomModal isOpen={isErrorModalOpen} onClose={() => setIsErrorModalOpen(false)} title="Error" maxWidth="max-w-sm">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={26} className="text-destructive" />
            </div>
            <p className="text-muted-foreground text-sm mb-6">{errorText}</p>
            <Button className="w-full bg-muted hover:bg-muted/80" onClick={() => setIsErrorModalOpen(false)}>
              Entendido
            </Button>
          </div>
      </CustomModal>
    </div>
  );
}
