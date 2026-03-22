"use client"
import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

const TIPOS_NEGOCIO = [
  { value: "impresion3d",  emoji: "🖨️", label: "Impresión 3D",     desc: "Piezas, prototipos, figuras" },
  { value: "fofuchas",     emoji: "🎀", label: "Fofuchas",          desc: "Muñecas y personajes en goma" },
  { value: "amigurumis",   emoji: "🧶", label: "Amigurumis",        desc: "Tejidos a crochet" },
  { value: "reposteria",   emoji: "🎂", label: "Repostería",        desc: "Tortas, galletas, cupcakes" },
  { value: "joyeria",      emoji: "💍", label: "Joyería",           desc: "Accesorios y bijoutería" },
  { value: "bordados",     emoji: "🧵", label: "Bordados",          desc: "Bordados y costura" },
  { value: "velas",        emoji: "🕯️", label: "Velas y jabones",  desc: "Productos artesanales" },
  { value: "otro",         emoji: "✨", label: "Otro emprendimiento", desc: "Cualquier tipo de pedido" },
]

export default function OnboardingPage() {
  const [nombre, setNombre] = useState("")
  const [tipo, setTipo] = useState("")
  const [moneda, setMoneda] = useState("CLP")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tipo) { setError("Selecciona el tipo de negocio"); return }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/auth/login"); return }

    const { error } = await supabase.from("negocios").insert({
      user_id: user.id,
      nombre: nombre || "Mi negocio",
      tipo_negocio: tipo,
      moneda,
    })

    if (error) {
      setError("Error al guardar. Intenta de nuevo.")
      setLoading(false)
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-lg mx-auto">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">¡Casi lista! 🎉</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Cuéntanos un poco sobre tu negocio para personalizar la app
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Nombre del negocio */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <label className="text-sm font-medium text-foreground block mb-2">
              ¿Cómo se llama tu negocio?
            </label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Taller de Cami, Creaciones Sofía..."
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
            />
          </div>

          {/* Tipo de negocio */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <label className="text-sm font-medium text-foreground block mb-3">
              ¿Qué tipo de emprendimiento tienes?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS_NEGOCIO.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTipo(t.value)}
                  className={`flex flex-col items-start gap-0.5 p-3 rounded-xl border text-left transition ${
                    tipo === t.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-secondary text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <span className="text-xl">{t.emoji}</span>
                  <span className="text-xs font-medium text-foreground">{t.label}</span>
                  <span className="text-xs text-muted-foreground">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Moneda */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <label className="text-sm font-medium text-foreground block mb-2">
              Moneda que usas
            </label>
            <select
              value={moneda}
              onChange={e => setMoneda(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
            >
              <option value="CLP">🇨🇱 Peso chileno (CLP)</option>
              <option value="ARS">🇦🇷 Peso argentino (ARS)</option>
              <option value="MXN">🇲🇽 Peso mexicano (MXN)</option>
              <option value="COP">🇨🇴 Peso colombiano (COP)</option>
              <option value="USD">🇺🇸 Dólar (USD)</option>
              <option value="EUR">🇪🇺 Euro (EUR)</option>
            </select>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-medium rounded-xl py-3 text-sm transition flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Guardando..." : "¡Empezar a gestionar pedidos! →"}
          </button>
        </form>
      </div>
    </div>
  )
}
