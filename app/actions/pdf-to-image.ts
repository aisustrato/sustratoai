'use server'

import { createCanvas, Image as CanvasImage } from 'canvas'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs'

// Legacy build en Node.js: path absoluto al worker.
// Usamos string literal para evitar conflictos de tipos con imports de canvas.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(GlobalWorkerOptions as any).workerSrc =
  process.cwd() + '/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'

// Registrar Image de node-canvas globalmente para que pdfjs pueda usarlo
// en drawImage cuando renderiza imágenes embebidas del PDF.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any
g.Image = CanvasImage

/**
 * Convierte un PDF a array de imágenes PNG en base64.
 *
 * @param pdfBuffer - Contenido del PDF como ArrayBuffer
 * @param dpi - Resolución en DPI (default 150)
 * @returns Array de strings base64: data:image/png;base64,...
 */
export async function pdfToImages(
	pdfBuffer: ArrayBuffer,
	dpi: number = 150,
): Promise<string[]> {
	const scale = dpi / 72 // PDF usa 72 DPI base
	const pdf = await getDocument({ data: pdfBuffer }).promise
	const images: string[] = []

	for (let i = 1; i <= pdf.numPages; i++) {
		const page = await pdf.getPage(i)
		const viewport = page.getViewport({ scale })

		const canvas = createCanvas(viewport.width, viewport.height)
		// node-canvas context type differs from browser CanvasRenderingContext2D.
		// When canvasContext is used, canvas must be null per pdfjs docs.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const ctx = canvas.getContext('2d') as any

		await page.render({
			canvas: null,
			canvasContext: ctx,
			viewport,
		}).promise

		images.push(canvas.toDataURL('image/png'))
	}

	return images
}
