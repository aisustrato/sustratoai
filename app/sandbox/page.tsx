// 📍 app/sandbox/page.tsx
// 🍄👁️ Nexus Cronológico v2.1 - Calibración Radián
// 🌸 NOSOTRAS: Mapeo fractal de nodos epistémicos
// 🧬 57.3° = 1 radián = ángulo del Jardín
// 🏗️ Server Component - obtiene project_id activo

import { createSupabaseServerClient } from "@/lib/server";
import { obtenerProyectosConSettingsUsuario } from "@/lib/actions/project-dashboard-actions";
import { SandboxClient } from "./SandboxClient";
import { StandardAlert } from "@/components/ui/StandardAlert";

export default async function SandboxPage() {
	const supabase = await createSupabaseServerClient();
	const { data: { user } } = await supabase.auth.getUser();

	// Sin usuario autenticado
	if (!user) {
		return (
			<div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
				<StandardAlert
					colorScheme="danger"
					message={<div><p className="font-bold">Acceso denegado</p><p>Debes iniciar sesión para acceder al Nexus.</p></div>}
				/>
			</div>
		);
	}

	// Obtener proyectos del usuario
	const projectsResult = await obtenerProyectosConSettingsUsuario(user.id);
	
	if (!projectsResult.success) {
		return (
			<div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
				<StandardAlert
					colorScheme="danger"
					message={<div><p className="font-bold">Error al cargar proyectos</p><p>{projectsResult.error}</p></div>}
				/>
			</div>
		);
	}

	// Buscar proyecto activo
	const activeProject = projectsResult.data.find(p => p.is_active_for_user);

	if (!activeProject) {
		return (
			<div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
				<StandardAlert
					colorScheme="primary"
					message={<div><p className="font-bold">No hay proyecto activo</p><p>Selecciona un proyecto desde el dashboard para usar el Nexus.</p></div>}
				/>
			</div>
		);
	}

	// Verificar permisos
	const canManageMasterData = activeProject.permissions?.can_manage_master_data === true;

	return (
		<SandboxClient 
			projectId={activeProject.id}
			projectName={activeProject.name}
			canManageMasterData={canManageMasterData}
		/>
	);
}
