//. 📍 app/datos-maestros/proyecto/page.tsx

import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { ProjectEditForm } from "./components/ProjectEditForm";
import { ProjectPageTitle } from "./components/ProjectPageTitle";
import { getProjectDetails } from "@/lib/actions/project-actions";
import { obtenerProyectosConSettingsUsuario } from "@/lib/actions/project-dashboard-actions";
import { createSupabaseServerClient } from "@/lib/server";
import { StandardText } from "@/components/ui/StandardText";
import { StandardAlert } from "@/components/ui/StandardAlert";
import { AlertCircle } from "lucide-react";

// 📚 DOCUMENTACIÓN 📚
/**
 * @description Página para editar los datos maestros del proyecto.
 * Carga los datos del proyecto activo en el servidor y los pasa al formulario.
 * @returns {Promise<JSX.Element>} La página de edición del proyecto.
 */
export default async function ProjectDataPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Esto debería ser manejado por el middleware, pero sirve como fallback.
    return (
      <StandardPageBackground variant="gradient">
        <div className="container mx-auto py-6 text-center">
          <StandardAlert
            colorScheme="danger"
            message={<div><p className="font-bold">Acceso denegado</p><p>Debes iniciar sesión para ver esta página.</p></div>}
          />
        </div>
      </StandardPageBackground>
    );
  }

  const projectsResult = await obtenerProyectosConSettingsUsuario(user.id);

  if (!projectsResult.success) {
    return (
      <StandardPageBackground variant="gradient">
        <div className="container mx-auto py-6 text-center">
          <StandardAlert
            colorScheme="danger"
            message={<div><p className="font-bold">Error al cargar proyectos</p><p>{projectsResult.error}</p></div>}
          />
        </div>
      </StandardPageBackground>
    );
  }

  const activeProjectSetting = projectsResult.data.find(
    (p) => p.is_active_for_user
  );

  if (!activeProjectSetting) {
    return (
      <StandardPageBackground variant="gradient">
        <div className="container mx-auto py-6 text-center">
           <StandardAlert
            colorScheme="primary"
            message={<div><p className="font-bold">No hay proyecto activo</p><p>Por favor, selecciona un proyecto desde el dashboard para continuar.</p></div>}
          />
        </div>
      </StandardPageBackground>
    );
  }

  const canManageProject = activeProjectSetting.permissions?.can_manage_master_data === true;
  const projectDetailsResult = await getProjectDetails(activeProjectSetting.id);

  const isReadOnly = !canManageProject;

  return (
    <StandardPageBackground variant="gradient">
      <div className="container mx-auto py-6">
        <div className="space-y-6">
                    <ProjectPageTitle
            title="Datos del Proyecto"
            subtitle="Edición de la información principal del proyecto"
            description="Modifica el nombre, descripción y las propuestas que definen el marco de la investigación."
            showBackButton={{ href: "/datos-maestros" }}
            breadcrumbs={[
              { label: "Datos Maestros", href: "/datos-maestros" },
              { label: "Proyecto" },
            ]}
          />
          {projectDetailsResult.success ? (
            <ProjectEditForm 
              initialProjectData={projectDetailsResult.data.project} 
              isReadOnly={isReadOnly}
            />
          ) : (
            <StandardAlert
              colorScheme="danger"
              message={<div><p className="font-bold">Error al cargar el proyecto</p><p>{projectDetailsResult.error}</p></div>}
            />
          )}
        </div>
      </div>
    </StandardPageBackground>
  );
}
