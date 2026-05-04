import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LandingHeader } from "@/components/LandingHeader";
import { Plan } from "@/lib/api";

async function getPlans(): Promise<Plan[]> {
  // En el servidor no existe window.location. Resolvemos la URL según el entorno:
  // - NEXT_PUBLIC_API_URL si está definido (override explícito)
  // - localhost:8000 en desarrollo
  // - Railway en producción
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://saasproject-production-0c1a.up.railway.app"
      : "http://localhost:8000");
  try {
    const res = await fetch(`${baseUrl}/plans`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function getBillingLabel(cycle: string): string {
  if (cycle === "monthly") return "/mes";
  if (cycle === "yearly") return "/año";
  return `/${cycle}`;
}

const features = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
    title: "Equipo organizado",
    description: "Agregá doctores, recepcionistas y administradores a tu consultorio. Cada uno ve solo lo que necesita, sin confusiones ni accesos de más.",
    color: "blue",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    title: "Ficha de pacientes",
    description: "Toda la información de tus pacientes en un solo lugar: datos personales, historial clínico, alergias, radiografías y notas importantes.",
    color: "indigo",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
      </svg>
    ),
    title: "Planes de tratamiento",
    description: "Armá planes de tratamiento paso a paso para cada paciente. Marcá lo que ya se hizo, lo pendiente y llevá un control claro de cada proceso.",
    color: "violet",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
      </svg>
    ),
    title: "Agenda de citas",
    description: "Visualizá tu agenda del día, semana o mes de un vistazo. Agendá citas rápido, evitá solapamientos y que ningún paciente se te pase por alto.",
    color: "sky",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
      </svg>
    ),
    title: "Control de pagos",
    description: "Registrá pagos parciales o totales, llevá el saldo de cada paciente y sabé exactamente quién debe cuánto. Sin planillas ni cuadernos.",
    color: "emerald",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    title: "Reportes del consultorio",
    description: "Mirá de un vistazo cuántas citas tuviste, cuánto facturaste y qué tratamientos son los más frecuentes. Información clara para tomar mejores decisiones.",
    color: "amber",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    title: "Datos protegidos",
    description: "La información de tus pacientes es confidencial y así se trata. Cada consultorio tiene su espacio privado, separado del resto.",
    color: "rose",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
    title: "Desde cualquier dispositivo",
    description: "Accedé al sistema desde tu computadora, tablet o celular. Consultá la agenda, revisá fichas o registrá pagos estés donde estés.",
    color: "cyan",
  },
];

const stats = [
  { value: "99.9%", label: "Disponibilidad" },
  { value: "+500", label: "Consultorios activos" },
  { value: "< 2s", label: "Velocidad de carga" },
  { value: "24/7", label: "Soporte disponible" },
];

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

export default async function LandingPage() {
  const plans = await getPlans();

  // Determinamos cuál es el plan "popular": el de mayor precio
  const maxPrice = plans.length > 0 ? Math.max(...plans.map((p) => p.price)) : -1;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-background">
      {/* Header */}
      <LandingHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-16 md:py-24 lg:py-32 overflow-hidden bg-slate-50 dark:bg-background">
          {/* Background decorative elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-blue-100/50 to-transparent dark:from-blue-900/20 -z-10 rounded-b-[100%] blur-3xl"></div>
          
          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <div className="flex flex-col items-center space-y-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold border border-blue-200 dark:border-blue-800/50 shadow-sm backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
                El software dental preferido por especialistas
              </div>

              {/* Titulo */}
              <div className="space-y-4 max-w-4xl">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                  Moderniza tu clínica y <br className="hidden md:block"/> atiende como un <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">profesional</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl dark:text-gray-300 leading-relaxed font-medium mt-6">
                  Lleva la gestión de pacientes, historiales médicos, odontogramas y cobros desde un solo lugar. Simple, seguro y desde cualquier dispositivo.
                </p>
              </div>

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-8">
                <Button asChild size="lg" className="h-14 px-8 text-base bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90 shadow-xl shadow-blue-500/20 transition-all hover:scale-105 rounded-xl">
                  <Link href="/register">Comenzar prueba gratis</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 px-8 text-base bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl shadow-sm">
                  <Link href="/#features">Ver características</Link>
                </Button>
              </div>

              {/* Social Proof */}
              <div className="pt-10 flex flex-col items-center gap-4">
                <div className="flex -space-x-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-slate-50 dark:border-background bg-slate-200 overflow-hidden shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Doctor" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                  <div className="flex text-yellow-400">
                    {Array.from({length: 5}).map((_,i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                      </svg>
                    ))}
                  </div>
                  <span>Más de <strong>500 especialistas</strong> confían en nosotros.</span>
                </div>
              </div>

              {/* CSS UI Mockup */}
              <div className="mt-20 w-full max-w-5xl mx-auto rounded-t-2xl border border-slate-200 dark:border-slate-800 shadow-[0_0_50px_rgba(37,_99,_235,_0.1)] dark:shadow-[0_0_50px_rgba(0,_0,_0,_0.5)] overflow-hidden bg-white dark:bg-slate-950 relative">
                <div className="h-12 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-400/90"></div>
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-400/90"></div>
                  <div className="w-3.5 h-3.5 rounded-full bg-green-400/90"></div>
                </div>
                <div className="p-4 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 relative h-[300px] overflow-hidden">
                  {/* Gradient Fade overlay to cut off the bottom smoothly */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent dark:from-slate-950 dark:via-slate-950/40 z-10 pointer-events-none"></div>
                  
                  <div className="col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="h-8 w-1/3 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                      <div className="h-8 w-24 bg-blue-100 dark:bg-blue-900/30 rounded-lg"></div>
                    </div>
                    <div className="h-48 w-full bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-end p-6 gap-3">
                       <div className="w-full h-[40%] bg-blue-500 rounded-t-md opacity-80"></div>
                       <div className="w-full h-[60%] bg-blue-500 rounded-t-md opacity-90"></div>
                       <div className="w-full h-[45%] bg-blue-500 rounded-t-md opacity-80"></div>
                       <div className="w-full h-[80%] bg-blue-500 rounded-t-md opacity-100"></div>
                       <div className="w-full h-[100%] bg-blue-500 rounded-t-md opacity-100"></div>
                       <div className="w-full h-[70%] bg-blue-500 rounded-t-md opacity-90"></div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="h-28 w-full bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-4 flex flex-col justify-between">
                      <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      <div className="h-8 w-3/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    </div>
                    <div className="h-28 w-full bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-4 flex flex-col justify-between">
                      <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      <div className="h-8 w-2/3 bg-emerald-100 dark:bg-emerald-900/30 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Stats */}
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

        {/* Features grid */}
        <section id="features" className="w-full py-16 md:py-24 dark:bg-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">
                Herramientas pensadas para dentistas
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-[600px] mx-auto">
                Cada función fue diseñada para resolver los problemas del día a día
                en un consultorio dental. Sin complicaciones, sin curva de aprendizaje.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group relative bg-white dark:bg-card rounded-2xl p-6 border border-slate-100 dark:border-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
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
          </div>
        </section>

        {/* Why us */}
        <section className="w-full py-16 md:py-20 bg-white dark:bg-slate-950 border-t dark:border-slate-800">
          <div className="container px-4 md:px-6 mx-auto max-w-3xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-3">
                ¿Por qué elegirnos?
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Hay cosas que hacen la diferencia cuando elegís una herramienta para tu consultorio.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: "Listo en menos de 5 minutos",
                  detail: "No necesitás instalar nada. Te registrás, configurás tu consultorio y ya estás trabajando. Más rápido que hacer un café.",
                },
                {
                  title: "Pensado por y para consultorios",
                  detail: "No es un sistema genérico adaptado. Cada pantalla, cada botón y cada flujo está diseñado para cómo realmente funciona un consultorio dental.",
                },
                {
                  title: "Tus datos son tuyos",
                  detail: "La información de tus pacientes nunca se mezcla con la de otros consultorios. Podés exportarla cuando quieras, sin vueltas.",
                },
                {
                  title: "Sin costos escondidos",
                  detail: "El precio que ves es lo que pagás. Sin comisiones extra, sin límites sorpresa. Transparencia total.",
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

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 dark:bg-background">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl mb-12">Planes que crecen contigo</h2>

            {plans.length === 0 ? (
              <p className="text-muted-foreground">No hay planes disponibles en este momento.</p>
            ) : (
              <div suppressHydrationWarning className={`grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-6xl mx-auto items-stretch ${plans.length >= 3 ? "lg:grid-cols-3" : ""} ${plans.length >= 4 ? "lg:grid-cols-4" : ""}`}>
                {plans.map((plan) => {
                  const isPopular = plan.price === 100;
                  const isFreePlan = plan.price === 0;
                  return (
                    <Card
                      key={plan.id}
                      className={`relative flex flex-col transition-all duration-300 rounded-2xl ${isPopular ? "border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.2)] dark:shadow-[0_0_40px_rgba(59,130,246,0.1)] scale-105 z-10 ring-1 ring-blue-500 bg-white dark:bg-slate-900" : "border-slate-200 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-lg bg-slate-50 dark:bg-card"} dark:border-border`}
                    >
                      {isPopular && (
                        <Badge className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-none shadow-md px-4 py-1 text-xs uppercase tracking-wider font-bold">
                          Recomendado
                        </Badge>
                      )}
                      <CardHeader>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <CardDescription className="text-sm">
                          Hasta {plan.max_users} usuario{plan.max_users !== 1 ? "s" : ""}
                        </CardDescription>
                        <div className="mt-4 flex items-baseline justify-center">
                          <span className="text-lg font-semibold text-gray-500 dark:text-gray-400 mr-1">Bs.</span>
                          <span className="text-4xl font-bold">{plan.price}</span>
                          <span className="ml-1 text-gray-500 dark:text-gray-400">{getBillingLabel(plan.billing_cycle)}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <ul className="space-y-3 mt-4 text-left">
                          <li className="flex items-center">
                            <svg className="mr-2 h-4 w-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Hasta {plan.max_users} usuario{plan.max_users !== 1 ? "s" : ""}
                          </li>
                          <li className="flex items-center">
                            <svg className="mr-2 h-4 w-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Agenda de citas y pacientes
                          </li>
                          <li className="flex items-center">
                            <svg className="mr-2 h-4 w-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Control de pagos y saldos
                          </li>
                          {!isFreePlan && (
                            <li className="flex items-center">
                              <svg className="mr-2 h-4 w-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              Soporte prioritario
                            </li>
                          )}
                          {isPopular && (
                            <li className="flex items-center">
                              <svg className="mr-2 h-4 w-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              Reportes y analytics
                            </li>
                          )}
                          {isFreePlan && (
                            <li className="flex items-center">
                              <svg className="mr-2 h-4 w-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              Prueba por 5 dias 
                            </li>
                          )}
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button
                          asChild
                          className={`w-full ${isPopular ? "bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90" : ""}`}
                          variant={isPopular ? "default" : "outline"}
                        >
                          <Link href="/register" className="w-full">
                            {isFreePlan ? "Comenzar gratis" : "Empezar ahora"}
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 md:py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 dark:from-blue-900 dark:via-blue-800 dark:to-indigo-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="container px-4 md:px-6 mx-auto text-center relative z-10">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-white mb-6">
              ¿Listo para modernizar tu clínica?
            </h2>
            <p className="text-blue-100 md:text-xl max-w-[600px] mx-auto mb-10 leading-relaxed">
              Empieza a organizar tus pacientes y optimizar tu tiempo hoy mismo. Sin tarjeta de crédito, sin compromisos. Solo resultados.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="h-14 px-8 text-base bg-white text-blue-700 hover:bg-blue-50 font-bold w-full sm:w-auto shadow-xl rounded-xl hover:scale-105 transition-transform"
              >
                <Link href="/register">Comenzar gratis ahora</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-14 px-8 text-base bg-transparent border-white/50 text-white hover:bg-white/10 hover:text-white w-full sm:w-auto rounded-xl backdrop-blur-sm"
              >
                <Link href="/#pricing">Ver planes</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 bg-white border-t dark:bg-background dark:border-border">
        <div className="container px-4 md:px-6 mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">© 2026 TRZ Corp. Dental. Todos los derechos reservados.</p>
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
