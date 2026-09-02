//. 📍 app/datos-maestros/proyecto/page.tsx

import { getTranslations } from "next-intl/server";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { ProjectEditForm } from "./components/ProjectEditForm";
import { ProjectPageTitle } from "./components/ProjectPageTitle";
import { getProjectDetails } from "@/lib/actions/project-actions";
import { obtenerProyectosConSettingsUsuario } from "@/lib/actions/project-dashboard-actions";
import { createSupabaseServerClient } from "@/lib/server";
import { StandardAlert } from "@/components/ui/StandardAlert";

// 📚 DOCUMENTACIÓN 📚
/**
 * @description Página para editar los datos maestros del proyecto.
 * Carga los datos del proyecto activo en el servidor y los pasa al formulario.
 * @returns {Promise<JSX.Element>} La página de edición del proyecto.
 */
export default async function ProjectDataPage() {
  const t = await getTranslations("datosMaestrosPages.proyectoPage");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Esto debería ser manejado por el middleware, pero sirve como fallback.
    return (
      <StandardPageBackground variant="gradient">
        <div className="container mx-auto py-6 text-center">
          <StandardAlert
            colorScheme="danger"
            message={<div><p className="font-bold">{t("accessDeniedTitle")}</p><p>{t("accessDeniedMessage")}</p></div>}
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
            message={<div><p className="font-bold">{t("errorLoadingProjectsTitle")}</p><p>{projectsResult.error}</p></div>}
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
            message={<div><p className="font-bold">{t("noActiveProjectTitle")}</p><p>{t("noActiveProjectMessage")}</p></div>}
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
            title={t("pageTitle")}
            subtitle={t("pageSubtitle")}
            description={t("pageDescription")}
            showBackButton={{ href: "/datos-maestros" }}
            breadcrumbs={[
              { label: t("breadcrumbDatosMaestros"), href: "/datos-maestros" },
              { label: t("breadcrumbProyecto") },
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
              message={<div><p className="font-bold">{t("errorLoadingProjectTitle")}</p><p>{projectDetailsResult.error}</p></div>}
            />
          )}
        </div>
      </div>
    </StandardPageBackground>
  );
}
