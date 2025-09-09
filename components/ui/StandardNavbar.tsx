"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./user-avatar";
import {
	ChevronDown,
	Menu,
	X,
	FileText,
	Settings,
	MessageSquare,
	Home,
	BookOpen,
	LayoutDashboard,
	FileSpreadsheet,
	Layers,
	LayoutGrid,
	FileUp,
	ClipboardList, // Added for Datos Básicos
	Boxes,         // Added for Lote
	User,          // Added for Miembros
	Shield,        // Added for Roles
	Network,       // Added for Fases de Preclasificación
	Filter,        // Added for Preclasificación
	MapPin,        // Added for Grupos icon (map location)
} from "lucide-react";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StandardButton } from "@/components/ui/StandardButton";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { FontThemeSwitcher } from "@/components/ui/font-theme-switcher";
import { SustratoLogo } from "@/components/ui/sustrato-logo";
import { useRipple } from "@/components/ripple/RippleProvider";
import {
	StandardText,
} from "@/components/ui/StandardText";
import { useTheme } from "@/app/theme-provider";
import { createAppColorTokens } from "@/lib/theme/ColorToken";
import {
	generateStandardNavbarTokens,
	type StandardNavbarTokens,
} from "@/lib/theme/components/standard-nav-tokens";
import { StandardIcon } from "@/components/ui/StandardIcon"; // Replaced Icon with StandardIcon
import { useAuth } from "@/app/auth-provider"; // Added import
import { useWindowSize } from "@/lib/hooks/useWindowSize"; // Added for responsive logic

// --- START: Constantes de Configuración ---

// Configuración de estilos de texto para menús
const MENU_TEXT_STYLES = {
  header: {
    active: {
      colorScheme: 'primary' as const,
      colorShade: 'pure' as const
    },
    inactive: {
      colorScheme: 'secondary' as const,
      colorShade: 'text' as const
    }
  },
  submenu: {
    active: {
      colorScheme: 'primary' as const,
      colorShade: 'pure' as const
    },
    inactive: {
      colorScheme: 'secondary' as const,
      colorShade: 'text' as const
    }
  }
};

// Constantes para efectos de ripple
const MENU_RIPPLE_COLOR = 'rgba(0, 0, 0, 0.1)';
const SUBMENU_RIPPLE_COLOR = 'rgba(0, 0, 0, 0.05)';

// Alias para compatibilidad con código existente
const MENU_HEADER_TEXT_COLOR_ACTIVE = MENU_TEXT_STYLES.header.active.colorScheme;
const MENU_HEADER_TEXT_COLOR_INACTIVE = MENU_TEXT_STYLES.header.inactive.colorScheme;
const MENU_HEADER_TEXT_VARIANT_ACTIVE = MENU_TEXT_STYLES.header.active.colorShade;
const MENU_HEADER_TEXT_VARIANT_INACTIVE = MENU_TEXT_STYLES.header.inactive.colorShade;
const SUBMENU_TEXT_COLOR_ACTIVE = MENU_TEXT_STYLES.submenu.active.colorScheme;
const SUBMENU_TEXT_COLOR_INACTIVE = MENU_TEXT_STYLES.submenu.inactive.colorScheme;
const SUBMENU_TEXT_VARIANT_ACTIVE = MENU_TEXT_STYLES.submenu.active.colorShade;
const SUBMENU_TEXT_VARIANT_INACTIVE = MENU_TEXT_STYLES.submenu.inactive.colorShade;

// --- END: Constantes de Configuración ---

// --- START: Constantes Responsivas ---

// Breakpoints para los cinco estadios responsivos (ajustados según análisis real)
const RESPONSIVE_BREAKPOINTS = {
	STAGE_1: 1500, // Navbar completo normal
	STAGE_2: 1350, // Solo selector de fuente se mueve al UserAvatar (antes del solapamiento)
	STAGE_3: 1250, // Selector de fuente + tema se mueven al UserAvatar
	STAGE_4: 1120, // Solo logo/nombre + UserAvatar (todos los controles en avatar)
	STAGE_5: 1050, // Menú hamburguesa móvil
} as const;

// Tamaños de texto para cada estadio
const TEXT_SIZES_BY_STAGE = {
	STAGE_1: 'sm' as const,
	STAGE_2: 'xs' as const,
	STAGE_3: 'xs' as const,
	STAGE_4: '3xs' as const,
	STAGE_5: 'sm' as const, // En móvil vuelve a tamaño normal
} as const;

// --- END: Constantes Responsivas ---

const menuItemVariants = {
	hidden: { opacity: 0, y: -5 },
	visible: { opacity: 1, y: 0 },
	hover: { scale: 1.05, transition: { duration: 0.2 } },
	tap: { scale: 0.95 },
};

const submenuVariants = {
	hidden: { opacity: 0, height: 0, overflow: "hidden" },
	visible: {
		opacity: 1,
		height: "auto",
		transition: {
			duration: 0.3,
			staggerChildren: 0.05,
			when: "beforeChildren",
		},
	},
};

const arrowVariants = {
	closed: { rotate: 0 },
	open: { rotate: 180 },
};

const NAVBAR_RIPPLE_SCALE = 9;

interface NavSubItem {
	label: string;
	href: string;
	icon: (isActive: boolean) => React.ReactElement;
	disabled?: boolean;
}

interface NavItem {
	label: string;
	href: string;
	icon: (isActive: boolean) => React.ReactElement;
	submenu?: NavSubItem[];
	disabled?: boolean;
	id?: string; // Para identificar el menú al filtrar
}

export function StandardNavbar() {
	const pathname = usePathname();
	const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);
	const navRef = useRef<HTMLElement>(null);
	const ripple = useRipple();
	const { mode, appColorTokens } = useTheme();
	const { proyectoActual } = useAuth();
	const { width: windowWidth } = useWindowSize();
	const scrollRafIdRef = useRef<number | null>(null);

	// Determinar el estadio responsivo actual
	const currentStage = useMemo(() => {
		// Si windowWidth es undefined, usar un valor por defecto (desktop)
		if (!windowWidth) {
			console.log('🔍 [NAVBAR DEBUG] windowWidth is undefined, defaulting to STAGE_1');
			return 'STAGE_1';
		}
		
		let stage;
		if (windowWidth >= RESPONSIVE_BREAKPOINTS.STAGE_1) stage = 'STAGE_1';
		else if (windowWidth >= RESPONSIVE_BREAKPOINTS.STAGE_2) stage = 'STAGE_2';
		else if (windowWidth >= RESPONSIVE_BREAKPOINTS.STAGE_3) stage = 'STAGE_3';
		else if (windowWidth >= RESPONSIVE_BREAKPOINTS.STAGE_4) stage = 'STAGE_4';
		else stage = 'STAGE_5';
		
		console.log(`🔍 [NAVBAR DEBUG] windowWidth: ${windowWidth}px -> ${stage}`, {
			breakpoints: RESPONSIVE_BREAKPOINTS,
			currentWidth: windowWidth,
			selectedStage: stage
		});
		
		return stage;
	}, [windowWidth]);

	// Configuración de elementos según el estadio
	const stageConfig = useMemo(() => {
		const config = {
			// STAGE_1: Navbar completo normal
			showThemeControlsInNavbar: currentStage === 'STAGE_1',
			showFontSwitcherInNavbar: currentStage === 'STAGE_1',
			showDarkModeSwitchInNavbar: currentStage === 'STAGE_1' || currentStage === 'STAGE_2',
			// STAGE_4: Solo logo/nombre + UserAvatar + botón hamburguesa (ocultar menús principales)
			showMainMenus: currentStage !== 'STAGE_4', // En STAGE_5 (móvil) los menús SÍ se muestran dentro del hamburguesa
			textSize: TEXT_SIZES_BY_STAGE[currentStage as keyof typeof TEXT_SIZES_BY_STAGE],
			// Mostrar botón hamburguesa en STAGE_4 y STAGE_5
			useMobileMenu: currentStage === 'STAGE_4' || currentStage === 'STAGE_5',
		};
		
		console.log(`🎯 [NAVBAR DEBUG] Stage Config for ${currentStage}:`, {
			currentStage,
			showMainMenus: config.showMainMenus,
			useMobileMenu: config.useMobileMenu,
			showThemeControlsInNavbar: config.showThemeControlsInNavbar,
			showFontSwitcherInNavbar: config.showFontSwitcherInNavbar,
			showDarkModeSwitchInNavbar: config.showDarkModeSwitchInNavbar
		});
		
		return config;
	}, [currentStage]);

	const currentNavTokens: StandardNavbarTokens | null = useMemo(() => {
		if (!appColorTokens) {
			return generateStandardNavbarTokens(
				createAppColorTokens("blue", "light"),
				"light"
			);
		}
		return generateStandardNavbarTokens(appColorTokens, mode);
	}, [appColorTokens, mode]);

	const handleScroll = useCallback(() => {
		if (scrollRafIdRef.current !== null) return;
		scrollRafIdRef.current = window.requestAnimationFrame(() => {
			const offset = window.scrollY;
			setScrolled(offset > 20);
			scrollRafIdRef.current = null;
		});
	}, [scrollRafIdRef]);

	const handleClickOutside = useCallback((event: Event) => {
		const node = event.target as Node | null;
		if (!node) return;
		let el: Element | null = null;
		if (node instanceof Element) {
			el = node;
		} else if ((node as any).parentElement) {
			el = (node as any).parentElement as Element;
		}
		const isInContent = !!el?.closest('[data-submenu="content"]');
		// Cerrar siempre que el click NO esté dentro del contenido del submenú.
		if (!isInContent) {
			setOpenSubmenu(null);
		}
	}, []);

	const handleKeyDown = useCallback((event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			setOpenSubmenu(null);
		}
	}, []);

	useEffect(() => {
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => {
			window.removeEventListener("scroll", handleScroll);
			if (scrollRafIdRef.current !== null) {
				cancelAnimationFrame(scrollRafIdRef.current);
				scrollRafIdRef.current = null;
			}
		};
	}, [handleScroll]);

	useEffect(() => {
		if (!openSubmenu) return;
		const pointerOpts: AddEventListenerOptions = { capture: true, passive: true };
		const keyOpts: AddEventListenerOptions = { capture: true };
		const pointerEvents: Array<keyof DocumentEventMap> = ["mousedown", "touchstart", "pointerdown", "click"];
		pointerEvents.forEach((ev) => document.addEventListener(ev, handleClickOutside as EventListener, pointerOpts));
		document.addEventListener('keydown', handleKeyDown as EventListener, keyOpts);
		return () => {
			pointerEvents.forEach((ev) => document.removeEventListener(ev, handleClickOutside as EventListener, pointerOpts));
			document.removeEventListener('keydown', handleKeyDown as EventListener, keyOpts);
		};
	}, [handleClickOutside, handleKeyDown, openSubmenu]);

	// Función para crear íconos de menú
const createMenuIcon = (Icon: React.ElementType, isActive = false) => (
  <StandardIcon
    colorScheme={isActive ? "primary" : "neutral"}
    styleType={isActive ? "inverseStroke" : "outlineGradient"}
    className="mr-2 flex-shrink-0"
    size="sm"
  >
    <Icon />
  </StandardIcon>
);

const navItems: NavItem[] = useMemo(() => {
  if (!proyectoActual) return [];

  const menuItems: NavItem[] = [
    {
      id: "inicio",
      label: "Inicio",
      href: "/",
      icon: (isActive) => createMenuIcon(Home, isActive),
    },
  ];

  if (proyectoActual.module_interviews) {
    menuItems.push({
      id: "entrevistas",
      label: "Entrevistas",
      href: "/entrevistas",
      icon: () => createMenuIcon(FileText),
      submenu: [
        {
          label: "Entrevistas",
          href: "/entrevistas",
          icon: () => createMenuIcon(MessageSquare),
        },
        {
          label: "Listado de Transcripciones",
          href: "/transcripciones",
          icon: () => createMenuIcon(FileSpreadsheet),
        },
        {
          label: "Matriz de Vaciado",
          href: "/entrevistas/matriz",
          icon: () => createMenuIcon(Layers),
        },
      ],
    });
  }

  if (proyectoActual.module_bibliography) {
    menuItems.push({
      id: "articulos",
      label: "Artículos",
      href: "/articulos",
      icon: () => createMenuIcon(BookOpen),
      submenu: [
        {
          label: "Preclasificación",
          href: "/articulos/preclasificacion",
          icon: () => createMenuIcon(Filter),
        },
        {
          label: "Grupos",
          href: "/articulos/grupos",
          icon: () => createMenuIcon(MapPin),
        },
        {
          label: "Notas",
          href: "/articulos/notas",
          icon: () => createMenuIcon(FileText),
        },
      ],
    });
  }

  // Menú de Datos Maestros siempre está disponible si hay un proyecto
  menuItems.push({
    id: "datos-maestros",
    label: "Datos Maestros",
    href: "/datos-maestros",
    icon: (isActive) => createMenuIcon(Settings, isActive),
    submenu: [
      {
        label: "Proyecto",
        href: "/datos-maestros/proyecto",
        icon: (isActive) => createMenuIcon(ClipboardList, isActive),
      },
      {
        label: "Roles Proyecto",
        href: "/datos-maestros/roles",
        icon: (isActive) => createMenuIcon(Shield, isActive),
      },
      {
        label: "Miembros Proyecto",
        href: "/datos-maestros/miembros",
        icon: (isActive) => createMenuIcon(User, isActive),
      },
      {
        label: "Cargar Artículos",
        href: "/datos-maestros/cargar-articulos",
        icon: (isActive) => createMenuIcon(FileUp, isActive),
      },
      {
        label: "Fases de Preclasificación",
        href: "/datos-maestros/fases-preclasificacion",
        icon: (isActive) => createMenuIcon(Network, isActive),
      },
      {
        label: "Dimensiones",
        href: "/datos-maestros/dimensiones",
        icon: (isActive) => createMenuIcon(LayoutGrid, isActive),
      },
      {
        label: "Lotes",
        href: "/datos-maestros/lote",
        icon: (isActive) => createMenuIcon(Boxes, isActive),
      },
    ],
  });

  // Menú Personal siempre está disponible si hay un proyecto
  menuItems.push({
    id: "personal",
    label: "Personal",
    href: "/personal",
    icon: (isActive) => createMenuIcon(User, isActive),
    submenu: [
      {
        label: "Historial",
        href: "/personal/historial",
        icon: (isActive) => createMenuIcon(ClipboardList, isActive),
      },
      {
        label: "Consumo AI",
        href: "/personal/consumo-ai",
        icon: (isActive) => createMenuIcon(LayoutDashboard, isActive),
      },
    ],
  });

  return menuItems;
}, [proyectoActual]);

	// Inicializar con valores por defecto para evitar null en los hooks
	const defaultNavTokens = useMemo(() => {
		return currentNavTokens || generateStandardNavbarTokens(
			createAppColorTokens("blue", "light"),
			"light"
		);
	}, [currentNavTokens]);

	// Manejo de submenús
	const toggleSubmenu = useCallback((label: string, e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const rippleColor = defaultNavTokens?.active?.bg || MENU_RIPPLE_COLOR;
		ripple(e.nativeEvent, rippleColor, NAVBAR_RIPPLE_SCALE);
		setOpenSubmenu((prev) => (prev === label ? null : label));
	}, [defaultNavTokens?.active?.bg, ripple]);

	// Verifica si un ítem de menú o sus subítems están activos
	const isSubmenuActive = useCallback((item: NavItem): boolean => {
		if (!pathname) return false;
		if (pathname === item.href) return true;
		if (!item.submenu) return false;

		return item.submenu.some(
			(subItem) =>
				pathname === subItem.href ||
				(subItem.href !== "/" && pathname.startsWith(subItem.href))
		);
	}, [pathname]);

	// Estilos dinámicos
	const gradientBarStyle = useMemo(() => ({
		background: defaultNavTokens?.gradientBar
			? `linear-gradient(to right, 
          ${defaultNavTokens.gradientBar.start}, 
          ${defaultNavTokens.gradientBar.middle}, 
          ${defaultNavTokens.gradientBar.end}
        )`
			: "linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899)", // Valores por defecto
	}), [defaultNavTokens?.gradientBar]);

	const navBackgroundStyle = useMemo(() => {
		const defaultBg = mode === "dark" ? "#1e1e2d" : "#ffffff";
		const defaultScrolledBg = mode === "dark" ? "#1a1a27" : "#f8f9fa";

		return {
			backgroundColor: scrolled
				? defaultNavTokens?.background?.scrolled || defaultScrolledBg
				: defaultNavTokens?.background?.normal || defaultBg,
			boxShadow: scrolled
				? defaultNavTokens?.shadow || "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
				: "none",
			borderBottom: scrolled
				? `1px solid ${currentNavTokens?.submenu?.border || "rgba(0, 0, 0, 0.1)"}`
				: "none",
			backdropFilter: scrolled ? "blur(8px)" : "none",
		};
	}, [
		scrolled, 
		currentNavTokens, 
		mode,
		defaultNavTokens?.background?.normal,
		defaultNavTokens?.background?.scrolled,
		defaultNavTokens?.shadow
	]);

	return (
		<>
			<motion.nav
				className={cn("sticky top-0 z-40 w-full transition-all")}
				style={navBackgroundStyle}
				initial={{ y: -10, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ duration: 0.3 }}>
				<div className="w-full px-4 sm:px-6 lg:px-8">
					<div className="flex h-16 items-center justify-between">
						<motion.div
							className="flex items-center flex-shrink-0"
							initial={{ x: -20, opacity: 0 }}
							animate={{ x: 0, opacity: 1 }}
							transition={{ duration: 0.5, delay: 0.1 }}>
							<Link
								href="/"
								className="flex items-center gap-2"
								onMouseDown={(e) =>
									ripple(e.nativeEvent, MENU_RIPPLE_COLOR, NAVBAR_RIPPLE_SCALE)
								}>
								<SustratoLogo
									size={40}
									className="flex-shrink-0"
									primaryColor={currentNavTokens.logo.primary}
									accentColor={currentNavTokens.logo.accent}
								/>
								<div className="flex flex-col">
									<div className="font-bold text-xl md:text-2xl">
										<span
											className="bg-clip-text text-transparent font-bold"
											style={{
												backgroundImage: currentNavTokens.logo.titleGradient,
												fontFamily: "'Chau Philomene One', sans-serif",
											}}>
											Sustrato.ai
										</span>
									</div>
									<StandardText
										size={currentStage === 'STAGE_4' ? '2xs' : 'sm'}
										colorScheme="neutral"
										colorShade="pure"
										className={currentStage === 'STAGE_4' ? 'mt-0 leading-tight' : 'mt-0.5'}>
										cultivando sinergias humano·AI
									</StandardText>
								</div>
							</Link>
						</motion.div>

						{stageConfig.showMainMenus && (
							<div className={`${stageConfig.useMobileMenu ? 'hidden' : 'flex'} flex-1 min-w-0 items-center justify-center`}>
								<div className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-2">
								{navItems.map((item, index) => (
								<motion.div
									key={item.href || item.label}
									className="relative"
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.3, delay: index * 0.05 }}>
									{item.submenu ? (
										<div className="relative">
											<motion.button
												onClick={(e) => toggleSubmenu(item.label, e)}
												onMouseDown={(e) =>
													ripple(
														e.nativeEvent,
														MENU_RIPPLE_COLOR,
														NAVBAR_RIPPLE_SCALE
													)
												}
												data-submenu="trigger"
												className={cn(
													"flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
													pathname === item.href || isSubmenuActive(item)
														? ""
														: "hover:bg-opacity-100"
												)}
												style={{
													backgroundColor:
														pathname === item.href || isSubmenuActive(item)
															? currentNavTokens.active.bg
															: "transparent",
												}}
												whileHover={{
													backgroundColor:
														pathname === item.href || isSubmenuActive(item)
															? currentNavTokens.active.bg
															: currentNavTokens.hover.bg,
													scale: 1.05,
													transition: { duration: 0.2 },
												}}
												whileTap={menuItemVariants.tap}>
												{item.icon(
													pathname === item.href || isSubmenuActive(item)
												)}
												<StandardText
													colorScheme={
														pathname === item.href || isSubmenuActive(item)
															? MENU_HEADER_TEXT_COLOR_ACTIVE
															: MENU_HEADER_TEXT_COLOR_INACTIVE
													}
													colorShade={
														pathname === item.href || isSubmenuActive(item)
															? MENU_HEADER_TEXT_VARIANT_ACTIVE
															: MENU_HEADER_TEXT_VARIANT_INACTIVE
													}
													weight="medium"
													size="sm">
													{item.label}
												</StandardText>
												<motion.div
													variants={arrowVariants}
													initial="closed"
													animate={
														openSubmenu === item.label ? "open" : "closed"
													}
													transition={{ duration: 0.2 }}>
													<StandardIcon
															className={cn(
																"ml-1 transition-transform duration-200 ease-in-out flex-shrink-0",
																openSubmenu === item.label ? "rotate-180" : ""
															)}
															size="sm"
															colorScheme={
																pathname === item.href || isSubmenuActive(item)
																	? "primary"
																	: "neutral"
															}
															styleType={
																pathname === item.href || isSubmenuActive(item)
																	? "inverseStroke"
																	: "outlineGradient"
															}>
															<ChevronDown className="w-4 h-4" />
														</StandardIcon>
												</motion.div>
											</motion.button>
											<AnimatePresence>
												{openSubmenu === item.label && (
													<motion.div
														className="absolute z-10 left-0 mt-2 w-56 origin-top-left rounded-md shadow-lg focus:outline-none"
														style={{
															backgroundColor:
																currentNavTokens.submenu.background,
															borderColor: currentNavTokens.submenu.border,
															borderWidth: currentNavTokens.submenu.border
																? "1px"
																: "0",
															borderStyle: currentNavTokens.submenu.border
																? "solid"
																: "none",
															boxShadow: currentNavTokens.icon.arrow,
														}}
														initial="hidden"
														animate="visible"
														exit="hidden"
														variants={submenuVariants}
														data-submenu="content">
														<div className="py-1">
															{item.submenu.map((subitem) => (
																<motion.div
																	key={subitem.href}
																	variants={menuItemVariants}
																	whileHover={{
																		backgroundColor:
																			pathname === subitem.href
																				? currentNavTokens.active.bg
																				: currentNavTokens.hover.bg,
																		scale: 1.05,
																		transition: { duration: 0.2 },
																	}}
																	whileTap={menuItemVariants.tap}>
																	<Link
																		href={subitem.href}
																		className="block px-4 py-2 text-sm flex items-center transition-colors"
																		style={{
																			backgroundColor:
																				pathname === subitem.href
																					? currentNavTokens.active.bg
																					: "transparent",
																		}}
																		onClick={() => setOpenSubmenu(null)}
																		onMouseDown={(e) =>
																			ripple(
																				e.nativeEvent,
																				SUBMENU_RIPPLE_COLOR,
																				NAVBAR_RIPPLE_SCALE
																			)
																		}>
																		{subitem.icon(pathname === subitem.href)}
																		<StandardText
																			colorScheme={
																				pathname === subitem.href
																					? SUBMENU_TEXT_COLOR_ACTIVE
																					: SUBMENU_TEXT_COLOR_INACTIVE
																			}
																			colorShade={
																				pathname === subitem.href
																					? SUBMENU_TEXT_VARIANT_ACTIVE
																					: SUBMENU_TEXT_VARIANT_INACTIVE
																			}
																			weight={
																				pathname === subitem.href
																					? "medium"
																					: "normal"
																			}
																			size={stageConfig.textSize}>
																			{subitem.label}
																		</StandardText>
																	</Link>
																</motion.div>
															))}
														</div>
													</motion.div>
												)}
											</AnimatePresence>
										</div>
									) : (
										<motion.div
											whileHover={{
												backgroundColor:
													pathname === item.href
														? currentNavTokens.active.bg
														: currentNavTokens.hover.bg,
												scale: 1.05,
												transition: { duration: 0.2 },
											}}
											whileTap={menuItemVariants.tap}
											className="rounded-md">
											<Link
												href={item.disabled ? "#" : item.href}
												className="px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center"
												style={{
													backgroundColor:
														pathname === item.href
															? currentNavTokens.active.bg
															: "transparent",
													opacity: item.disabled ? 0.5 : 1,
													cursor: item.disabled ? "not-allowed" : "pointer",
												}}
												onClick={(e) => {
													if (item.disabled) e.preventDefault();
												}}
												onMouseDown={(e) =>
													ripple(
														e.nativeEvent,
														MENU_RIPPLE_COLOR,
														NAVBAR_RIPPLE_SCALE
													)
												}>
												{item.icon(pathname === item.href)}
												<StandardText
													colorScheme={
														pathname === item.href
															? MENU_HEADER_TEXT_COLOR_ACTIVE
															: MENU_HEADER_TEXT_COLOR_INACTIVE
													}
													colorShade={
														pathname === item.href
															? MENU_HEADER_TEXT_VARIANT_ACTIVE
															: MENU_HEADER_TEXT_VARIANT_INACTIVE
													}
													weight="medium"
													size="sm">
													{item.label}
												</StandardText>
												{item.disabled && (
													<span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
														Próximamente
													</span>
												)}
											</Link>
										</motion.div>
									)}
								</motion.div>
							))}
							</div>
						</div>
					)}

						<div className="flex items-center flex-shrink-0">
						<div className={`${stageConfig.useMobileMenu ? 'hidden' : 'flex'} items-center gap-3 lg:gap-4`}>
							{stageConfig.showFontSwitcherInNavbar && <FontThemeSwitcher />}
							{stageConfig.showDarkModeSwitchInNavbar && <ThemeSwitcher />}
							<UserAvatar 
								showFontSwitcher={!stageConfig.showFontSwitcherInNavbar}
								showThemeSwitcher={!stageConfig.showDarkModeSwitchInNavbar}
							/>
						</div>

							<div className={`${stageConfig.useMobileMenu ? 'block' : 'hidden'} ml-2`}>
								<motion.div whileTap={{ scale: 0.9 }}>
									<StandardButton
										styleType="ghost"
										iconOnly={true}
										size="sm"
										onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
										onMouseDown={(e) =>
											ripple(
												e.nativeEvent,
												MENU_RIPPLE_COLOR,
												NAVBAR_RIPPLE_SCALE
											)
										}
										aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
										tooltip={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}>
										{mobileMenuOpen ? (
											<StandardIcon className="h-6 w-6">
												<X className="h-full w-full" />
											</StandardIcon>
										) : (
											<StandardIcon className="h-6 w-6">
												<Menu className="h-full w-full" />
											</StandardIcon>
										)}
									</StandardButton>
								</motion.div>
							</div>
						</div>
					</div>
				</div>

				<div className="w-full h-1" style={gradientBarStyle} />

				<AnimatePresence>
					{stageConfig.useMobileMenu && mobileMenuOpen && (
						<motion.div
							className="border-b"
							style={{
								backgroundColor: scrolled
									? currentNavTokens?.background?.scrolled || (mode === "dark" ? "#1a1a27" : "#f8f9fa")
									: currentNavTokens?.background?.normal || (mode === "dark" ? "#1e1e2d" : "#ffffff"),
								borderColor: currentNavTokens?.submenu?.border || "rgba(0, 0, 0, 0.1)",
								borderBottomWidth: currentNavTokens?.submenu?.border ? "1px" : "0",
								borderBottomStyle: currentNavTokens?.submenu?.border ? "solid" : "none",
								backdropFilter: scrolled ? "blur(8px)" : "none",
								boxShadow: scrolled ? (currentNavTokens?.shadow || "0 4px 6px -1px rgba(0, 0, 0, 0.1)") : "none"
							}}
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							transition={{ duration: 0.3 }}>
							<div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
								<div
									className="flex justify-around items-center py-2 border-b mb-2"
									style={{
										borderColor: currentNavTokens.submenu.border,
										borderTopWidth: currentNavTokens.submenu.border
											? "1px"
											: "0",
										borderTopStyle: currentNavTokens.submenu.border
											? "solid"
											: "none",
									}}>
									<FontThemeSwitcher />
									<ThemeSwitcher />
							</div>

							{/* En modo móvil, siempre mostrar los menús dentro del menú hamburguesa */}
			{navItems.map((item, index) => (
									<motion.div
										key={item.href || item.label}
										initial={{ opacity: 0, x: -10 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ duration: 0.3, delay: index * 0.05 + 0.1 }}>
										{item.submenu ? (
											<>
												<motion.button
													onClick={(e) => toggleSubmenu(item.label, e)}
													onMouseDown={(e) =>
														ripple(
															e.nativeEvent,
															MENU_RIPPLE_COLOR,
															NAVBAR_RIPPLE_SCALE
														)
													}
													data-submenu="trigger"
													className="flex w-full items-center justify-between px-3 py-2 text-base font-medium rounded-md"
													style={{
														backgroundColor:
															pathname === item.href || isSubmenuActive(item)
																? currentNavTokens.active.bg
																: "transparent",
													}}
													whileHover={{
														backgroundColor:
															pathname === item.href || isSubmenuActive(item)
																? currentNavTokens.active.bg
																: currentNavTokens.hover.bg,
													}}
													whileTap={{ scale: 0.98 }}>
													<span className="flex items-center">
														{item.icon(
															pathname === item.href || isSubmenuActive(item)
														)}
														<StandardText
															colorScheme={
																pathname === item.href || isSubmenuActive(item)
																	? MENU_HEADER_TEXT_COLOR_ACTIVE
																	: MENU_HEADER_TEXT_COLOR_INACTIVE
															}
															colorShade={
																pathname === item.href || isSubmenuActive(item)
																	? MENU_HEADER_TEXT_VARIANT_ACTIVE
																	: MENU_HEADER_TEXT_VARIANT_INACTIVE
															}
															weight="medium"
															size={stageConfig.textSize}>
															{item.label}
														</StandardText>
													</span>
													<motion.div
														variants={arrowVariants}
														initial="closed"
														animate={
															openSubmenu === item.label ? "open" : "closed"
														}
														transition={{ duration: 0.2 }}>
														<StandardIcon
															className="ml-1 transition-transform duration-200 ease-in-out"
															size="xs"
															colorScheme={
																pathname === item.href || isSubmenuActive(item)
																	? "primary"
																	: "neutral"
															}
															styleType={
																pathname === item.href || isSubmenuActive(item)
																	? "inverseStroke"
																	: "outlineGradient"
															}>
															<ChevronDown />
														</StandardIcon>
													</motion.div>
												</motion.button>
												<AnimatePresence>
													{openSubmenu === item.label && (
														<motion.div
															className="pl-4 space-y-1"
															initial="hidden"
															animate="visible"
															exit="hidden"
															variants={submenuVariants}
															data-submenu="content">
															{item.submenu.map((subitem) => (
																<motion.div
																	key={subitem.href}
																	variants={menuItemVariants}
																	whileHover={{
																		backgroundColor:
																			pathname === subitem.href
																				? currentNavTokens.active.bg
																				: currentNavTokens.hover.bg,
																		scale: 1.02,
																	}}
																	whileTap={menuItemVariants.tap}
																	className="rounded-md">
																	<Link
																		href={subitem.href}
																		className="block px-3 py-2 text-sm rounded-md flex items-center transition-colors"
																		style={{
																			backgroundColor:
																				pathname === subitem.href
																					? currentNavTokens.active.bg
																					: "transparent",
																		}}
																		onClick={() => {
																			setOpenSubmenu(null);
																			setMobileMenuOpen(false);
																		}}
																		onMouseDown={(e) =>
																			ripple(
																				e.nativeEvent,
																				SUBMENU_RIPPLE_COLOR,
																				NAVBAR_RIPPLE_SCALE
																			)
																		}>
																		{subitem.icon(pathname === subitem.href)}
																		<StandardText
																			colorScheme={
																				pathname === subitem.href
																					? SUBMENU_TEXT_COLOR_ACTIVE
																					: SUBMENU_TEXT_COLOR_INACTIVE
																			}
																			colorShade={
																				pathname === subitem.href
																					? SUBMENU_TEXT_VARIANT_ACTIVE
																					: SUBMENU_TEXT_VARIANT_INACTIVE
																			}
																			weight={
																				pathname === subitem.href
																					? "medium"
																					: "normal"
																			}
																			size={stageConfig.textSize}>
																			{subitem.label}
																		</StandardText>
																	</Link>
																</motion.div>
															))}
														</motion.div>
													)}
												</AnimatePresence>
											</>
										) : (
											<motion.div
												whileHover={{
													backgroundColor:
														pathname === item.href
															? currentNavTokens.active.bg
															: currentNavTokens.hover.bg,
													scale: 1.02,
												}}
												whileTap={menuItemVariants.tap}
												className="rounded-md">
												<Link
													href={item.disabled ? "#" : item.href}
													className="block px-3 py-2 text-base font-medium rounded-md flex items-center"
													style={{
														backgroundColor:
															pathname === item.href
																? currentNavTokens.active.bg
																: "transparent",
														opacity: item.disabled ? 0.5 : 1,
														cursor: item.disabled ? "not-allowed" : "pointer",
													}}
													onClick={(e) => {
														if (item.disabled) {
															e.preventDefault();
														} else {
															setMobileMenuOpen(false);
														}
													}}
													onMouseDown={(e) =>
														ripple(
															e.nativeEvent,
															MENU_RIPPLE_COLOR,
															NAVBAR_RIPPLE_SCALE
														)
													}>
													{item.icon(pathname === item.href)}
													<StandardText
														colorScheme={
															pathname === item.href
																? MENU_HEADER_TEXT_COLOR_ACTIVE
																: MENU_HEADER_TEXT_COLOR_INACTIVE
														}
														colorShade={
															pathname === item.href
																? MENU_HEADER_TEXT_VARIANT_ACTIVE
																: MENU_HEADER_TEXT_VARIANT_INACTIVE
														}
														weight="medium"
														size={stageConfig.textSize}>
														{item.label}
													</StandardText>
													{item.disabled && (
														<span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
															Próximamente
														</span>
													)}
												</Link>
											</motion.div>
										)}
									</motion.div>
								))}
								<div
									className="pt-4 mt-2 border-t w-full"
									style={{
										borderColor: currentNavTokens.submenu.border,
										borderTopWidth: currentNavTokens.submenu.border
											? "1px"
											: "0",
										borderTopStyle: currentNavTokens.submenu.border
											? "solid"
											: "none",
									}}>
									<div className="w-full px-2 flex justify-center">
										<UserAvatar />
									</div>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.nav>
		</>
	);
}
