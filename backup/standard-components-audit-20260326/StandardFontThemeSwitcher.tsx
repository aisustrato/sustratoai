// components/ui/StandardFontThemeSwitcher.tsx
// Versión: 2.0 (Refactorizado con useDesignTokens)
"use client";

import { useFontTheme } from "@/app/font-provider";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useDesignTokens } from "@/app/providers/DesignTokensProvider";
import { fontThemeConfig, type FontTheme } from "@/lib/fonts";

import { useAuth } from "@/app/auth-provider";
import { actualizarPreferenciasUI } from "@/lib/actions/project-dashboard-actions";
import { toast } from "sonner";

export function StandardFontThemeSwitcher() {
	const { fontTheme, setFontTheme } = useFontTheme();
	const auth = useAuth();
	const { tokens: designTokens } = useDesignTokens();

	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const buttonRef = useRef<HTMLButtonElement>(null);

	// Usar tokens precalculados de fontSelector
	const fontTokens = designTokens?.fontSelector;

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				menuRef.current &&
				buttonRef.current &&
				!menuRef.current.contains(event.target as Node) &&
				!buttonRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const menuVariants = {
		/* ... sin cambios ... */
		hidden: {
			opacity: 0,
			y: -5,
			scale: 0.95,
			transition: { duration: 0.2, ease: "easeInOut" },
		},
		visible: {
			opacity: 1,
			y: 0,
			scale: 1,
			transition: { duration: 0.2, ease: "easeOut" },
		},
		exit: {
			opacity: 0,
			y: -5,
			scale: 0.95,
			transition: { duration: 0.15, ease: "easeInOut" },
		},
	};
	const itemVariants = {
		/* ... sin cambios ... */ hidden: { opacity: 0, x: -10 },
		visible: (custom: number) => ({
			opacity: 1,
			x: 0,
			transition: { delay: custom * 0.05, duration: 0.2, ease: "easeOut" },
		}),
	};

	const fontStyles = [
		{
			id: "sustrato",
			name: "Fuente Sustrato",
			headingStyle: {
				fontFamily: "var(--font-ubuntu), 'Ubuntu', sans-serif",
				fontWeight: "700",
			},
			bodyStyle: {
				fontFamily: "var(--font-ubuntu), 'Ubuntu', sans-serif",
				fontWeight: "400",
			},
		},
		{
			id: "classic",
			name: "Fuente Clásica",
			headingStyle: {
				fontFamily: fontThemeConfig.classic.heading,
				fontWeight: fontThemeConfig.classic.headingWeight,
			},
			bodyStyle: {
				fontFamily: fontThemeConfig.classic.body,
				fontWeight: fontThemeConfig.classic.bodyWeight,
			},
		},
		{
			id: "technical",
			name: "Fuente Técnica",
			headingStyle: {
				fontFamily: fontThemeConfig.technical.heading,
				fontWeight: fontThemeConfig.technical.headingWeight,
				letterSpacing: fontThemeConfig.technical.letterSpacingHeadings,
			},
			bodyStyle: {
				fontFamily: fontThemeConfig.technical.body,
				fontWeight: fontThemeConfig.technical.bodyWeight,
				letterSpacing: fontThemeConfig.technical.letterSpacingBody,
			},
		},
		{
			id: "creative",
			name: "Fuente Creativa",
			headingStyle: {
				fontFamily: fontThemeConfig.creative.heading,
				fontWeight: fontThemeConfig.creative.headingWeight,
				letterSpacing: fontThemeConfig.creative.letterSpacingHeadings,
			},
			bodyStyle: {
				fontFamily: fontThemeConfig.creative.body,
				fontWeight: fontThemeConfig.creative.bodyWeight,
				letterSpacing: fontThemeConfig.creative.letterSpacingBody,
			},
		},
		{
			id: "accessible",
			name: "Fuente Accesible",
			headingStyle: {
				fontFamily: fontThemeConfig.accessible.heading,
				fontWeight: fontThemeConfig.accessible.headingWeight,
				letterSpacing: fontThemeConfig.accessible.letterSpacingHeadings,
			},
			bodyStyle: {
				fontFamily: fontThemeConfig.accessible.body,
				fontWeight: fontThemeConfig.accessible.bodyWeight,
				letterSpacing: fontThemeConfig.accessible.letterSpacingBody,
			},
		},
		{
			id: "modern",
			name: "Fuente Moderna",
			headingStyle: {
				fontFamily: fontThemeConfig.modern.heading,
				fontWeight: fontThemeConfig.modern.headingWeight,
			},
			bodyStyle: {
				fontFamily: fontThemeConfig.modern.body,
				fontWeight: fontThemeConfig.modern.bodyWeight,
			},
		},
		{
			id: "minimalist",
			name: "Fuente Minimalista",
			headingStyle: {
				fontFamily: fontThemeConfig.minimalist.heading,
				fontWeight: fontThemeConfig.minimalist.headingWeight,
				letterSpacing: fontThemeConfig.minimalist.letterSpacingHeadings,
			},
			bodyStyle: {
				fontFamily: fontThemeConfig.minimalist.body,
				fontWeight: fontThemeConfig.minimalist.bodyWeight,
				letterSpacing: fontThemeConfig.minimalist.letterSpacingBody,
			},
		},
	];

	const getCurrentFontPairName = () => {
		const currentFont = fontStyles.find((font) => font.id === fontTheme);
		return currentFont ? currentFont.name : "Default";
	};

	const getCurrentFontStyle = () => {
		const currentFont = fontStyles.find((font) => font.id === fontTheme);
		return currentFont ? currentFont.bodyStyle : fontStyles[0].bodyStyle;
	};

	const sampleBodyText = "Este es un ejemplo de texto con esta fuente.";

	const handleSelectFont = async (newFontPairId: string) => {
		setIsOpen(false); // Cerrar el menú desplegable

		const currentGlobalFontPair = auth.proyectoActual?.ui_font_pair;
		const visualFontChanged = newFontPairId !== fontTheme;

		// 1. Aplicar el cambio visual inmediato si es diferente al visual actual
		if (visualFontChanged) {
			setFontTheme(newFontPairId as FontTheme);
			console.log(
				`[FontThemeSwitcher v1.3] Cambio visual inmediato a: ${newFontPairId}`,
			);
		}

		// 2. Verificar si necesitamos persistir los cambios
		if (!auth.user?.id || !auth.proyectoActual?.id) {
			console.warn(
				"[FontThemeSwitcher v1.3] Persistencia omitida: Usuario o proyecto no disponible.",
			);
			return;
		}

		// 3. Verificar si el valor ya está persistido
		if (newFontPairId === currentGlobalFontPair) {
			console.log(
				"[FontThemeSwitcher v1.3] Persistencia omitida: La fuente seleccionada ya está persistida.",
			);
			return;
		}

		// 4. Persistencia silenciosa en segundo plano
		console.log(
			`[FontThemeSwitcher v1.3] Iniciando persistencia silenciosa para: ${newFontPairId}`,
		);
		try {
			const result = await actualizarPreferenciasUI(
				auth.user.id, // Seguro que existe por la verificación anterior
				auth.proyectoActual.id, // Seguro que existe por la verificación anterior
				{ ui_font_pair: newFontPairId },
			);

			if (result.success) {
				auth.setUiFontPairLocal(newFontPairId);
				console.log(
					`[FontThemeSwitcher v1.3] Persistencia exitosa y AuthProvider actualizado para: ${newFontPairId}`,
				);
			} else {
				toast.error(
					result.error ||
						"Ups! Tuvimos un problema al guardar tu preferencia de fuente. Es posible que en tu próximo inicio de sesión se cargue la configuración anterior.",
				);
				console.error(
					"[FontThemeSwitcher v1.3] Error en persistencia desde actualizarPreferenciasUI:",
					result.error,
				);
			}
		} catch (error: unknown) {
			console.error(
				"[FontThemeSwitcher v1.3] Excepción durante la persistencia:",
				error,
			);
			const errorMessage =
				error instanceof Error ?
					error.message
				:	"Ups! Hubo una excepción al guardar tu preferencia de fuente. Es posible que en tu próximo inicio de sesión se cargue la configuración anterior.";
			toast.error(errorMessage);
		}
	};

	return (
		<div className="relative flex flex-col gap-1 w-full pl-2">
			<div className="relative w-full">
				<motion.button
					ref={buttonRef}
					onClick={() => setIsOpen(!isOpen)}
					className="w-full text-left cursor-pointer rounded-md border transition-all"
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					style={{
						backgroundColor:
							designTokens?.button?.tertiary?.subtle?.backgroundColor ||
							"#f0f0f0",
						borderColor:
							designTokens?.input?.neutral?.md?.subtle?.borderColor || "#ddd",
						color: designTokens?.text?.neutral?.text || "#666",
						padding: "8px 12px",
						minWidth: "180px",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}>
					<div className="flex items-center gap-2">
						<span
							style={{
								...getCurrentFontStyle(),
								fontSize: "0.7rem",
								opacity: 0.8,
								color: designTokens?.text?.neutral?.text || "#666",
							}}>
							{getCurrentFontPairName()}
						</span>
					</div>
					<ChevronDown
						className="transition-transform"
						style={{
							color: designTokens?.icon?.neutral?.text || "#666",
							transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
							width: "16px",
							height: "16px",
						}}
					/>
				</motion.button>

				<AnimatePresence>
					{isOpen && (
						<motion.div
							ref={menuRef}
							className="absolute z-50 w-full rounded-md border"
							style={{
								backgroundColor:
									fontTokens?.dropdown?.backgroundColor || "#fff",
								borderColor: fontTokens?.dropdown?.borderColor || "#ddd",
								boxShadow:
									fontTokens?.dropdown?.boxShadow ||
									"0 2px 8px rgba(0,0,0,0.1)",
								padding: "0.5rem",
								maxHeight: "300px",
								overflowY: "auto",
								marginTop: "4px",
							}}
							variants={menuVariants}
							initial="hidden"
							animate="visible"
							exit="exit">
							<div className="grid gap-1">
								{fontStyles.map((font, index) => (
									<motion.button
										key={font.id}
										variants={itemVariants}
										initial="hidden"
										animate="visible"
										custom={index}
										className="w-full text-left cursor-pointer rounded-md p-2 transition-colors hover:bg-opacity-50"
										style={{
											backgroundColor:
												fontTheme === font.id ?
													designTokens?.card?.primary?.subtle
														?.backgroundColor || "#f0f0ff"
												:	"transparent",
											border:
												fontTheme === font.id ?
													`1px solid ${designTokens?.card?.primary?.subtle?.borderColor || "#ccc"}`
												:	"1px solid transparent",
										}}
										onClick={() => handleSelectFont(font.id)}>
										<p
											style={{
												...font.headingStyle,
												color:
													fontTheme === font.id ?
														designTokens?.text?.primary?.pure || "#8A4EF6"
													:	designTokens?.text?.neutral?.text || "#333",
												fontSize: "0.8rem",
												marginBottom: "0.2rem",
												fontWeight: fontTheme === font.id ? "600" : "400",
											}}>
											{font.name}
											{fontTheme === font.id && (
												<span
													className="ml-1"
													style={{
														color:
															designTokens?.text?.primary?.pure || "#8A4EF6",
													}}>
													✓
												</span>
											)}
										</p>
										<p
											style={{
												...font.bodyStyle,
												color: designTokens?.text?.neutral?.textShade || "#666",
												fontSize: "0.75rem",
												lineHeight: "1.2",
											}}>
											{sampleBodyText}
										</p>
									</motion.button>
								))}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
