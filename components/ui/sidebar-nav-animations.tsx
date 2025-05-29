import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Text } from "@/components/ui/text";
import { LucideIcon } from "lucide-react";

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
  appColorTokens: any;
}

export function SidebarNavAnimations({ items, activeHref, hoverStyles, appColorTokens }: SidebarNavAnimationsProps) {
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
                <Icon
                  className="w-5 h-5 mr-2 transition-colors duration-200"
                  style={{ color: appColorTokens.neutral.textShade }}
                />
              )}
              <Text variant="muted">{item.title}</Text>
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
                ? appColorTokens.primary.bg
                : appColorTokens.accent.bgShade,
              transition: { duration: 0.18 },
            }}
            whileTap={{ scale: 0.97 }}
            style={{ borderRadius: 8, cursor: "pointer" }}
          >
            <Link
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                isActive ? "bg-[var(--active-bg)]" : "bg-transparent"
              )}
              style={hoverStyles}
            >
              {Icon && (
                <Icon
                  className="w-5 h-5 mr-2 transition-colors duration-200"
                  style={{
                    color: isActive
                      ? appColorTokens.primary.pure
                      : appColorTokens.neutral.text,
                  }}
                />
              )}
              <Text
                variant={isActive ? "subtitle" : "default"}
                color={isActive ? "primary" : "neutral"}
                colorVariant={isActive ? "pure" : "text"}
                className={cn(
                  "transition-colors duration-200",
                  isActive ? "font-medium" : "font-normal"
                )}
              >
                {item.title}
              </Text>
            </Link>
          </motion.div>
        );
      })}
    </nav>
  );
}
