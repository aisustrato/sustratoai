// app/page.tsx
"use client"; // Necesario para usar hooks como useAuth

import { StandardText } from "@/components/ui/StandardText";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { StandardDivider } from "@/components/ui/StandardDivider";
import { HomeCards } from "@/components/HomeCards";
import { useAuth } from "@/app/auth-provider"; // Importar useAuth
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo"; // Para un posible estado de carga

export default function Home() {
  const { proyectoActual, authInitialized, user } = useAuth();

  // Textos por defecto (los que están actualmente hardcodeados)
  const defaultClientName = "Universidad Católica de Chile";
  const defaultProjectName = "Ayudas Técnicas";
  const defaultDepartmentName = "Escuela de Trabajo Social";

  // Mientras la autenticación no se haya inicializado o no haya proyecto actual y el usuario sí esté (evitando flash si es público)
  if (!authInitialized || (user && !proyectoActual)) {
    // Podrías mostrar un loader más completo o un esqueleto de la página.
    // El AuthProvider ya tiene un loader global, pero este es específico para el contenido de la home.
    return (
      <StandardPageBackground variant="gradient">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <SustratoLoadingLogo size={60} text="Cargando información del proyecto..." colorTransition={false} />
        </div>
      </StandardPageBackground>
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
    <StandardPageBackground variant="gradient" >
      {/* Hero Section */}
      <section className="text-center pt-20 pb-8 md:pt-24 md:pb-10">
        <div className="flex flex-col items-center mb-4">
          <StandardText
           
            colorScheme="tertiary"
            colorShade="subtle"
            size="md"
            className="uppercase tracking-wider mb-3 font-bold"
            preset="subtitle"
          >
            {clientName}
          </StandardText>
          <StandardDivider variant="gradient" size="md" className="mb-8" />
        </div>

        <StandardText
        
          preset="heading"
          size="5xl"
          applyGradient="primary"
          className="mb-2"
          
        >
          {projectName}
        </StandardText>

        <StandardText
          asElement="h2"
          preset="subheading"
          size="2xl"
          applyGradient="secondary"
          className="mb-6"
          
        >
          {departmentName}
        </StandardText>

        <StandardText
          preset="subtitle"
          size="xl"
          colorShade="subtle"
          colorScheme="neutral"
          className="max-w-2xl mx-auto"
          
        >
          {projectDescription}
        </StandardText>
      </section>

      {/* Cards Section */}
      <HomeCards />

      {/* Footer Section */}
      <div className="text-center mt-8">
        <StandardText colorShade="subtle"  className="mb-1" >
          {/* Asumiendo que este texto también puede ser dinámico o al menos referenciar los nombres dinámicos */}
          {footerProjectText}
        </StandardText>
      </div>
    </StandardPageBackground>
  );
}