import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  const plans = [
    {
      name: "Plan Gratuito",
      price: "$0",
      cycle: "/mes",
      description: "Para empezar sin riesgo",
      features: [
        "Hasta 3 usuarios",
        "Gestión básica de productos",
        "Soporte por email",
      ],
      cta: "Comenzar gratis",
      popular: false,
      highlight: false,
    },
    {
      name: "Plan Básico",
      price: "$10",
      cycle: "/mes",
      description: "Para negocios en crecimiento",
      features: [
        "Hasta 5 usuarios",
        "Gestión de productos",
        "Reportes básicos",
        "Soporte por email",
      ],
      cta: "Empezar ahora",
      popular: false,
      highlight: false,
    },
    {
      name: "Plan Pro",
      price: "$20",
      cycle: "/mes",
      description: "El favorito de los equipos",
      features: [
        "Hasta 20 usuarios",
        "Gestión de inventario",
        "Reportes y analytics",
        "Soporte prioritario 24/7",
        "Personalización de marca",
      ],
      cta: "Probar el Pro",
      popular: true,
      highlight: true,
    },
    {
      name: "Plan Enterprise",
      price: "$50",
      cycle: "/mes",
      description: "Para operaciones a gran escala",
      features: [
        "Hasta 100 usuarios",
        "Todo el Plan Pro incluido",
        "Gestor de cuenta dedicado",
        "SLA garantizado 99.9%",
        "Integraciones personalizadas",
      ],
      cta: "Contactar ventas",
      popular: false,
      highlight: false,
    },
  ];

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
          <Link href="/caracteristicas" className="text-sm font-medium hover:underline underline-offset-4">
            Características
          </Link>
          <Link href="#pricing" className="text-sm font-medium hover:underline underline-offset-4">
            Precios
          </Link>
          <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4">
            Iniciar sesión
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-white dark:bg-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Gestiona tu negocio como un <span className="text-blue-600 dark:text-blue-400">profesional</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  La plataforma más sencilla y potente para pequeños negocios. Facturación, inventario y más bajo tu propio subdominio.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/register">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90">Comenzar Gratis</Button>
                </Link>
                <Link href="/caracteristicas">
                  <Button variant="outline" size="lg">Saber más</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 dark:bg-background">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl mb-12">Planes que crecen contigo</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto items-stretch">
              {plans.map((plan) => (
                <Card key={plan.name} className={`relative flex flex-col ${plan.popular ? 'border-blue-500 shadow-xl scale-105' : ''} dark:bg-card dark:border-border`}>
                  {plan.popular && (
                    <Badge className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-blue-600">
                      Más Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription className="text-sm">{plan.description}</CardDescription>
                    <div className="mt-4 flex items-baseline justify-center">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="ml-1 text-gray-500 dark:text-gray-400">{plan.cycle}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3 mt-4 text-left">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center">
                          <svg
                            className="mr-2 h-4 w-4 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link href="/register" className="w-full">
                      <Button className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90' : ''}`} variant={plan.popular ? 'default' : 'outline'}>
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
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
