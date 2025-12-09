"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { RefreshCw, Plus, Trash2, CheckCircle, Clock } from "lucide-react";

// --- CONFIGURACIÓN SEGURA ---
// Next.js buscará estas variables en Vercel o en tu archivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validación simple para evitar errores si faltan las variables
const supabase = createClient(
  supabaseUrl || "", 
  supabaseKey || ""
);

export default function Dashboard() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [errorConfig, setErrorConfig] = useState(false);

  // Estados para el formulario
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoCliente, setNuevoCliente] = useState("");
  const [nuevoPrecio, setNuevoPrecio] = useState("");
  const [nuevoAbono, setNuevoAbono] = useState("");

  useEffect(() => {
    // Verificar si las variables de entorno están cargadas
    if (!supabaseUrl || !supabaseKey) {
      setErrorConfig(true);
      setLoading(false);
      return;
    }
    cargarPedidos();
  }, []);

  async function cargarPedidos() {
    setLoading(true);
    const { data } = await supabase
      .from('pedidos')
      .select('*')
      .order('fecha_entrega', { ascending: true });
    
    if (data) setPedidos(data);
    setLoading(false);
  }

  // --- LÓGICA DE NEGOCIO ---
  async function agregarPedido() {
    if (!nuevoNombre) return;
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 7); 

    await supabase.from('pedidos').insert({
      nombre_pedido: nuevoNombre,
      cliente: nuevoCliente,
      precio_total: Number(nuevoPrecio) || 0,
      abono: Number(nuevoAbono) || 0,
      fecha_entrega: fecha.toISOString().split('T')[0],
      estado: 'Recepcionado'
    });
    setShowModal(false);
    cargarPedidos();
    setNuevoNombre(""); setNuevoCliente(""); setNuevoPrecio(""); setNuevoAbono("");
  }

  async function cambiarEstado(id: string, estado: string) {
    await supabase.from('pedidos').update({ estado }).eq('id', id);
    cargarPedidos();
  }

  async function saldarDeuda(id: string, precio: number) {
    await supabase.from('pedidos').update({ abono: precio }).eq('id', id);
    cargarPedidos();
  }

  async function borrarPedido(id: string) {
    if(!confirm("¿Borrar este pedido?")) return;
    await supabase.from('pedidos').delete().eq('id', id);
    cargarPedidos();
  }

  // --- CÁLCULOS ---
  const totalVendido = pedidos.reduce((acc, p) => acc + (p.precio_total || 0), 0);
  const totalRecaudado = pedidos.reduce((acc, p) => acc + (p.abono || 0), 0);

  // --- UI HELPERS ---
  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case 'Listo': return 'bg-green-100 text-green-800 border-green-200';
      case 'En Proceso': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (errorConfig) {
    return (
      <div className="h-screen flex items-center justify-center bg-red-50 text-red-800 p-4 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">⚠️ Falta Configuración</h1>
          <p>No se encontraron las credenciales de Supabase.</p>
          <p className="text-sm mt-4">Asegúrate de configurar las variables de entorno en Vercel o en .env.local</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
      
      {/* HEADER & MÉTRICAS */}
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-indigo-900 flex items-center gap-2">
             🏭 Taller 3D <span className="text-sm font-normal text-gray-500 bg-gray-200 px-2 py-1 rounded-full">Admin</span>
          </h1>
          <button onClick={cargarPedidos} className="p-2 hover:bg-gray-200 rounded-full transition">
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Ventas Totales" value={`$${totalVendido}`} color="text-indigo-600" />
          <MetricCard label="Recaudado" value={`$${totalRecaudado}`} color="text-green-600" />
          <MetricCard label="Por Cobrar" value={`$${totalVendido - totalRecaudado}`} color="text-red-500" />
          <MetricCard label="Pedidos Activos" value={pedidos.length} color="text-gray-600" />
        </div>
      </header>

      {/* GRILLA DE PEDIDOS */}
      <main className="max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Cargando datos...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pedidos.map((p) => {
              const deuda = (p.precio_total || 0) - (p.abono || 0);
              return (
                <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition duration-200 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getBadgeColor(p.estado)}`}>
                        {p.estado.toUpperCase()}
                      </span>
                      <select 
                        className="text-xs border-none bg-transparent text-right outline-none cursor-pointer text-gray-400 hover:text-indigo-600"
                        value={p.estado}
                        onChange={(e) => cambiarEstado(p.id, e.target.value)}
                      >
                        <option value="Recepcionado">Pendiente</option>
                        <option value="En Proceso">Proceso</option>
                        <option value="Listo">Listo</option>
                      </select>
                    </div>
                    
                    <h3 className="font-bold text-lg text-gray-800 leading-tight mb-1">{p.nombre_pedido}</h3>
                    <p className="text-sm text-gray-500 mb-4">{p.cliente}</p>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                      <Clock size={14} />
                      <span>Entregar: {p.fecha_entrega}</span>
                    </div>
                  </div>

                  <div className="border-t pt-3 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-400">Total / Falta</p>
                      <p className="font-bold text-sm">
                        ${p.precio_total} <span className="text-gray-300">|</span> <span className={deuda > 0 ? "text-red-500" : "text-green-500"}>${deuda}</span>
                      </p>
                    </div>

                    {deuda > 0 ? (
                      <button onClick={() => saldarDeuda(p.id, p.precio_total)} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1 rounded-lg text-xs font-semibold transition">
                        Cobrar
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <CheckCircle size={20} className="text-green-500" />
                        <button onClick={() => borrarPedido(p.id)} className="text-gray-300 hover:text-red-500 transition">
                           <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <button onClick={() => setShowModal(true)} className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg transition transform hover:scale-105">
        <Plus size={28} />
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Nuevo Trabajo</h2>
            <input placeholder="¿Qué vamos a imprimir?" className="w-full mb-3 p-3 border rounded-lg bg-gray-50 text-black" value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} />
            <input placeholder="Nombre Cliente" className="w-full mb-3 p-3 border rounded-lg bg-gray-50 text-black" value={nuevoCliente} onChange={e => setNuevoCliente(e.target.value)} />
            <div className="flex gap-3 mb-6">
              <input type="number" placeholder="Precio Total" className="w-full p-3 border rounded-lg bg-gray-50 text-black" value={nuevoPrecio} onChange={e => setNuevoPrecio(e.target.value)} />
              <input type="number" placeholder="Abono" className="w-full p-3 border rounded-lg bg-gray-50 text-black" value={nuevoAbono} onChange={e => setNuevoAbono(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={agregarPedido} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string, value: string | number, color: string }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
      <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}