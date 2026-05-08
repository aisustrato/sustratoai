// 📍 lib/papers/image-utils.ts
// Utilidades para manejo de imágenes en papers

/**
 * Sanitiza nombre de archivo para Storage
 * Quita acentos, caracteres especiales, espacios
 * 
 * @example
 * sanitizeImageFilename("Gráfico 1 - Análisis.png")
 * // → "Grafico_1_Analisis.png"
 */
export function sanitizeImageFilename(filename: string): string {
	// Separar nombre y extensión
	const lastDotIndex = filename.lastIndexOf(".");
	const name = lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename;
	const ext = lastDotIndex > 0 ? filename.slice(lastDotIndex) : "";

	// Sanitizar nombre
	const sanitizedName = name
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "") // Quitar acentos
		.replace(/[^a-zA-Z0-9._-]/g, "_") // Solo alfanuméricos, punto, guion, underscore
		.replace(/_{2,}/g, "_") // Múltiples underscores → uno solo
		.replace(/^_+|_+$/g, ""); // Quitar underscores al inicio/fin

	// Sanitizar extensión (mantener punto)
	const sanitizedExt = ext
		.toLowerCase()
		.replace(/[^a-z0-9.]/g, "");

	return sanitizedName + sanitizedExt;
}

/**
 * Genera path de storage para una imagen de paper
 * 
 * @param paperId - UUID del paper
 * @param filename - Nombre del archivo (ya sanitizado)
 * @returns Path completo para Supabase Storage
 * 
 * @example
 * generateImageStoragePath("abc-123", "figura_1.png")
 * // → "abc-123/figura_1.png"
 */
export function generateImageStoragePath(
	paperId: string,
	filename: string,
): string {
	return `${paperId}/${filename}`;
}

/**
 * Genera path de storage para PDF original
 * 
 * @param paperId - UUID del paper
 * @param filename - Nombre del archivo PDF (ya sanitizado)
 * @returns Path completo para Supabase Storage
 * 
 * @example
 * generatePdfStoragePath("abc-123", "mi_paper.pdf")
 * // → "pdf-originals/abc-123/mi_paper.pdf"
 */
export function generatePdfStoragePath(
	paperId: string,
	filename: string,
): string {
	return `pdf-originals/${paperId}/${filename}`;
}

/**
 * Valida tipo MIME de imagen
 * 
 * @param mimeType - Tipo MIME a validar
 * @returns true si es un tipo de imagen permitido
 */
export function isValidImageMimeType(mimeType: string): boolean {
	const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
	return allowedTypes.includes(mimeType.toLowerCase());
}

/**
 * Valida tamaño de archivo de imagen
 * 
 * @param sizeInBytes - Tamaño del archivo en bytes
 * @param maxSizeMB - Tamaño máximo permitido en MB (default: 10)
 * @returns true si el tamaño es válido
 */
export function isValidImageSize(
	sizeInBytes: number,
	maxSizeMB: number = 10,
): boolean {
	const maxBytes = maxSizeMB * 1024 * 1024;
	return sizeInBytes > 0 && sizeInBytes <= maxBytes;
}

/**
 * Extrae placeholders de imágenes del markdown
 * 
 * @param markdown - Contenido markdown
 * @returns Array de placeholders detectados
 * 
 * @example
 * extractImagePlaceholders("![alt](image.png)")
 * // → [{ position: 1, fullMatch: "![alt](image.png)", altText: "alt", src: "image.png" }]
 */
export function extractImagePlaceholders(markdown: string): Array<{
	position: number;
	fullMatch: string;
	altText: string;
	src: string;
}> {
	const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
	const placeholders: Array<{
		position: number;
		fullMatch: string;
		altText: string;
		src: string;
	}> = [];

	let match;
	let position = 0;

	while ((match = imageRegex.exec(markdown)) !== null) {
		position++;
		placeholders.push({
			position,
			fullMatch: match[0],
			altText: match[1] || "",
			src: match[2] || "",
		});
	}

	return placeholders;
}

/**
 * Reemplaza un placeholder de imagen en el markdown
 * 
 * @param markdown - Contenido markdown original
 * @param oldPlaceholder - Placeholder a reemplazar (ej: "![](image_0.png)")
 * @param newAltText - Nuevo texto alternativo
 * @param newUrl - Nueva URL de la imagen
 * @returns Markdown actualizado
 * 
 * @example
 * replacePlaceholder(
 *   "![](image_0.png)",
 *   "![](image_0.png)",
 *   "Gráfico de resultados",
 *   "https://..."
 * )
 * // → "![Gráfico de resultados](https://...)"
 */
export function replacePlaceholder(
	markdown: string,
	oldPlaceholder: string,
	newAltText: string,
	newUrl: string,
): string {
	const newPlaceholder = `![${newAltText}](${newUrl})`;
	return markdown.replace(oldPlaceholder, newPlaceholder);
}

/**
 * Obtiene dimensiones de una imagen desde un File object
 * 
 * @param file - Archivo de imagen
 * @returns Promise con width y height, o null si falla
 */
export function getImageDimensions(
	file: File,
): Promise<{ width: number; height: number } | null> {
	return new Promise((resolve) => {
		if (!file.type.startsWith("image/")) {
			resolve(null);
			return;
		}

		const img = new Image();
		const url = URL.createObjectURL(file);

		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve({
				width: img.naturalWidth,
				height: img.naturalHeight,
			});
		};

		img.onerror = () => {
			URL.revokeObjectURL(url);
			resolve(null);
		};

		img.src = url;
	});
}

/**
 * Calcula SHA-256 de un archivo
 * 
 * @param file - Archivo a hashear
 * @returns Promise con hash en hexadecimal
 */
export async function calculateFileSHA256(file: File): Promise<string> {
	const arrayBuffer = await file.arrayBuffer();
	const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
	return hashHex;
}

/**
 * Formatea tamaño de archivo para mostrar al usuario
 * 
 * @param bytes - Tamaño en bytes
 * @returns String formateado (ej: "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Valida extensión de archivo de imagen
 * 
 * @param filename - Nombre del archivo
 * @returns true si la extensión es válida
 */
export function hasValidImageExtension(filename: string): boolean {
	const validExtensions = [".jpg", ".jpeg", ".png", ".webp"];
	const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
	return validExtensions.includes(ext);
}
