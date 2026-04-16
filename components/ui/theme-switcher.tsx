"use client";

import { StandardDarkModeSwitcher } from "./StandardDarkModeSwitcher";
import { ColorSchemeSwitcher } from "./color-scheme-switcher";

export function ThemeSwitcher() {
	return (
		<div className="flex items-center gap-4">
			<ColorSchemeSwitcher />
			<StandardDarkModeSwitcher />
		</div>
	);
}
