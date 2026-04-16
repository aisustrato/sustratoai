// 📍 components/ui/StandardButtonEnhanced.tsx (v1.0 - Con Persistencia Local)
// 🎯 PROPÓSITO: Botón mejorado con persistencia de preferencias visuales
// 🔧 ARQUITECTURA: Extiende StandardButton con preferencias guardadas
// 🌸 FILOSOFÍA: Botones que recuerdan tu estilo preferido

"use client";
import * as React from "react";
import { useMemo } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { useUIPreferences } from "@/hooks/useLocalStorage";
import { StandardButton } from "./StandardButton";
import { StandardIconEnhanced } from "./StandardIconEnhanced";
import type {
	StandardButtonStyleType,
	StandardButtonModifier,
	StandardButtonSize,
	StandardButtonRounded,
} from "@/lib/theme/components/standard-button-tokens";
import type { ColorSchemeVariant } from "@/lib/theme/ColorToken";

export interface StandardButtonEnhancedProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
	children?: React.ReactNode;
	styleType?: StandardButtonStyleType;
	modifiers?: StandardButtonModifier[];
	colorScheme?: ColorSchemeVariant;
	leftIcon?: React.ComponentType<any>;
	rightIcon?: React.ComponentType<any>;
	leftEmoji?: string;
	rightEmoji?: string;
	loading?: boolean;
	loadingText?: string;
	size?: StandardButtonSize;
	rounded?: StandardButtonRounded;
	fullWidth?: boolean;
	iconOnly?: boolean;
	tooltip?: string | React.ReactNode;
	disableRipple?: boolean;
	
	// 💾 PERSISTENCIA
	persistPreferences?: boolean;
	
	// 🎨 CONTROL MANUAL
	forceStyleType?: StandardButtonStyleType;
	forceColorScheme?: ColorSchemeVariant;
	forceSize?: StandardButtonSize;
}

export function StandardButtonEnhanced({
	asChild = false,
	children,
	styleType,
	modifiers,
	colorScheme,
	leftIcon,
	rightIcon,
	leftEmoji,
	rightEmoji,
	loading = false,
	loadingText,
	size,
	rounded,
	fullWidth = false,
	iconOnly = false,
	tooltip,
	disableRipple = false,
	persistPreferences = true,
	forceStyleType,
	forceColorScheme,
	forceSize,
	className,
	...props
}: StandardButtonEnhancedProps) {
	// 💾 Preferencias del usuario
	const { preferences } = useUIPreferences();
	
	// 🎨 Determinar estilos basados en preferencias
	const finalStyleType = useMemo(() => {
		if (forceStyleType) return forceStyleType;
		if (styleType) return styleType;
		if (persistPreferences) return (preferences.buttonStyleType as StandardButtonStyleType) || 'solid';
		return 'solid';
	}, [forceStyleType, styleType, preferences.buttonStyleType, persistPreferences]);

	const finalColorScheme = useMemo(() => {
		if (forceColorScheme) return forceColorScheme;
		if (colorScheme) return colorScheme;
		if (persistPreferences) return (preferences.buttonColorScheme as ColorSchemeVariant) || 'primary';
		return 'primary';
	}, [forceColorScheme, colorScheme, preferences.buttonColorScheme, persistPreferences]);

	const finalSize = useMemo(() => {
		if (forceSize) return forceSize;
		if (size) return size;
		if (persistPreferences) return (preferences.buttonSize as StandardButtonSize) || 'md';
		return 'md';
	}, [forceSize, size, preferences.buttonSize, persistPreferences]);

	// 🎭 Convertir iconos a emojis si está en modo emoji
	const EnhancedLeftIcon = useMemo(() => {
		if (leftEmoji) {
			return () => <StandardIconEnhanced emoji={leftEmoji} size={finalSize} />;
		}
		return leftIcon;
	}, [leftEmoji, leftEmoji, finalSize]);

	const EnhancedRightIcon = useMemo(() => {
		if (rightEmoji) {
			return () => <StandardIconEnhanced emoji={rightEmoji} size={finalSize} />;
		}
		return rightIcon;
	}, [rightEmoji, rightEmoji, finalSize]);

	// 🎨 RENDERIZAR BOTÓN MEJORADO
	return (
		<StandardButton
			asChild={asChild}
			children={children}
			styleType={finalStyleType}
			modifiers={modifiers}
			colorScheme={finalColorScheme}
			leftIcon={EnhancedLeftIcon}
			rightIcon={EnhancedRightIcon}
			loading={loading}
			loadingText={loadingText}
			size={finalSize}
			rounded={rounded}
			fullWidth={fullWidth}
			iconOnly={iconOnly}
			tooltip={tooltip}
			disableRipple={disableRipple}
			className={className}
			{...props}
		/>
	);
}

// 🎯 PANEL DE PREFERENCIAS DE BOTONES
export function ButtonPreferencesPanel({
	className,
	onPreferencesChange,
}: {
	className?: string;
	onPreferencesChange?: (prefs: any) => void;
}) {
	const { preferences, updatePreference } = useUIPreferences();

	const handleStyleTypeChange = (styleType: StandardButtonStyleType) => {
		updatePreference('buttonStyleType', styleType);
		onPreferencesChange?.({ ...preferences, buttonStyleType: styleType });
	};

	const handleColorSchemeChange = (colorScheme: ColorSchemeVariant) => {
		updatePreference('buttonColorScheme', colorScheme);
		onPreferencesChange?.({ ...preferences, buttonColorScheme: colorScheme });
	};

	const handleSizeChange = (size: StandardButtonSize) => {
		updatePreference('buttonSize', size);
		onPreferencesChange?.({ ...preferences, buttonSize: size });
	};

	const styleTypes: StandardButtonStyleType[] = ['solid', 'outline', 'subtle', 'ghost'];
	const colorSchemes: ColorSchemeVariant[] = ['primary', 'secondary', 'accent', 'neutral', 'danger', 'warning', 'success'];
	const sizes: StandardButtonSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

	return (
		<div className={cn("p-4 space-y-4 border rounded-lg bg-white", className)}>
			<h3 className="text-sm font-medium text-neutral-900">Preferencias de Botones</h3>
			
			{/* Style Type */}
			<div>
				<label className="text-xs font-medium text-neutral-700 mb-2 block">Estilo</label>
				<div className="flex flex-wrap gap-2">
					{styleTypes.map((type) => (
						<StandardButtonEnhanced
							key={type}
							size="xs"
							styleType={type}
							colorScheme="primary"
							onClick={() => handleStyleTypeChange(type)}
							className={preferences.buttonStyleType === type ? 'ring-2 ring-primary-500' : ''}
						>
							{type}
						</StandardButtonEnhanced>
					))}
				</div>
			</div>

			{/* Color Scheme */}
			<div>
				<label className="text-xs font-medium text-neutral-700 mb-2 block">Color</label>
				<div className="flex flex-wrap gap-2">
					{colorSchemes.map((scheme) => (
						<StandardButtonEnhanced
							key={scheme}
							size="xs"
							colorScheme={scheme}
							onClick={() => handleColorSchemeChange(scheme)}
							className={preferences.buttonColorScheme === scheme ? 'ring-2 ring-primary-500' : ''}
						>
							{scheme}
						</StandardButtonEnhanced>
					))}
				</div>
			</div>

			{/* Size */}
			<div>
				<label className="text-xs font-medium text-neutral-700 mb-2 block">Tamaño</label>
				<div className="flex flex-wrap gap-2">
					{sizes.map((size) => (
						<StandardButtonEnhanced
							key={size}
							size={size}
							colorScheme="primary"
							onClick={() => handleSizeChange(size)}
							className={preferences.buttonSize === size ? 'ring-2 ring-primary-500' : ''}
						>
							{size}
						</StandardButtonEnhanced>
					))}
				</div>
			</div>
		</div>
	);
}

export default StandardButtonEnhanced;
