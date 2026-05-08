'use server'

import { createCanvas } from 'canvas'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf')

// Server-side no necesita worker
pdfjsLib.GlobalWorkerOptions.workerSrc = ''

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
	const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise
	const images: string[] = []

	for (let i = 1; i <= pdf.numPages; i++) {
		const page = await pdf.getPage(i)
		const viewport = page.getViewport({ scale })

		const canvas = createCanvas(viewport.width, viewport.height)
		const ctx = canvas.getContext('2d')

		await page.render({
			canvasContext: ctx,
			viewport,
		}).promise

		images.push(canvas.toDataURL('image/png'))
	}

	return images
}
