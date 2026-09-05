//. 📍 app/personal/page.tsx
"use client";

// 📚 DOCUMENTACIÓN 📚
/* *
 * Página principal del área personal del usuario
 * Redirige automáticamente al historial de IA como página por defecto
 */

//#region [head] - 🏷️ IMPORTS 🏷️
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";
//#endregion ![head]

//#region [main] - 🔧 COMPONENT 🔧
export default function PersonalPage() {
	const t = useTranslations("personal.indexPage");
	const router = useRouter();

	useEffect(() => {
		// Redirigir automáticamente al historial de IA
		router.replace("/personal/historial_ai");
	}, [router]);

	//#region [render] - 🎨 RENDER SECTION 🎨
	return (
		<StandardPageBackground variant="gradient">
			<div className="flex justify-center items-center min-h-[50vh]">
				<SustratoLoadingLogo
					size={50}
					variant="spin-pulse"
					showText={true}
					text={t("redirecting")}
				/>
			</div>
		</StandardPageBackground>
	);
	//#endregion ![render]
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Default export is part of the component declaration
//#endregion ![foo]
