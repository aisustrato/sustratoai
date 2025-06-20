import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { StandardText } from "@/components/ui/StandardText";
import { LucideIcon } from "lucide-react";
import { StandardIcon } from "@/components/ui/StandardIcon";
import tinycolor from "tinycolor2";
import { useRipple } from "@/components/ripple/RippleProvider";
import type { AppColorTokens } from "@/lib/theme/ColorToken";

interface SidebarNavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  disabled?: boolean;
}

interface SidebarNavAnimationsProps {
  items: SidebarNavItem[];
  activeHref: string;
  hoverStyles: React.CSSProperties;
  appColorTokens: AppColorTokens;
}

const SIDEBAR_RIPPLE_SCALE = 9;

export function SidebarNavAnimations({ items, activeHref, hoverStyles, appColorTokens }: SidebarNavAnimationsProps) {
  const ripple = useRipple();

  return (
    <nav className={cn("flex flex-col space-y-1")}>
      {items.map((item, idx) => {
        const Icon = item.icon;
        const isActive = activeHref === item.href || (activeHref && activeHref.startsWith(`${item.href}/`));

        if (item.disabled) {
          return (
            <div
              key={item.href}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md opacity-70 cursor-not-allowed transition-colors duration-200"
              style={{ backgroundColor: appColorTokens.accent.bg }}
            >
              {Icon && (
                <StandardIcon
                  colorScheme="neutral"
                  colorShade="subtle"
                  styleType="solid"
                  className="w-5 h-5 mr-2"
                >
                  <Icon />
                </StandardIcon>
              )}
              <StandardText colorScheme="neutral" colorShade="textShade">{item.title}</StandardText>
            </div>
          );
        }

        return (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.04 }}
            whileHover={{
              scale: 1.02,
              backgroundColor: isActive
                ? tinycolor(appColorTokens.tertiary.pure).setAlpha(0.35).toRgbString()
                : appColorTokens.accent.bgShade,
              transition: { duration: 0.18 },
            }}
            whileTap={{ scale: 0.97 }}
            onMouseDown={(e) => {
              const rippleColor = isActive
                ? appColorTokens.tertiary.pure
                : appColorTokens.accent.pure;
              ripple(e.nativeEvent, rippleColor, SIDEBAR_RIPPLE_SCALE);
            }}
            style={{ borderRadius: 8, cursor: "pointer" }}
          >
            <Link
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200"
              )}
              style={{
                ...hoverStyles,
                backgroundColor: isActive
                  ? tinycolor(appColorTokens.tertiary.pure).setAlpha(0.15).toRgbString()
                  : "transparent",
              }}
            >
              {Icon && (
                <StandardIcon
                  colorScheme="tertiary"
                  styleType={isActive ? "inverseStroke" : "outlineGradient"}
                  className="w-5 h-5 mr-2"
                >
                  <Icon />
                </StandardIcon>
              )}
              <StandardText
                preset={isActive ? "subtitle" : "body"}
                colorScheme={isActive ? "tertiary" : "neutral"}
                colorShade={isActive ? "pure" : "text"}
                className={cn(
                  "transition-colors duration-200",
                  isActive ? "font-medium" : "font-normal"
                )}
              >
                {item.title}
              </StandardText>
            </Link>
          </motion.div>
        );
      })}
    </nav>
  );
}