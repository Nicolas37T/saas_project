import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "Características | SaaSManager",
  description:
    "Descubrí todas las características y beneficios de SaaSManager: facturación, inventario, multitenancy y mucho más para hacer crecer tu negocio.",
};

const features = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
      </svg>
    ),
    title: "Facturación inteligente",
    description:
      "Generá facturas profesionales en segundos. Automatizá recordatorios de cobro, enviá por email y controlá el estado de cada factura desde un panel centralizado.",
    badge: "Core",
    color: "blue",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
    title: "Gestión de inventario",
    description:
      "Controlá tu stock en tiempo real. Alertas automáticas de bajo inventario, historial de movimientos y reportes exportables para tomar decisiones con datos.",
    badge: "Core",
    color: "indigo",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
    title: "Gestión de clientes (CRM)",
    description:
      "Centralizá la información de tus clientes: historial de compras, comunicaciones, notas y seguimiento. Nunca más perderás el hilo de una relación comercial.",
    badge: "Pro",
    color: "violet",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
    title: "Subdominio propio",
    description:
      "Cada negocio tiene su propio espacio: `tunegocio.saasmanager.com`. Multitenancy real con aislamiento de datos total. Tu marca, tu identidad, tus clientes.",
    badge: "Pro",
    color: "sky",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    title: "Reportes y analytics",
    description:
      "Dashboards visuales con métricas clave: ventas, ingresos, productos más vendidos y tendencias. Exportá en PDF o CSV para compartir con tu equipo o contador.",
    badge: "Pro",
    color: "emerald",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
    title: "Seguridad y permisos",
    description:
      "Control de acceso por roles: admin, operador, solo lectura. Autenticación segura con JWT, logs de actividad y encriptación de datos sensibles en reposo.",
    badge: "Core",
    color: "amber",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-3 3h3M7.5 12h.008v.008H7.5V12Zm0 3h.008v.008H7.5V15Zm0 3h.008v.008H7.5V18Z" />
      </svg>
    ),
    title: "App 100% responsive",
    description:
      "Diseñada mobile-first. Usá la plataforma desde tu celular, tablet o escritorio sin perder ninguna funcionalidad. Tu negocio no para, tu herramienta tampoco.",
    badge: "Core",
    color: "rose",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
    ),
    title: "Soporte en tiempo real",
    description:
      "Chat en vivo con el equipo de soporte, base de conocimiento actualizada y tutoriales en video. En el plan Pro: soporte prioritario 24/7 con respuesta garantizada.",
    badge: "Pro",
    color: "cyan",
  },
];

const stats = [
  { value: "99.9%", label: "Uptime garantizado" },
  { value: "+500", label: "Negocios activos" },
  { value: "< 2s", label: "Tiempo de carga" },
  { value: "24/7", label: "Soporte Pro" },
];

const badgeColors: Record<string, string> = {
  Core: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Pro: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

const iconColors: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  cyan: "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
};

export default function CaracteristicasPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-background">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center bg-white border-b sticky top-0 z-50 dark:bg-slate-950 dark:border-slate-800">
        <Link href="/" className="flex items-center justify-center">
          <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
            SaaSManager
          </span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link href="/caracteristicas" className="text-sm font-medium text-blue-600 dark:text-blue-400 underline underline-offset-4">
            Características
          </Link>
          <Link href="/#pricing" className="text-sm font-medium hover:underline underline-offset-4">
            Precios
          </Link>
          <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4">
            Iniciar sesión
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero de la página */}
        <section className="w-full py-16 md:py-24 bg-white dark:bg-background border-b dark:border-slate-800">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 mb-4 uppercase tracking-widest">
              Todo lo que necesitás
            </span>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl mb-6">
              Características que{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                impulsan tu negocio
              </span>
            </h1>
            <p className="mx-auto max-w-[720px] text-gray-500 md:text-xl dark:text-gray-400 mb-8">
              SaaSManager no es solo software — es la infraestructura completa que necesita tu negocio para operar de
              forma profesional desde el día uno. Sin fricción, sin complicaciones.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90 w-full sm:w-auto">
                  Empezar gratis
                </Button>
              </Link>
              <Link href="/#pricing">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Ver planes y precios
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats banner */}
        <section className="w-full py-10 bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-1">
                  <span className="text-3xl md:text-4xl font-bold tracking-tight">{stat.value}</span>
                  <span className="text-sm text-blue-100 font-medium">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Grid de características */}
        <section className="w-full py-16 md:py-24 dark:bg-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">
                Todo incluido, sin sorpresas
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-[600px] mx-auto">
                Cada característica fue pensada para resolver un problema real de los pequeños negocios. Sin funciones
                de relleno, sin curva de aprendizaje innecesaria.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group relative bg-white dark:bg-card rounded-2xl p-6 border border-slate-100 dark:border-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Badge */}
                  <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full mb-4 ${badgeColors[feature.badge]}`}>
                    {feature.badge}
                  </span>

                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${iconColors[feature.color]}`}>
                    {feature.icon}
                  </div>

                  {/* Content */}
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Leyenda de badges */}
            <div className="flex flex-wrap gap-4 justify-center mt-10 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${badgeColors["Core"]}`}>Core</span>
                <span>Disponible en todos los planes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${badgeColors["Pro"]}`}>Pro</span>
                <span>Exclusivo del Plan Pro</span>
              </div>
            </div>
          </div>
        </section>

        {/* Comparación rápida */}
        <section className="w-full py-16 md:py-20 bg-white dark:bg-slate-950 border-t dark:border-slate-800">
          <div className="container px-4 md:px-6 mx-auto max-w-3xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-3">
                ¿Por qué SaaSManager?
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                La diferencia está en los detalles y en las cosas que otros no te cuentan.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: "Setup en menos de 5 minutos",
                  detail: "Sin instalaciones, sin configuraciones complejas. Registrarte y empezar a facturar toma menos tiempo que preparar un café.",
                },
                {
                  title: "Datos 100% tuyos",
                  detail: "Tu información nunca se mezcla con la de otros negocios. Podés exportar todo en cualquier momento, sin lock-in.",
                },
                {
                  title: "Actualizaciones automáticas",
                  detail: "Siempre usás la última versión. Sin actualizaciones manuales, sin interrupciones. Nosotros nos encargamos de todo.",
                },
                {
                  title: "Sin costos ocultos",
                  detail: "El precio que ves es el que pagás. Sin comisiones por transacción, sin límites arbitrarios de uso dentro de tu plan.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex gap-4 p-5 rounded-xl border border-slate-100 dark:border-border bg-slate-50 dark:bg-card hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="w-full py-16 md:py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 dark:from-blue-900 dark:via-blue-800 dark:to-indigo-900">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white mb-4">
              Listo para empezar?
            </h2>
            <p className="text-blue-100 md:text-xl max-w-[600px] mx-auto mb-8">
              Probá SaaSManager gratis por 14 días. Sin tarjeta de crédito. Sin compromisos. Solo resultados.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-white text-blue-700 hover:bg-blue-50 font-semibold w-full sm:w-auto"
                >
                  Comenzar gratis ahora
                </Button>
              </Link>
              <Link href="/#pricing">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white/10 w-full sm:w-auto"
                >
                  Ver planes
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 bg-white border-t dark:bg-background dark:border-border">
        <div className="container px-4 md:px-6 mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 SaaSManager Inc. Todos los derechos reservados.</p>
          <nav className="flex gap-4 sm:gap-6">
            <Link href="#" className="text-xs text-gray-500 dark:text-gray-400 hover:underline underline-offset-4">
              Términos de servicio
            </Link>
            <Link href="#" className="text-xs text-gray-500 dark:text-gray-400 hover:underline underline-offset-4">
              Privacidad
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
