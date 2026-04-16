//. 📍 components/ui/StandardFileUpload.tsx

"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { UploadCloud, File, CheckCircle, AlertCircle } from "lucide-react";
import { useDesignTokens } from "@/app/providers/DesignTokensProvider";
import { cn } from "@/lib/utils";
import { StandardIcon } from "./StandardIcon";
import { StandardText } from "./StandardText";
import { StandardButton } from "./StandardButton";
import {
	type StandardFileUploadVariant,
	type StandardFileUploadTokens,
} from "@/lib/theme/components/standard-file-upload-tokens";

export interface StandardFileUploadProps {
	onFileSelect: (file: File) => void;
	accept?: string; // Ej: "audio/*,video/*,.pdf"
	maxSizeMB?: number;
	variant?: StandardFileUploadVariant;
	disabled?: boolean;
	className?: string;

	// Textos personalizables
	title?: string;
	description?: string;
	buttonText?: string;
}

export function StandardFileUpload({
	onFileSelect,
	accept,
	maxSizeMB = 50,
	variant = "primary",
	disabled = false,
	className,
	title = "Arrastra y suelta tu archivo aquí",
	description = `Soporta archivos hasta ${maxSizeMB}MB`,
	buttonText = "O selecciona un archivo",
}: StandardFileUploadProps) {
	const { tokens: designTokens } = useDesignTokens();
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Tokens precalculados
	const tokens: StandardFileUploadTokens | null =
		(designTokens?.fileUpload as StandardFileUploadTokens) || null;

	// Estilos dinámicos
	const currentStyles = useMemo(() => {
		if (!tokens)
			return { background: "", border: "", text: "", iconColor: "", ring: "" };

		if (disabled) return tokens.variants.disabled;

		// Si hay error, forzamos variante de error
		const effectiveVariant = error ? "error" : variant;

		return isDragging ?
				tokens.variants.active[effectiveVariant]
			:	tokens.variants.idle[effectiveVariant];
	}, [tokens, disabled, isDragging, variant, error]);

	const handleDragOver = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			if (!disabled) setIsDragging(true);
		},
		[disabled],
	);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	}, []);

	const validateFile = (file: File): boolean => {
		setError(null);

		// Validar tamaño
		if (file.size > maxSizeMB * 1024 * 1024) {
			setError(`El archivo excede el límite de ${maxSizeMB}MB.`);
			return false;
		}

		// Validar tipo (simple check)
		if (accept) {
			const acceptedTypes = accept.split(",").map((t) => t.trim());
			const fileType = file.type;
			const fileName = file.name;

			const isValid = acceptedTypes.some((type) => {
				if (type.endsWith("/*")) {
					const baseType = type.split("/")[0];
					return fileType.startsWith(baseType);
				}
				if (type.startsWith(".")) {
					return fileName.toLowerCase().endsWith(type.toLowerCase());
				}
				return fileType === type;
			});

			if (!isValid) {
				setError("Tipo de archivo no permitido.");
				return false;
			}
		}

		return true;
	};

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(false);

			if (disabled) return;

			const files = e.dataTransfer.files;
			if (files && files.length > 0) {
				const file = files[0];
				if (validateFile(file)) {
					setSelectedFile(file);
					onFileSelect(file);
				}
			}
		},
		[disabled, maxSizeMB, accept, onFileSelect, validateFile],
	);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (e.target.files && e.target.files.length > 0) {
				const file = e.target.files[0];
				if (validateFile(file)) {
					setSelectedFile(file);
					onFileSelect(file);
				}
			}
		},
		[maxSizeMB, accept, onFileSelect, validateFile],
	);

	const clearFile = (e: React.MouseEvent) => {
		e.stopPropagation();
		setSelectedFile(null);
		setError(null);
		if (inputRef.current) inputRef.current.value = "";
	};

	if (!tokens) return null; // Loading theme...

	return (
		<div
			className={cn(
				"relative flex flex-col items-center justify-center text-center p-8 cursor-pointer",
				className,
			)}
			style={{
				backgroundColor: currentStyles.background,
				borderColor: currentStyles.border,
				borderWidth: tokens.base.borderWidth,
				borderStyle: tokens.base.borderStyle as
					| "solid"
					| "dashed"
					| "dotted"
					| "double"
					| "none",
				borderRadius: tokens.base.borderRadius,
				transition: tokens.base.transition,
				color: currentStyles.text,
				boxShadow:
					isDragging && currentStyles.ring ?
						`0 0 0 4px ${currentStyles.ring}`
					:	"none",
			}}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			onClick={() => !disabled && inputRef.current?.click()}>
			<input
				ref={inputRef}
				type="file"
				className="hidden"
				accept={accept}
				onChange={handleInputChange}
				disabled={disabled}
			/>

			{/* Icono Central */}
			<div
				className="mb-4 transition-transform duration-300"
				style={{ transform: isDragging ? "scale(1.1)" : "scale(1)" }}>
				<StandardIcon
					size="xl"
					style={{
						fill: currentStyles.iconColor,
						stroke: currentStyles.iconColor,
					}}>
					{error ?
						<AlertCircle />
					: selectedFile ?
						<CheckCircle />
					:	<UploadCloud />}
				</StandardIcon>
			</div>

			{/* Contenido Texto */}
			<div className="space-y-2">
				{selectedFile ?
					<div className="animate-in fade-in slide-in-from-bottom-2">
						<StandardText
							weight="bold"
							size="lg"
							style={{ color: currentStyles.text }}>
							{selectedFile.name}
						</StandardText>
						<StandardText
							size="sm"
							style={{ color: currentStyles.text, opacity: 0.7 }}>
							{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
						</StandardText>
						<div className="mt-4">
							<StandardButton
								size="sm"
								colorScheme="danger"
								styleType="ghost"
								onClick={clearFile}>
								Eliminar archivo
							</StandardButton>
						</div>
					</div>
				:	<>
						<StandardText
							weight="medium"
							size="lg"
							style={{ color: currentStyles.text }}>
							{error || title}
						</StandardText>
						<StandardText
							size="sm"
							style={{ color: currentStyles.text, opacity: 0.7 }}>
							{error ? "Intenta con otro archivo." : description}
						</StandardText>

						{!disabled && (
							<div className="mt-4">
								<StandardButton
									size="sm"
									colorScheme={
										error ? "danger" : (
											(variant as
												| "primary"
												| "secondary"
												| "accent"
												| "success"
												| "warning"
												| "danger"
												| "neutral")
										)
									}
									styleType="subtle">
									{buttonText}
								</StandardButton>
							</div>
						)}
					</>
				}
			</div>
		</div>
	);
}
