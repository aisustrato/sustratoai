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
  UserPlus,
  ShieldCheck,
  LayoutGrid,
} from "lucide-react";

// Define consistent icon size for the navbar
const NAV_ICON_SIZE = "h-4 w-4";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StandardButton } from "@/components/ui/StandardButton";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { FontThemeSwitcher } from "@/components/ui/font-theme-switcher";
import { SustratoLogo } from "@/components/ui/sustrato-logo";
import { useRipple } from "@/components/ripple/RippleProvider";
import { StandardText, type StandardTextProps } from "@/components/ui/StandardText";
import { useTheme } from "@/app/theme-provider";
import { createAppColorTokens } from "@/lib/theme/ColorToken";
import { generateStandardNavbarTokens, type StandardNavbarTokens } from "@/lib/theme/components/standard-nav-tokens";
import { StandardIcon } from "@/components/ui/StandardIcon"; // Replaced Icon with StandardIcon
import { useAuth } from "@/app/auth-provider"; // Added import

// --- START: Variables de Configuración del Navbar ---

// Variables booleanas para controlar la visibilidad de los menús
// const SHOW_ENTREVISTAS_MENU = true; // Will be replaced by proyectoActual.module_interviews
// const SHOW_ARTICULOS_MENU = true; // Will be replaced by proyectoActual.module_bibliography
// const SHOW_DATOS_MAESTROS_MENU = true; // Will be replaced by proyectoActual presence or a specific flag

// Estilos de texto para encabezados de menú principal
const MENU_HEADER_TEXT_COLOR_ACTIVE: StandardTextProps["colorScheme"] = "primary";
const MENU_HEADER_TEXT_VARIANT_ACTIVE: StandardTextProps["colorShade"] = "pure";
const MENU_HEADER_TEXT_COLOR_INACTIVE: StandardTextProps["colorScheme"] = "secondary";
const MENU_HEADER_TEXT_VARIANT_INACTIVE: StandardTextProps["colorShade"] = "text";

// Estilos de texto para submenús
const SUBMENU_TEXT_COLOR_ACTIVE: StandardTextProps["colorScheme"] = "primary";
const SUBMENU_TEXT_VARIANT_ACTIVE: StandardTextProps["colorShade"] = "pure";
const SUBMENU_TEXT_COLOR_INACTIVE: StandardTextProps["colorScheme"] = "secondary";
const SUBMENU_TEXT_VARIANT_INACTIVE: StandardTextProps["colorShade"] = "text";

// --- END: Variables de Configuración del Navbar ---

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

  const currentNavTokens: StandardNavbarTokens | null = useMemo(() => {
    if (!appColorTokens) {
      return generateStandardNavbarTokens(
        createAppColorTokens("blue", "light"),
        "light",
      );
    }
    return generateStandardNavbarTokens(appColorTokens, mode);
  }, [appColorTokens, mode]);

  const handleScroll = useCallback(() => {
    const offset = window.scrollY;
    if (offset > 20) {
      setScrolled(true);
    } else {
      setScrolled(false);
    }
  }, []);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (navRef.current && !navRef.current.contains(event.target as Node)) {
      setOpenSubmenu(null);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  const navItems: NavItem[] = useMemo(() => {
    if (!proyectoActual) {
      return [];
    }

    const baseItems: NavItem[] = [
      {
        id: "inicio",
        label: "Inicio",
        href: "/",
        icon: (isActive: boolean) => (
          <StandardIcon
            colorScheme={isActive ? "primary" : "neutral"}
            styleType={isActive ? "inverseStroke" : "outlineGradient"}
            className="mr-2"
            size="sm"
          >
            <Home />
          </StandardIcon>
        ),
      },
    ];

    if (proyectoActual.module_interviews) {
      baseItems.push({
        id: "entrevistas",
        label: "Entrevistas",
        href: "/entrevistas",
        icon: () => (
          <StandardIcon styleType="outlineGradient" className="mr-2" size="sm">
            <FileText />
          </StandardIcon>
        ),
        submenu: [
          {
            label: "Entrevistas",
            href: "/entrevistas",
            icon: () => (
              <StandardIcon styleType="outlineGradient" className="mr-2" size="sm">
                <MessageSquare />
              </StandardIcon>
            ),
          },
          {
            label: "Listado de Transcripciones",
            href: "/transcripciones",
            icon: () => (
              <StandardIcon styleType="outlineGradient" className="mr-2" size="sm">
                <FileSpreadsheet />
              </StandardIcon>
            ),
          },
          {
            label: "Matriz de Vaciado",
            href: "/entrevistas/matriz",
            icon: () => (
              <StandardIcon styleType="outlineGradient" className="mr-2" size="sm">
                <Layers className="h-4 w-4" />
              </StandardIcon>
            ),
          },
        ],
      });
    }

    if (proyectoActual.module_bibliography) {
      baseItems.push({
        id: "articulos",
        label: "Artículos",
        href: "/articulos",
        icon: () => (
          <StandardIcon styleType="outlineGradient" className="mr-2" size="sm">
            <BookOpen />
          </StandardIcon>
        ),
        submenu: [
          {
            label: "Preclasificación",
            href: "/articulos/preclasificacion",
            icon: () => (
              <StandardIcon styleType="outlineGradient" className="mr-2" size="sm">
                <LayoutDashboard className={NAV_ICON_SIZE} />
              </StandardIcon>
            ),
          },
        ],
      });
    }

    if (proyectoActual) {
      baseItems.push({
        id: "datos-maestros",
        label: "Datos Maestros",
        href: "/datos-maestros",
        icon: (isActive: boolean) => (
          <StandardIcon
            colorScheme={isActive ? "primary" : "neutral"}
            styleType={isActive ? "inverseStroke" : "outlineGradient"}
            className="mr-2"
            size="sm"
          >
            <Settings />
          </StandardIcon>
        ),
        submenu: [
          {
            label: "Miembros Proyecto",
            href: "/datos-maestros/miembros",
            icon: (isActive: boolean) => (
              <StandardIcon
                colorScheme={isActive ? "primary" : "neutral"}
                styleType={isActive ? "inverseStroke" : "outlineGradient"}
                className="mr-2"
                size="sm"
              >
                <UserPlus />
              </StandardIcon>
            ),
          },
          {
            label: "Roles Proyecto",
            href: "/datos-maestros/roles",
            icon: (isActive: boolean) => (
              <StandardIcon
                colorScheme={isActive ? "primary" : "neutral"}
                styleType={isActive ? "inverseStroke" : "outlineGradient"}
                className="mr-2"
                size="sm"
              >
                <ShieldCheck />
              </StandardIcon>
            ),
          },
          {
            label: "lotes",
            href: "/datos-maestros/lote",
            icon: () => (
              <StandardIcon styleType="outlineGradient" className="mr-2" size="sm">
                <Layers className="h-4 w-4" />
              </StandardIcon>
            ),
          },
          {
            label: "Dimensiones",
            href: "/datos-maestros/dimensiones",
            icon: () => (
              <StandardIcon styleType="outlineGradient" className="mr-2" size="sm">
                <LayoutGrid />
              </StandardIcon>
            ),
          },
        ],
      });
    }

    return baseItems;
  }, [proyectoActual]);

  if (!currentNavTokens) {
    return null;
  }

  const handleSubmenu = (item: string) => {
    if (openSubmenu === item) {
      setOpenSubmenu(null);
    } else {
      setOpenSubmenu(item);
    }
  };


  const MENU_RIPPLE_COLOR = currentNavTokens.active.bg;
  const SUBMENU_RIPPLE_COLOR = currentNavTokens.active.bg;

  const isSubmenuActive = (item: NavItem) => {
    if (!item.submenu) return false;
    return item.submenu.some(
      (subitem: NavSubItem) =>
        pathname === subitem.href ||
        (subitem.href !== "/" && pathname && pathname.startsWith(subitem.href))
    );
  };

  const toggleSubmenu = (label: string, e: React.MouseEvent) => {
    ripple(e.nativeEvent, MENU_RIPPLE_COLOR, NAVBAR_RIPPLE_SCALE);
    handleSubmenu(label);
  };

  const gradientBarStyle = {
    background: `linear-gradient(to right, ${currentNavTokens.gradientBar.start}, ${currentNavTokens.gradientBar.middle}, ${currentNavTokens.gradientBar.end})`,
  };

  const navBackgroundColor = scrolled
    ? currentNavTokens.background.scrolled
    : currentNavTokens.background.normal;

  const navBackgroundStyle = {
    backgroundColor: navBackgroundColor,
    boxShadow: scrolled ? currentNavTokens.shadow : "none",
    borderBottom: scrolled ? `1px solid ${currentNavTokens.submenu.border}` : "none",
    backdropFilter: scrolled ? "blur(8px)" : "none",
  };

  return (
    <>
      <motion.nav
        className={cn("sticky top-0 z-40 w-full transition-all")}
        style={navBackgroundStyle}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <motion.div
              className="flex items-center flex-shrink-0"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Link
                href="/"
                className="flex items-center gap-2"
                onMouseDown={(e) =>
                  ripple(e.nativeEvent, MENU_RIPPLE_COLOR, NAVBAR_RIPPLE_SCALE)
                }
              >
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
                      }}
                    >
                      Sustrato.ai
                    </span>
                  </div>
                  <StandardText
                    size="sm"
                    colorScheme="neutral"
                    colorShade="pure"
                    className="mt-0.5"
                  >
                    cultivando sinergias humano·AI
                  </StandardText>
                </div>
              </Link>
            </motion.div>

            <div className="hidden md:flex items-center space-x-3 lg:space-x-5">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href || item.label}
                  className="relative"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
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
                        whileTap={menuItemVariants.tap}
                      >
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
                          size="sm"
                        >
                          {item.label}
                        </StandardText>
                        <motion.div
                          variants={arrowVariants}
                          initial="closed"
                          animate={
                            openSubmenu === item.label ? "open" : "closed"
                          }
                          transition={{ duration: 0.2 }}
                        >
                          <StandardIcon
                            className="ml-1 transition-transform duration-200 ease-in-out"
                            size="sm"
                          >
                            <StandardIcon
                              className="ml-1"
                              size="xs"
                              colorScheme={pathname === item.href || isSubmenuActive(item) ? "primary" : "neutral"}
                              styleType={pathname === item.href || isSubmenuActive(item) ? "inverseStroke" : "outlineGradient"}
                            >
                              <ChevronDown />
                            </StandardIcon>
                          </StandardIcon>
                        </motion.div>
                      </motion.button>
                      <AnimatePresence>
                        {openSubmenu === item.label && (
                          <motion.div
                            className="absolute z-10 left-0 mt-2 w-56 origin-top-left rounded-md shadow-lg focus:outline-none"
                            style={{
                              backgroundColor: currentNavTokens.submenu.background,
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
                            data-submenu="content"
                          >
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
                                  whileTap={menuItemVariants.tap}
                                >
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
                                    }
                                  >
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
                                      size="sm"
                                    >
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
                      className="rounded-md"
                    >
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
                        }
                      >
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
                          size="sm"
                        >
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

            <div className="flex items-center flex-shrink-0">
              <div className="hidden md:flex items-center gap-3 lg:gap-4">
                <FontThemeSwitcher />
                <ThemeSwitcher />
                <UserAvatar />
              </div>

              <div className="md:hidden ml-2">
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
                    tooltip={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                  >
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
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden border-b"
              style={{
                backgroundColor: navBackgroundColor,
                borderColor: currentNavTokens.submenu.border,
                borderBottomWidth: currentNavTokens.submenu.border ? "1px" : "0",
                borderBottomStyle: currentNavTokens.submenu.border ? "solid" : "none",
              }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
                <div
                  className="flex justify-around items-center py-2 border-b mb-2"
                  style={{
                    borderColor: currentNavTokens.submenu.border,
                    borderTopWidth: currentNavTokens.submenu.border ? "1px" : "0",
                    borderTopStyle: currentNavTokens.submenu.border ? "solid" : "none",
                  }}
                >
                  <FontThemeSwitcher />
                  <ThemeSwitcher />
                </div>

                {navItems.map((item, index) => (
                  <motion.div
                    key={item.href || item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 + 0.1 }}
                  >
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
                          whileTap={{ scale: 0.98 }}
                        >
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
                              size="sm"
                            >
                              {item.label}
                            </StandardText>
                          </span>
                          <motion.div
                            variants={arrowVariants}
                            initial="closed"
                            animate={
                              openSubmenu === item.label ? "open" : "closed"
                            }
                            transition={{ duration: 0.2 }}
                          >
                            <StandardIcon
                              className="ml-1 transition-transform duration-200 ease-in-out"
                              size="xs"
                              colorScheme={pathname === item.href || isSubmenuActive(item) ? "primary" : "neutral"}
                              styleType={pathname === item.href || isSubmenuActive(item) ? "inverseStroke" : "outlineGradient"}
                            >
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
                              data-submenu="content"
                            >
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
                                  className="rounded-md"
                                >
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
                                    }
                                  >
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
                                      size="sm"
                                    >
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
                        className="rounded-md"
                      >
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
                          }
                        >
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
                            size="sm"
                           
                          >
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
                  className="pt-4 mt-2 border-t flex justify-center"
                  style={{
                    borderColor: currentNavTokens.submenu.border,
                    borderTopWidth: currentNavTokens.submenu.border ? "1px" : "0",
                    borderTopStyle: currentNavTokens.submenu.border ? "solid" : "none",
                  }}
                >
                  <UserAvatar />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
