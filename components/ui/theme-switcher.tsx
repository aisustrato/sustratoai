"use client";

import { DarkModeSwitcher } from "./dark-mode-switcher";
import { ColorSchemeSwitcher } from "./color-scheme-switcher";

export function ThemeSwitcher() {
  return (
    <div className="flex items-center gap-4">
      <ColorSchemeSwitcher />
      <DarkModeSwitcher />
    </div>
  );
}
