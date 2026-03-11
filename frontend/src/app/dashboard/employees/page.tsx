"use client";

import { useEffect, useState } from "react";
import { Plus, Search, UserPlus, Mail, Shield, User, Loader2, X, Check, Trash2, Edit2, AlertCircle } from "lucide-react";
import { tenantApi, Employee, Role } from "@/lib/api";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    role_id: "",
  });

  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchData();
  }, []);

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
    setMessage({ type: "", text: "" });
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
    setMessage({ type: "", text: "" });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      if (editingEmployee) {
        // Prepare update data, only include password if not empty
        const updateData: any = { ...formData };
        if (!updateData.password) delete updateData.password;
        
        await tenantApi.updateEmployee(editingEmployee.id, updateData);
        setMessage({ type: "success", text: "Empleado actualizado exitosamente" });
      } else {
        await tenantApi.createEmployee(formData);
        setMessage({ type: "success", text: "Empleado creado exitosamente" });
      }
      
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Error al procesar la solicitud" });
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
    } catch (error: any) {
      alert(error.message || "Error al eliminar empleado");
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
          <h1 className="text-3xl font-bold text-white tracking-tight">Gestión de Empleados</h1>
          <p className="text-slate-400 mt-1">Administra el personal de tu clínica y sus accesos.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 font-medium"
        >
          <UserPlus size={18} />
          Nuevo Empleado
        </button>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                    type="text"
                    placeholder="Buscar por nombre, email o usuario..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="text-sm text-slate-500">
                Mostrando {filteredEmployees.length} empleados activos
            </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="py-20 text-center">
            <User className="mx-auto text-slate-700 mb-4" size={48} />
            <p className="text-slate-500 text-lg">No se encontraron empleados activos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50">
                  <th className="px-6 py-4 text-slate-400 font-medium text-sm border-b border-slate-800">Empleado</th>
                  <th className="px-6 py-4 text-slate-400 font-medium text-sm border-b border-slate-800">Usuario</th>
                  <th className="px-6 py-4 text-slate-400 font-medium text-sm border-b border-slate-800">Rol</th>
                  <th className="px-6 py-4 text-slate-400 font-medium text-sm border-b border-slate-800">Estado</th>
                  <th className="px-6 py-4 text-slate-400 font-medium text-sm border-b border-slate-800 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20 font-bold">
                          {emp.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-white font-medium">{emp.full_name}</div>
                          <div className="text-slate-500 text-xs flex items-center gap-1">
                            <Mail size={12} /> {emp.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">@{emp.username}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-medium uppercase tracking-wider">
                        {emp.role?.name || "Sin Rol"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {emp.status ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 text-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Activo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-500 text-sm">
                          <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => handleOpenEdit(emp)}
                                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                                title="Editar"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button 
                                onClick={() => setShowDeleteConfirm(emp.id)}
                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
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
        )}
      </div>

      {/* Modal Nueva/Editar Cuenta */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                 {editingEmployee ? <Edit2 className="text-blue-500" /> : <UserPlus className="text-blue-500" />} 
                 {editingEmployee ? "Editar Empleado" : "Nuevo Empleado"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-400 ml-1">Nombre Completo</label>
                    <input
                        required
                        type="text"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Ej: Dr. Juan Perez"
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-400 ml-1">Nombre de Usuario</label>
                    <input
                        required
                        type="text"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="jperez"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                    />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-400 ml-1">Correo Electrónico</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input
                        required
                        type="email"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="juan@ejemplo.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-400 ml-1">
                    {editingEmployee ? "Cambiar Contraseña (opcional)" : "Contraseña"}
                </label>
                <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input
                        required={!editingEmployee}
                        type="password"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder={editingEmployee ? "Dejar en blanco para no cambiar" : "••••••••"}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-400 ml-1">Rol Asignado</label>
                <select
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                  value={formData.role_id}
                  onChange={(e) => setFormData({...formData, role_id: e.target.value})}
                >
                  <option value="" disabled>Seleccionar Rol</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>

              {message.text && (
                <div className={`p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {message.text}
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                  {editingEmployee ? "Guardar Cambios" : "Crear Cuenta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(null)}></div>
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center space-y-4">
                    <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20 mt-2">
                        <AlertCircle size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white">¿Eliminar empleado?</h3>
                        <p className="text-slate-400 text-sm px-4">
                            Esta acción desactivará la cuenta del empleado. No podrá acceder al sistema, pero sus datos se conservarán en la base de datos.
                        </p>
                    </div>
                    <div className="flex gap-3 pt-4 px-2">
                        <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            disabled={isSaving}
                            onClick={() => handleDelete(showDeleteConfirm)}
                            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
