// app/page.tsx
"use client"; // Necesario para usar hooks como useAuth

import { StandardText } from "@/components/ui/StandardText";
import { PageBackground } from "@/components/ui/page-background";
import { Divider } from "@/components/ui/divider";
import { HomeCards } from "@/components/HomeCards";
import { useAuth } from "@/app/auth-provider"; // Importar useAuth
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo"; // Para un posible estado de carga

export default function Home() {
  const { proyectoActual, authInitialized, user } = useAuth();

  // Textos por defecto (los que están actualmente hardcodeados)
  const defaultClientName = "Universidad Católica de Chile";
  const defaultProjectName = "Ayudas Técnicas";
  const defaultDepartmentName = "Escuela de Trabajo Social";
  const defaultProjectDescription = "Plataforma de herramientas para investigación y análisis de datos cualitativos";

  // Mientras la autenticación no se haya inicializado o no haya proyecto actual y el usuario sí esté (evitando flash si es público)
  if (!authInitialized || (user && !proyectoActual)) {
    // Podrías mostrar un loader más completo o un esqueleto de la página.
    // El AuthProvider ya tiene un loader global, pero este es específico para el contenido de la home.
    return (
      <PageBackground variant="gradient">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <SustratoLoadingLogo size={60} text="Cargando información del proyecto..." />
        </div>
      </PageBackground>
    );
  }

  // Si no hay usuario y la página es pública (o si auth no está inicializado),
  // es posible que queramos mostrar los datos por defecto.
  // Si hay usuario, esperamos que proyectoActual tenga datos.
  const clientName = proyectoActual?.institution_name || defaultClientName;
  const projectName = proyectoActual?.name
  || defaultProjectName;
  const departmentName = proyectoActual?.description|| defaultDepartmentName;
  const projectDescription =  "Plataforma de herramientas para investigación y análisis de datos cualitativos" ;
  // Para el footer, si es específico del cliente también se podría obtener de proyectoActual
  const footerProjectText = `Proyecto desarrollado por ${departmentName} de ${clientName}`;


  return (
    <PageBackground variant="gradient" >
      {/* Hero Section */}
      <section className="text-center pt-20 pb-8 md:pt-24 md:pb-10">
        <div className="flex flex-col items-center mb-4">
          <StandardText
            variant="label"
            colorScheme="primary"
            colorShade="pure"
            className="uppercase tracking-wider mb-3 font-bold"
            fontType="heading"
          >
            {clientName}
          </StandardText>
          <Divider variant="gradient" size="md" className="mb-8" />
        </div>

        <StandardText
          asElement="h1"
          variant="heading"
          size="5xl"
          applyGradient="primary"
          className="mb-2"
          fontType="heading"
        >
          {projectName}
        </StandardText>

        <StandardText
          asElement="h2"
          variant="subheading"
          size="3xl"
          applyGradient="secondary"
          className="mb-6"
          fontType="heading"
        >
          {departmentName}
        </StandardText>

        <StandardText
          variant="subtitle"
          size="xl"
          colorScheme="neutral"
          className="max-w-2xl mx-auto"
          fontType="body"
        >
          {projectDescription}
        </StandardText>
      </section>

      {/* Cards Section */}
      <HomeCards />

      {/* Footer Section */}
      <div className="text-center mt-8">
        <StandardText variant="muted" className="mb-1" fontType="body">
          {/* Asumiendo que este texto también puede ser dinámico o al menos referenciar los nombres dinámicos */}
          {footerProjectText}
        </StandardText>
      </div>
    </PageBackground>
  );
}