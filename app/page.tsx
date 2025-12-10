"use client"
import { useEffect, useState, useCallback } from "react"
import type React from "react"

import { createBrowserClient } from "@supabase/ssr"
import {
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Package,
  AlertCircle,
  Printer,
  X,
  Search,
  AlertTriangle,
  ArrowUpDown,
  Calendar,
  Sparkles,
  Pencil,
  FileText,
  Eye,
} from "lucide-react"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) {
    return null
  }
  return createBrowserClient(supabaseUrl, supabaseKey)
}

const supabase = getSupabaseClient()

interface Pedido {
  id: string
  nombre_pedido: string
  cliente: string
  precio_total: number
  abono: number
  fecha_entrega: string
  estado: string
  descripcion?: string
}

export default function Dashboard() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"fecha" | "precio">("fecha")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [viewingPedido, setViewingPedido] = useState<Pedido | null>(null)

  // Estados para el formulario
  const [nuevoNombre, setNuevoNombre] = useState("")
  const [nuevoCliente, setNuevoCliente] = useState("")
  const [nuevoPrecio, setNuevoPrecio] = useState("")
  const [nuevoAbono, setNuevoAbono] = useState("")
  const [nuevaFecha, setNuevaFecha] = useState("")
  const [nuevaDescripcion, setNuevaDescripcion] = useState("")

  const [editNombre, setEditNombre] = useState("")
  const [editCliente, setEditCliente] = useState("")
  const [editPrecio, setEditPrecio] = useState("")
  const [editAbono, setEditAbono] = useState("")
  const [editFecha, setEditFecha] = useState("")
  const [editDescripcion, setEditDescripcion] = useState("")

  const cargarPedidos = useCallback(async () => {
    if (!supabase) {
      setConnectionError("Variables de entorno de Supabase no configuradas")
      setLoading(false)
      return
    }

    setLoading(true)
    setConnectionError(null)

    try {
      const { data, error } = await supabase.from("pedidos").select("*").order("fecha_entrega", { ascending: true })

      if (error) {
        console.error("Error cargando pedidos:", error)
        setConnectionError(error.message)
        setIsConnected(false)
      } else {
        setPedidos(data || [])
        setIsConnected(true)
      }
    } catch (err) {
      console.error("Error de conexión:", err)
      setConnectionError("Error de conexión con la base de datos")
      setIsConnected(false)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    cargarPedidos()
    const defaultDate = new Date()
    defaultDate.setDate(defaultDate.getDate() + 7)
    setNuevaFecha(defaultDate.toISOString().split("T")[0])
  }, [cargarPedidos])

  async function agregarPedido() {
    if (!nuevoNombre || !supabase) return

    const { error } = await supabase.from("pedidos").insert({
      nombre_pedido: nuevoNombre,
      cliente: nuevoCliente,
      precio_total: Number(nuevoPrecio) || 0,
      abono: Number(nuevoAbono) || 0,
      fecha_entrega: nuevaFecha || null,
      estado: "Recepcionado",
      descripcion: nuevaDescripcion || null,
    })

    if (error) {
      alert("Error al guardar: " + error.message)
      return
    }

    setShowModal(false)
    cargarPedidos()
    resetForm()
  }

  function resetForm() {
    setNuevoNombre("")
    setNuevoCliente("")
    setNuevoPrecio("")
    setNuevoAbono("")
    setNuevaDescripcion("")
    const defaultDate = new Date()
    defaultDate.setDate(defaultDate.getDate() + 7)
    setNuevaFecha(defaultDate.toISOString().split("T")[0])
  }

  async function cambiarEstado(id: string, estado: string) {
    if (!supabase) return
    await supabase.from("pedidos").update({ estado }).eq("id", id)
    cargarPedidos()
  }

  async function saldarDeuda(id: string, precio: number) {
    if (!supabase) return
    await supabase.from("pedidos").update({ abono: precio }).eq("id", id)
    cargarPedidos()
  }

  async function borrarPedido(id: string) {
    if (!confirm("¿Borrar este pedido?")) return
    if (!supabase) return
    await supabase.from("pedidos").delete().eq("id", id)
    cargarPedidos()
  }

  function abrirEdicion(pedido: Pedido) {
    setEditingPedido(pedido)
    setEditNombre(pedido.nombre_pedido || "")
    setEditCliente(pedido.cliente || "")
    setEditPrecio(pedido.precio_total?.toString() || "")
    setEditAbono(pedido.abono?.toString() || "")
    setEditFecha(pedido.fecha_entrega || "")
    setEditDescripcion(pedido.descripcion || "")
    setShowEditModal(true)
  }

  async function guardarEdicion() {
    if (!editingPedido || !supabase) return

    const { error } = await supabase
      .from("pedidos")
      .update({
        nombre_pedido: editNombre,
        cliente: editCliente,
        precio_total: Number(editPrecio) || 0,
        abono: Number(editAbono) || 0,
        fecha_entrega: editFecha || null,
        descripcion: editDescripcion || null,
      })
      .eq("id", editingPedido.id)

    if (error) {
      alert("Error al actualizar: " + error.message)
      return
    }

    setShowEditModal(false)
    setEditingPedido(null)
    cargarPedidos()
  }

  async function confirmarBorrado(id: string) {
    if (!supabase) return
    const { error } = await supabase.from("pedidos").delete().eq("id", id)
    if (error) {
      alert("Error al eliminar: " + error.message)
    }
    setShowDeleteConfirm(null)
    cargarPedidos()
  }

  // --- CÁLCULOS ---
  const totalVendido = pedidos.reduce((acc, p) => acc + (p.precio_total || 0), 0)
  const totalRecaudado = pedidos.reduce((acc, p) => acc + (p.abono || 0), 0)
  const porCobrar = totalVendido - totalRecaudado

  const pedidosFiltrados = pedidos
    .filter((p) => {
      const matchesStatus = filterStatus === "all" || p.estado === filterStatus
      const matchesSearch =
        searchQuery === "" ||
        p.nombre_pedido?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.cliente?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === "fecha") {
        const dateA = new Date(a.fecha_entrega).getTime()
        const dateB = new Date(b.fecha_entrega).getTime()
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA
      } else {
        return sortOrder === "asc" ? a.precio_total - b.precio_total : b.precio_total - a.precio_total
      }
    })

  const isUrgent = (fechaEntrega: string) => {
    if (!fechaEntrega) return false
    const today = new Date()
    const delivery = new Date(fechaEntrega)
    const diffTime = delivery.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 2
  }

  const getDaysRemaining = (fechaEntrega: string) => {
    if (!fechaEntrega) return 999
    const today = new Date()
    const delivery = new Date(fechaEntrega)
    const diffTime = delivery.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getStatusStyle = (estado: string) => {
    switch (estado) {
      case "Listo":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
      case "En Proceso":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20"
      default:
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20"
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {connectionError && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-red-400 text-sm">
            <AlertCircle size={16} />
            <span>
              <strong>Error de conexión:</strong> {connectionError}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-[#1a1a1a] bg-gradient-to-b from-[#111] to-[#0a0a0a] sticky top-0 z-40 backdrop-blur-xl">
        <header className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Printer size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Taller 3D</h1>
                <p className="text-sm text-neutral-500 flex items-center gap-2">
                  Sistema de Gestión PLA
                  {isConnected && (
                    <span className="flex items-center gap-1 text-emerald-400 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Conectado
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={cargarPedidos}
              className="p-3 hover:bg-[#1a1a1a] rounded-xl transition-all border border-[#262626] hover:border-emerald-500/50 group"
            >
              <RefreshCw
                size={20}
                className={`text-neutral-400 group-hover:text-emerald-400 transition-colors ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard
              icon={<TrendingUp size={20} />}
              label="Ventas Totales"
              value={`$${totalVendido.toLocaleString()}`}
              colorClass="text-emerald-400"
              bgClass="bg-emerald-500/10"
            />
            <MetricCard
              icon={<DollarSign size={20} />}
              label="Recaudado"
              value={`$${totalRecaudado.toLocaleString()}`}
              colorClass="text-blue-400"
              bgClass="bg-blue-500/10"
            />
            <MetricCard
              icon={<AlertCircle size={20} />}
              label="Por Cobrar"
              value={`$${porCobrar.toLocaleString()}`}
              colorClass="text-red-400"
              bgClass="bg-red-500/10"
            />
            <MetricCard
              icon={<Package size={20} />}
              label="Pedidos"
              value={pedidos.length}
              colorClass="text-neutral-300"
              bgClass="bg-neutral-500/10"
            />
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Buscar por nombre o cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#151515] border border-[#262626] rounded-xl text-white placeholder:text-neutral-600 focus:border-emerald-500/50 focus:outline-none transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (sortBy === "fecha") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  } else {
                    setSortBy("fecha")
                    setSortOrder("asc")
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                  sortBy === "fecha"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-[#151515] border-[#262626] text-neutral-400 hover:text-white"
                }`}
              >
                <Calendar size={16} />
                <span className="text-sm">Fecha</span>
                {sortBy === "fecha" && <ArrowUpDown size={14} />}
              </button>
              <button
                onClick={() => {
                  if (sortBy === "precio") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  } else {
                    setSortBy("precio")
                    setSortOrder("desc")
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                  sortBy === "precio"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-[#151515] border-[#262626] text-neutral-400 hover:text-white"
                }`}
              >
                <DollarSign size={16} />
                <span className="text-sm">Precio</span>
                {sortBy === "precio" && <ArrowUpDown size={14} />}
              </button>
            </div>
          </div>

          {/* Filter buttons */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <FilterButton
              active={filterStatus === "all"}
              onClick={() => setFilterStatus("all")}
              label="Todos"
              count={pedidos.length}
            />
            <FilterButton
              active={filterStatus === "Recepcionado"}
              onClick={() => setFilterStatus("Recepcionado")}
              label="Pendientes"
              count={pedidos.filter((p) => p.estado === "Recepcionado").length}
            />
            <FilterButton
              active={filterStatus === "En Proceso"}
              onClick={() => setFilterStatus("En Proceso")}
              label="En Proceso"
              count={pedidos.filter((p) => p.estado === "En Proceso").length}
            />
            <FilterButton
              active={filterStatus === "Listo"}
              onClick={() => setFilterStatus("Listo")}
              label="Listos"
              count={pedidos.filter((p) => p.estado === "Listo").length}
            />
          </div>
        </header>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center gap-3 text-neutral-500">
              <RefreshCw size={24} className="animate-spin text-emerald-400" />
              <span>Cargando datos...</span>
            </div>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto mb-4 text-neutral-700" />
            <p className="text-neutral-500">
              {pedidos.length === 0 ? "No hay pedidos aún. ¡Crea el primero!" : "No hay pedidos en esta categoría"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pedidosFiltrados.map((p, index) => {
              const deuda = (p.precio_total || 0) - (p.abono || 0)
              const porcentajePagado = p.precio_total > 0 ? (p.abono / p.precio_total) * 100 : 0
              const urgent = isUrgent(p.fecha_entrega) && p.estado !== "Listo"
              const daysLeft = getDaysRemaining(p.fecha_entrega)

              return (
                <div
                  key={p.id}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className={`animate-slide-up bg-[#111] rounded-2xl border p-6 transition-all duration-300 flex flex-col justify-between group hover:shadow-xl ${
                    urgent
                      ? "border-red-500/30 hover:border-red-500/50 hover:shadow-red-500/10"
                      : "border-[#1a1a1a] hover:border-emerald-500/30 hover:shadow-emerald-500/5"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${getStatusStyle(p.estado)}`}>
                          {p.estado === "Recepcionado"
                            ? "PENDIENTE"
                            : p.estado === "En Proceso"
                              ? "EN PROCESO"
                              : "LISTO"}
                        </span>
                        {urgent && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                            <AlertTriangle size={12} />
                            {daysLeft <= 0 ? "VENCIDO" : `${daysLeft}d`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewingPedido(p)}
                          className="text-neutral-600 hover:text-blue-400 transition-colors p-1.5 hover:bg-blue-500/10 rounded-lg"
                          title="Ver detalles"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => abrirEdicion(p)}
                          className="text-neutral-600 hover:text-emerald-400 transition-colors p-1.5 hover:bg-emerald-500/10 rounded-lg"
                          title="Editar pedido"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(p.id)}
                          className="text-neutral-600 hover:text-red-400 transition-colors p-1.5 hover:bg-red-500/10 rounded-lg"
                          title="Eliminar pedido"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <h3
                      onClick={() => setViewingPedido(p)}
                      className="font-bold text-lg text-white leading-tight mb-2 group-hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      {p.nombre_pedido}
                    </h3>
                    <p className="text-sm text-neutral-500 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {p.cliente || "Sin cliente"}
                    </p>

                    {p.descripcion && (
                      <button
                        onClick={() => setViewingPedido(p)}
                        className="flex items-center gap-2 text-xs text-neutral-500 hover:text-emerald-400 mb-3 transition-colors"
                      >
                        <FileText size={12} />
                        <span className="truncate max-w-[180px]">{p.descripcion}</span>
                      </button>
                    )}

                    <button
                      onClick={() => abrirEdicion(p)}
                      className={`w-full flex items-center gap-2 text-xs mb-4 rounded-lg p-3 border transition-all hover:border-emerald-500/30 ${
                        urgent
                          ? "bg-red-500/5 border-red-500/20 text-red-400"
                          : "bg-[#0a0a0a] border-[#1a1a1a] text-neutral-500"
                      }`}
                    >
                      <Clock size={14} className={urgent ? "text-red-400" : "text-emerald-400"} />
                      <span>Entregar: {p.fecha_entrega || "Sin fecha"}</span>
                      <Pencil size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    {/* Barra de progreso */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center text-xs mb-2">
                        <span className="text-neutral-500">Progreso de pago</span>
                        <span className={porcentajePagado === 100 ? "text-emerald-400" : "text-neutral-400"}>
                          {Math.round(porcentajePagado)}%
                        </span>
                      </div>
                      <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden border border-[#1a1a1a]">
                        <div
                          className={`h-full transition-all duration-500 ${
                            porcentajePagado === 100
                              ? "bg-emerald-500"
                              : "bg-gradient-to-r from-emerald-600 to-emerald-400"
                          }`}
                          style={{ width: `${porcentajePagado}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Footer de la card */}
                  <div className="border-t border-[#1a1a1a] pt-4 mt-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-neutral-500 mb-1">Total / Restante</p>
                        <p className="font-bold text-base">
                          <span className="text-white">${p.precio_total?.toLocaleString() || 0}</span>{" "}
                          <span className="text-neutral-700">|</span>{" "}
                          <span className={deuda > 0 ? "text-red-400" : "text-emerald-400"}>
                            ${deuda.toLocaleString()}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          className="text-xs bg-[#1a1a1a] text-neutral-400 hover:text-emerald-400 outline-none cursor-pointer border border-[#262626] rounded-lg px-2 py-1.5 transition-colors"
                          value={p.estado}
                          onChange={(e) => cambiarEstado(p.id, e.target.value)}
                        >
                          <option value="Recepcionado" className="bg-[#151515]">
                            Pendiente
                          </option>
                          <option value="En Proceso" className="bg-[#151515]">
                            En Proceso
                          </option>
                          <option value="Listo" className="bg-[#151515]">
                            Listo
                          </option>
                        </select>
                        {deuda > 0 ? (
                          <button
                            onClick={() => saldarDeuda(p.id, p.precio_total)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:shadow-lg hover:shadow-emerald-500/20"
                          >
                            Cobrar
                          </button>
                        ) : (
                          <CheckCircle size={20} className="text-emerald-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* FAB Button */}
      <button
        onClick={() => setShowModal(true)}
        disabled={!isConnected}
        className="fixed bottom-8 right-8 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white p-5 rounded-2xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all transform hover:scale-105 group z-50"
      >
        <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Modal Nuevo Pedido */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#111] rounded-2xl w-full max-w-md border border-[#1a1a1a] shadow-2xl shadow-emerald-500/10 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#1a1a1a] flex justify-between items-center sticky top-0 bg-[#111] z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Sparkles size={20} className="text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Nuevo Trabajo</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-500 hover:text-white transition-colors p-2 hover:bg-[#1a1a1a] rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-neutral-500 uppercase tracking-wider mb-2 block font-medium">
                  ¿Qué vamos a imprimir? *
                </label>
                <input
                  placeholder="Ej: Prototipos, piezas mecánicas..."
                  className="w-full p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-white placeholder:text-neutral-600 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-neutral-500 uppercase tracking-wider mb-2 block font-medium">
                  Cliente
                </label>
                <input
                  placeholder="Nombre del cliente"
                  className="w-full p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-white placeholder:text-neutral-600 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  value={nuevoCliente}
                  onChange={(e) => setNuevoCliente(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-neutral-500 uppercase tracking-wider mb-2 block font-medium">
                  Descripción (opcional)
                </label>
                <textarea
                  placeholder="Detalles del pedido, especificaciones, notas..."
                  rows={3}
                  className="w-full p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-white placeholder:text-neutral-600 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all resize-none"
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-neutral-500 uppercase tracking-wider mb-2 block font-medium">
                  Fecha de Entrega
                </label>
                <input
                  type="date"
                  className="w-full p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-white focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all [color-scheme:dark]"
                  value={nuevaFecha}
                  onChange={(e) => setNuevaFecha(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-500 uppercase tracking-wider mb-2 block font-medium">
                    Precio Total
                  </label>
                  <input
                    type="number"
                    placeholder="$0"
                    className="w-full p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-white placeholder:text-neutral-600 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    value={nuevoPrecio}
                    onChange={(e) => setNuevoPrecio(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 uppercase tracking-wider mb-2 block font-medium">
                    Abono Inicial
                  </label>
                  <input
                    type="number"
                    placeholder="$0"
                    className="w-full p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-white placeholder:text-neutral-600 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    value={nuevoAbono}
                    onChange={(e) => setNuevoAbono(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#1a1a1a] flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 text-neutral-400 hover:text-white hover:bg-[#1a1a1a] border border-[#262626] rounded-xl transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={agregarPedido}
                disabled={!nuevoNombre}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
              >
                Guardar Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Pedido */}
      {showEditModal && editingPedido && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#111] rounded-2xl w-full max-w-md border border-[#1a1a1a] shadow-2xl shadow-emerald-500/10 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#1a1a1a] flex justify-between items-center sticky top-0 bg-[#111] z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Pencil size={20} className="text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Editar Pedido</h2>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingPedido(null)
                }}
                className="text-neutral-500 hover:text-white transition-colors p-2 hover:bg-[#1a1a1a] rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-neutral-500 uppercase tracking-wider mb-2 block font-medium">
                  Nombre del pedido *
                </label>
                <input
                  placeholder="Ej: Prototipos, piezas mecánicas..."
                  className="w-full p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-white placeholder:text-neutral-600 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-neutral-500 uppercase tracking-wider mb-2 block font-medium">
                  Cliente
                </label>
                <input
                  placeholder="Nombre del cliente"
                  className="w-full p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-white placeholder:text-neutral-600 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  value={editCliente}
                  onChange={(e) => setEditCliente(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-neutral-500 uppercase tracking-wider mb-2 block font-medium">
                  Descripción (opcional)
                </label>
                <textarea
                  placeholder="Detalles del pedido, especificaciones, notas..."
                  rows={3}
                  className="w-full p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-white placeholder:text-neutral-600 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all resize-none"
                  value={editDescripcion}
                  onChange={(e) => setEditDescripcion(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-neutral-500 uppercase tracking-wider mb-2 block font-medium">
                  Fecha de Entrega
                </label>
                <input
                  type="date"
                  className="w-full p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-white focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all [color-scheme:dark]"
                  value={editFecha}
                  onChange={(e) => setEditFecha(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-500 uppercase tracking-wider mb-2 block font-medium">
                    Precio Total
                  </label>
                  <input
                    type="number"
                    placeholder="$0"
                    className="w-full p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-white placeholder:text-neutral-600 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    value={editPrecio}
                    onChange={(e) => setEditPrecio(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500 uppercase tracking-wider mb-2 block font-medium">
                    Abono Actual
                  </label>
                  <input
                    type="number"
                    placeholder="$0"
                    className="w-full p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-white placeholder:text-neutral-600 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all"
                    value={editAbono}
                    onChange={(e) => setEditAbono(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#1a1a1a] flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingPedido(null)
                }}
                className="px-6 py-2.5 text-neutral-400 hover:text-white hover:bg-[#1a1a1a] border border-[#262626] rounded-xl transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={guardarEdicion}
                disabled={!editNombre}
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingPedido && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#111] rounded-2xl w-full max-w-lg border border-[#1a1a1a] shadow-2xl shadow-emerald-500/10">
            <div className="p-6 border-b border-[#1a1a1a] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Package size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{viewingPedido.nombre_pedido}</h2>
                  <p className="text-sm text-neutral-500">{viewingPedido.cliente || "Sin cliente"}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingPedido(null)}
                className="text-neutral-500 hover:text-white transition-colors p-2 hover:bg-[#1a1a1a] rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Estado y Fecha */}
              <div className="flex flex-wrap gap-3">
                <span className={`px-4 py-2 rounded-lg text-sm font-bold ${getStatusStyle(viewingPedido.estado)}`}>
                  {viewingPedido.estado === "Recepcionado"
                    ? "PENDIENTE"
                    : viewingPedido.estado === "En Proceso"
                      ? "EN PROCESO"
                      : "LISTO"}
                </span>
                <span className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-[#0a0a0a] border border-[#1a1a1a] text-neutral-400">
                  <Calendar size={14} className="text-emerald-400" />
                  Entrega: {viewingPedido.fecha_entrega || "Sin fecha"}
                </span>
              </div>

              {/* Descripción */}
              <div>
                <label className="text-xs text-neutral-500 uppercase tracking-wider mb-3 block font-medium">
                  Descripción
                </label>
                <div className="p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl min-h-[100px]">
                  {viewingPedido.descripcion ? (
                    <p className="text-neutral-300 whitespace-pre-wrap">{viewingPedido.descripcion}</p>
                  ) : (
                    <p className="text-neutral-600 italic">Sin descripción agregada</p>
                  )}
                </div>
              </div>

              {/* Información de pago */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-center">
                  <p className="text-xs text-neutral-500 uppercase mb-1">Total</p>
                  <p className="text-xl font-bold text-white">${viewingPedido.precio_total?.toLocaleString() || 0}</p>
                </div>
                <div className="p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-center">
                  <p className="text-xs text-neutral-500 uppercase mb-1">Abonado</p>
                  <p className="text-xl font-bold text-emerald-400">${viewingPedido.abono?.toLocaleString() || 0}</p>
                </div>
                <div className="p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl text-center">
                  <p className="text-xs text-neutral-500 uppercase mb-1">Restante</p>
                  <p className="text-xl font-bold text-red-400">
                    ${((viewingPedido.precio_total || 0) - (viewingPedido.abono || 0)).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#1a1a1a] flex justify-between gap-3">
              <button
                onClick={() => {
                  setViewingPedido(null)
                  setShowDeleteConfirm(viewingPedido.id)
                }}
                className="px-4 py-2.5 text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-xl transition-all font-medium flex items-center gap-2"
              >
                <Trash2 size={16} />
                Eliminar
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setViewingPedido(null)}
                  className="px-6 py-2.5 text-neutral-400 hover:text-white hover:bg-[#1a1a1a] border border-[#262626] rounded-xl transition-all font-medium"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setViewingPedido(null)
                    abrirEdicion(viewingPedido)
                  }}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  <Pencil size={16} />
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#111] rounded-2xl w-full max-w-sm border border-red-500/20 shadow-2xl shadow-red-500/10">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Eliminar Pedido</h2>
              <p className="text-neutral-400 text-sm">
                Esta acción no se puede deshacer. El pedido será eliminado permanentemente.
              </p>
            </div>

            <div className="p-6 border-t border-[#1a1a1a] flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-6 py-2.5 text-neutral-400 hover:text-white hover:bg-[#1a1a1a] border border-[#262626] rounded-xl transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmarBorrado(showDeleteConfirm)}
                className="flex-1 px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-500/20"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  colorClass,
  bgClass,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  colorClass: string
  bgClass: string
}) {
  return (
    <div className="bg-[#111] p-5 rounded-2xl border border-[#1a1a1a] hover:border-[#262626] transition-all group">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center ${colorClass}`}>{icon}</div>
        <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider">{label}</p>
      </div>
      <p className={`text-3xl font-black ${colorClass}`}>{value}</p>
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
        active
          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
          : "bg-[#151515] text-neutral-500 hover:text-white border border-[#1a1a1a] hover:border-[#262626]"
      }`}
    >
      {label}
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-[#1a1a1a] text-neutral-400"}`}
      >
        {count}
      </span>
    </button>
  )
}
