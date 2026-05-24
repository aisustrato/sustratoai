"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/app/theme-provider";
import { SustratoLoadingLogo } from "@/components/ui/sustrato-loading-logo";

/**
 * StandardToaster — Sonner cableado al theme provider del proyecto.
 *
 * Lo que hace:
 * - `theme` (light/dark) sigue dinámicamente al ThemeProvider.
 * - `closeButton` global: todos los toasts muestran X para cierre manual
 *   (refuerza el protocolo "errores siempre visibles" cuando se combina
 *   con `duration: Infinity` en toast.error/warning).
 * - Tematización por tipo con **degradados 135°** construidos a partir
 *   de los design tokens semánticos del proyecto (`appColorTokens`):
 *   - loading / default / info → degradado neutral (subtle → bg)
 *   - success → degradado success
 *   - warning → degradado warning
 *   - error → degradado danger
 *
 * Por qué el gradient va por CSS injection y no por CSS vars:
 *   Sonner usa `--success-bg`, `--error-bg`, etc. como `background-color`,
 *   que NO acepta `linear-gradient(...)` (el navegador descarta el valor
 *   y el toast queda transparente). Por eso seteamos esas vars con un
 *   color sólido (el extremo final del degradado, para que sirva como
 *   fallback decente) e inyectamos el gradient como `background-image`
 *   targeting `[data-sonner-toast][data-type="..."]`. background-color
 *   y background-image conviven: la imagen se pinta encima del color.
 */
export function StandardToaster() {
	const { mode, appColorTokens: t } = useTheme();

	const grad = (start: string, end: string) =>
		`linear-gradient(135deg, ${start} 0%, ${end} 100%)`;

	// Color sólido para las CSS vars de Sonner (fallback + valor para
	// borders/text que sí lo consumen como background-color válido).
	// El degradado real va por CSS injection abajo. Usamos `bg` y
	// `bgShade` que sí existen en ColorShade del proyecto (subtle no).
	const style = {
		"--normal-bg": t.neutral.bg,
		"--normal-text": t.neutral.text,
		"--normal-border": t.neutral.bgShade,
		"--info-bg": t.neutral.bg,
		"--info-text": t.neutral.text,
		"--info-border": t.neutral.bgShade,
		"--success-bg": t.success.bg,
		"--success-text": t.success.text,
		"--success-border": t.success.bgShade,
		"--warning-bg": t.warning.bg,
		"--warning-text": t.warning.text,
		"--warning-border": t.warning.bgShade,
		"--error-bg": t.danger.bg,
		"--error-text": t.danger.text,
		"--error-border": t.danger.bgShade,
	} as React.CSSProperties;

	// CSS injection para sobrescribir el background con gradient.
	// !important porque Sonner aplica su propio background-color via clases
	// con alta especificidad cuando richColors está activo.
	// Degradado de `bg` (más claro) → `bgShade` (más saturado/oscuro).
	const css = `
		[data-sonner-toaster] [data-sonner-toast] {
			background-image: ${grad(t.neutral.bg, t.neutral.bgShade)} !important;
		}
		[data-sonner-toaster] [data-sonner-toast][data-type="info"] {
			background-image: ${grad(t.neutral.bg, t.neutral.bgShade)} !important;
		}
		[data-sonner-toaster] [data-sonner-toast][data-type="success"] {
			background-image: ${grad(t.success.bg, t.success.bgShade)} !important;
		}
		[data-sonner-toaster] [data-sonner-toast][data-type="warning"] {
			background-image: ${grad(t.warning.bg, t.warning.bgShade)} !important;
		}
		[data-sonner-toaster] [data-sonner-toast][data-type="error"] {
			background-image: ${grad(t.danger.bg, t.danger.bgShade)} !important;
		}
		[data-sonner-toaster] [data-sonner-toast][data-type="loading"] {
			background-image: ${grad(t.neutral.bg, t.neutral.bgShade)} !important;
		}
	`;

	return (
		<>
			<style dangerouslySetInnerHTML={{ __html: css }} />
			<Toaster
				position="top-right"
				theme={mode}
				richColors
				closeButton
				style={style}
				icons={{
					// El círculo "está pensando" default de Sonner queda
					// reemplazado por el logo del proyecto con animación spin.
					// breathing/colorTransition apagados: a 18px se vería
					// recargado y compitiendo con el degradado del toast.
					loading: (
						<SustratoLoadingLogo
							size={18}
							variant="spin"
							breathingEffect={false}
							colorTransition={false}
						/>
					),
				}}
			/>
		</>
	);
}
