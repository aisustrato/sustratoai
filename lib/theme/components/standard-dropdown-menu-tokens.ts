import type { AppColorTokens, Mode } from "../ColorToken";
import tinycolor from "tinycolor2";

export type DropdownMenuTokens = {
    content: {
        backgroundColor: string;
        borderColor: string;
        boxShadow: string;
    };
    item: {
        foregroundColor: string;
        backgroundColor: string;
        hoverBackgroundColor: string;
        disabledForegroundColor: string;
    };
    separator: {
        backgroundColor: string;
    };
    arrow: {
        fillColor: string;
    };
};

export function generateDropdownMenuTokens(appColorTokens: AppColorTokens, mode: Mode): DropdownMenuTokens {
    const isDark = mode === "dark";
    const neutral = appColorTokens.neutral;
    const primary = appColorTokens.primary;

    return {
        content: {
            backgroundColor: isDark ? neutral.bgShade : appColorTokens.white.bg,
            borderColor: isDark ? neutral.pureShade : neutral.bg,
            boxShadow: isDark 
                ? `0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)`
                : `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`,
        },
        item: {
            foregroundColor: neutral.text,
            backgroundColor: 'transparent',
            hoverBackgroundColor: isDark ? primary.bgShade : primary.bg,
            disabledForegroundColor: neutral.textShade,
        },
        separator: {
            backgroundColor: isDark ? neutral.pureShade : neutral.bg,
        },
        arrow: {
            fillColor: isDark ? neutral.pureShade : neutral.bg,
        },
    };
}