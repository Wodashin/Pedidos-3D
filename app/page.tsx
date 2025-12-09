"use client"
import { useEffect, useState } from "react"
import type React from "react"

import { createClient } from "@supabase/supabase-js"
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
} from "lucide-react"

// --- CONFIGURACIÓN DE SUPABASE ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

const supabase = createClient(supabaseUrl, supabaseKey)

export default function Dashboard() {
  const [pedidos, setPedidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [errorConfig, setErrorConfig] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // Estados para el formulario
  const [nuevoNombre, setNuevoNombre] = useState("")
  const [nuevoCliente, setNuevoCliente] = useState("")
  const [nuevoPrecio, setNuevoPrecio] = useState("")
  const [nuevoAbono, setNuevoAbono] = useState("")

  useEffect(() => {
    if (!supabaseUrl || !supabaseKey) {
      setErrorConfig(true)
      setLoading(false)
      return
    }
    cargarPedidos()
  }, [])

  async function cargarPedidos() {
    setLoading(true)
    const { data, error } = await supabase.from("pedidos").select("*").order("fecha_entrega", { ascending: true })

    if (error) {
      console.error("Error cargando pedidos:", error)
    }

    if (data) setPedidos(data)
    setLoading(false)
  }

  async function agregarPedido() {
    if (!nuevoNombre) return
    const fecha = new Date()
    fecha.setDate(fecha.getDate() + 7)

    const { error } = await supabase.from("pedidos").insert({
      nombre_pedido: nuevoNombre,
      cliente: nuevoCliente,
      precio_total: Number(nuevoPrecio) || 0,
      abono: Number(nuevoAbono) || 0,
      fecha_entrega: fecha.toISOString().split("T")[0],
      estado: "Recepcionado",
    })

    if (error) {
      alert("Error al guardar: " + error.message)
      return
    }

    setShowModal(false)
    cargarPedidos()
    setNuevoNombre("")
    setNuevoCliente("")
    setNuevoPrecio("")
    setNuevoAbono("")
  }

  async function cambiarEstado(id: string, estado: string) {
    await supabase.from("pedidos").update({ estado }).eq("id", id)
    cargarPedidos()
  }

  async function saldarDeuda(id: string, precio: number) {
    await supabase.from("pedidos").update({ abono: precio }).eq("id", id)
    cargarPedidos()
  }

  async function borrarPedido(id: string) {
    if (!confirm("¿Borrar este pedido?")) return
    await supabase.from("pedidos").delete().eq("id", id)
    cargarPedidos()
  }

  // --- CÁLCULOS ---
  const totalVendido = pedidos.reduce((acc, p) => acc + (p.precio_total || 0), 0)
  const totalRecaudado = pedidos.reduce((acc, p) => acc + (p.abono || 0), 0)
  const porCobrar = totalVendido - totalRecaudado

  const pedidosFiltrados = filterStatus === "all" ? pedidos : pedidos.filter((p) => p.estado === filterStatus)

  const getStatusStyle = (estado: string) => {
    switch (estado) {
      case "Listo":
        return "bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
      case "En Proceso":
        return "bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
      default:
        return "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
    }
  }

  if (errorConfig) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a] text-[#ef4444] p-4">
        <div className="bg-[#151515] border border-[#262626] rounded-2xl p-8 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={32} className="text-[#ef4444]" />
            <h1 className="text-2xl font-bold">Error de Configuración</h1>
          </div>
          <p className="text-[#a3a3a3] mb-4">{"No se encontraron las credenciales de Supabase."}</p>
          <p className="text-sm text-[#737373]">
            {"Configura las variables de entorno en Vercel (Settings > Environment Variables)"}
          </p>
          <code className="block mt-4 bg-[#0a0a0a] p-3 rounded-lg text-xs text-[#10b981]">VITE_SUPABASE_URL</code>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="border-b border-[#262626] bg-gradient-to-b from-[#151515] to-[#0a0a0a]/50 backdrop-blur-xl sticky top-0 z-40">
        <header className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <Printer size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-[#a3a3a3] bg-clip-text text-transparent">
                  Taller 3D
                </h1>
                <p className="text-sm text-[#737373]">{"Sistema de Gestión PLA"}</p>
              </div>
            </div>
            <button
              onClick={cargarPedidos}
              className="p-3 hover:bg-[#1a1a1a] rounded-xl transition-all border border-[#262626] hover:border-[#404040] group"
            >
              <RefreshCw
                size={20}
                className={`text-[#a3a3a3] group-hover:text-[#10b981] ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={<TrendingUp size={20} />}
              label="Ventas Totales"
              value={`$${totalVendido.toLocaleString()}`}
              color="from-[#10b981] to-[#059669]"
              glow="rgba(16,185,129,0.2)"
            />
            <MetricCard
              icon={<DollarSign size={20} />}
              label="Recaudado"
              value={`$${totalRecaudado.toLocaleString()}`}
              color="from-[#3b82f6] to-[#2563eb]"
              glow="rgba(59,130,246,0.2)"
            />
            <MetricCard
              icon={<AlertCircle size={20} />}
              label="Por Cobrar"
              value={`$${porCobrar.toLocaleString()}`}
              color="from-[#ef4444] to-[#dc2626]"
              glow="rgba(239,68,68,0.2)"
            />
            <MetricCard
              icon={<Package size={20} />}
              label="Pedidos"
              value={pedidos.length}
              color="from-[#a3a3a3] to-[#737373]"
              glow="rgba(163,163,163,0.2)"
            />
          </div>

          <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
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

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center gap-3 text-[#737373]">
              <RefreshCw size={24} className="animate-spin text-[#10b981]" />
              <span>{"Cargando datos..."}</span>
            </div>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto mb-4 text-[#404040]" />
            <p className="text-[#737373]">{"No hay pedidos en esta categoría"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pedidosFiltrados.map((p) => {
              const deuda = (p.precio_total || 0) - (p.abono || 0)
              const porcentajePagado = p.precio_total > 0 ? (p.abono / p.precio_total) * 100 : 0

              return (
                <div
                  key={p.id}
                  className="bg-[#151515] rounded-2xl border border-[#262626] hover:border-[#404040] p-6 hover:shadow-[0_0_40px_rgba(16,185,129,0.1)] transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${getStatusStyle(p.estado)}`}>
                        {p.estado === "Recepcionado" ? "PENDIENTE" : p.estado === "En Proceso" ? "EN PROCESO" : "LISTO"}
                      </span>
                      <select
                        className="text-xs bg-transparent text-[#737373] hover:text-[#10b981] outline-none cursor-pointer border border-[#262626] rounded-lg px-2 py-1"
                        value={p.estado}
                        onChange={(e) => cambiarEstado(p.id, e.target.value)}
                      >
                        <option value="Recepcionado" className="bg-[#151515]">
                          Pendiente
                        </option>
                        <option value="En Proceso" className="bg-[#151515]">
                          Proceso
                        </option>
                        <option value="Listo" className="bg-[#151515]">
                          Listo
                        </option>
                      </select>
                    </div>

                    <h3 className="font-bold text-lg text-white leading-tight mb-2 group-hover:text-[#10b981] transition-colors">
                      {p.nombre_pedido}
                    </h3>
                    <p className="text-sm text-[#737373] mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                      {p.cliente}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-[#737373] mb-4 bg-[#0a0a0a] rounded-lg p-3 border border-[#262626]">
                      <Clock size={14} className="text-[#10b981]" />
                      <span>
                        {"Entregar:"} {p.fecha_entrega}
                      </span>
                    </div>

                    {p.precio_total > 0 && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-[#737373] mb-2">
                          <span>Progreso de pago</span>
                          <span>{Math.round(porcentajePagado)}%</span>
                        </div>
                        <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden border border-[#262626]">
                          <div
                            className="h-full bg-gradient-to-r from-[#10b981] to-[#059669] transition-all duration-500"
                            style={{ width: `${porcentajePagado}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#262626] pt-4 mt-2">
                    <div className="flex justify-between items-end mb-3">
                      <div>
                        <p className="text-xs text-[#737373] mb-1">Total / Restante</p>
                        <p className="font-bold text-base">
                          <span className="text-white">${p.precio_total}</span>{" "}
                          <span className="text-[#404040]">|</span>{" "}
                          <span className={deuda > 0 ? "text-[#ef4444]" : "text-[#10b981]"}>${deuda}</span>
                        </p>
                      </div>

                      {deuda > 0 ? (
                        <button
                          onClick={() => saldarDeuda(p.id, p.precio_total)}
                          className="bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                        >
                          Cobrar
                        </button>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <CheckCircle size={20} className="text-[#10b981]" />
                          <button
                            onClick={() => borrarPedido(p.id)}
                            className="text-[#737373] hover:text-[#ef4444] transition-colors p-2 hover:bg-[#1a1a1a] rounded-lg"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white p-5 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:shadow-[0_0_60px_rgba(16,185,129,0.6)] transition-all transform hover:scale-105 group z-50"
      >
        <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#151515] rounded-2xl w-full max-w-md border border-[#262626] shadow-[0_0_60px_rgba(16,185,129,0.2)] animate-in zoom-in duration-200">
            <div className="p-6 border-b border-[#262626] flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Nuevo Trabajo</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#737373] hover:text-white transition-colors p-2 hover:bg-[#1a1a1a] rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-[#737373] uppercase tracking-wider mb-2 block">
                  ¿Qué vamos a imprimir?
                </label>
                <input
                  placeholder="Ej: Prototipos, piezas mecánicas..."
                  className="w-full p-3 bg-[#0a0a0a] border border-[#262626] rounded-lg text-white placeholder:text-[#404040] focus:border-[#10b981] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-[#737373] uppercase tracking-wider mb-2 block">Cliente</label>
                <input
                  placeholder="Nombre del cliente"
                  className="w-full p-3 bg-[#0a0a0a] border border-[#262626] rounded-lg text-white placeholder:text-[#404040] focus:border-[#10b981] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all"
                  value={nuevoCliente}
                  onChange={(e) => setNuevoCliente(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#737373] uppercase tracking-wider mb-2 block">Precio Total</label>
                  <input
                    type="number"
                    placeholder="$0"
                    className="w-full p-3 bg-[#0a0a0a] border border-[#262626] rounded-lg text-white placeholder:text-[#404040] focus:border-[#10b981] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all"
                    value={nuevoPrecio}
                    onChange={(e) => setNuevoPrecio(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#737373] uppercase tracking-wider mb-2 block">Abono Inicial</label>
                  <input
                    type="number"
                    placeholder="$0"
                    className="w-full p-3 bg-[#0a0a0a] border border-[#262626] rounded-lg text-white placeholder:text-[#404040] focus:border-[#10b981] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 transition-all"
                    value={nuevoAbono}
                    onChange={(e) => setNuevoAbono(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#262626] flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 text-[#a3a3a3] hover:text-white hover:bg-[#1a1a1a] border border-[#262626] rounded-lg transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={agregarPedido}
                className="px-6 py-2.5 bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white rounded-lg font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                Guardar Pedido
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
  color,
  glow,
}: { icon: React.ReactNode; label: string; value: string | number; color: string; glow: string }) {
  return (
    <div className="bg-[#151515] p-5 rounded-2xl border border-[#262626] hover:border-[#404040] transition-all group relative overflow-hidden">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity`}
      ></div>
      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-[0_0_20px_${glow}]`}
          >
            {icon}
          </div>
          <p className="text-xs text-[#737373] uppercase font-bold tracking-wider">{label}</p>
        </div>
        <p className={`text-3xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</p>
      </div>
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  label,
  count,
}: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
        active
          ? "bg-gradient-to-r from-[#10b981] to-[#059669] text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          : "bg-[#151515] text-[#737373] hover:text-white border border-[#262626] hover:border-[#404040]"
      }`}
    >
      {label} <span className={active ? "opacity-80" : "opacity-50"}>({count})</span>
    </button>
  )
}
