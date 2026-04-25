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
      next: { revalidate: 60 },
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

            {plans.length === 0 ? (
              <p className="text-muted-foreground">No hay planes disponibles en este momento.</p>
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-6xl mx-auto items-stretch ${plans.length >= 3 ? "lg:grid-cols-3" : ""} ${plans.length >= 4 ? "lg:grid-cols-4" : ""}`}>
                {plans.map((plan) => {
                  const isPopular = plan.price === maxPrice;
                  const isFreePlan = plan.price === 0;
                  return (
                    <Card
                      key={plan.id}
                      className={`relative flex flex-col ${isPopular ? "border-blue-500 shadow-xl scale-105" : ""} dark:bg-card dark:border-border`}
                    >
                      {isPopular && (
                        <Badge className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-blue-600">
                          Más Popular
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
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Link href="/register" className="w-full">
                          <Button
                            className={`w-full ${isPopular ? "bg-blue-600 hover:bg-blue-700 dark:bg-primary dark:hover:bg-primary/90" : ""}`}
                            variant={isPopular ? "default" : "outline"}
                          >
                            {isFreePlan ? "Comenzar gratis" : "Empezar ahora"}
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
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
