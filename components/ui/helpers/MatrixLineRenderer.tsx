import React from 'react';

interface MatrixLineRendererProps {
	content: string;
	className?: string;
}

export function MatrixLineRenderer({ content, className }: MatrixLineRendererProps) {
	const renderLineMatrix = React.useMemo(() => {
		if (!content) return '';

		const lines = content.split('\n');
		
		return lines.map((line, index) => {
			const trimmedLine = line.trim();
			
			// LÍNEA VACÍA
			if (!trimmedLine) {
				return `<div data-line="${index}" class="matrix-line empty-line" style="min-height: 1.5rem; margin: 0.25rem 0;"><br/></div>`;
			}

			// TÍTULOS
			if (trimmedLine.startsWith('# ')) {
				const text = processInlineMarkdown(trimmedLine.slice(2));
				return `<h1 data-line="${index}" class="matrix-line text-2xl font-bold mt-6 mb-4 text-gray-900">${text}</h1>`;
			}
			
			if (trimmedLine.startsWith('## ')) {
				const text = processInlineMarkdown(trimmedLine.slice(3));
				return `<h2 data-line="${index}" class="matrix-line text-xl font-bold mt-5 mb-3 text-gray-900">${text}</h2>`;
			}
			
			if (trimmedLine.startsWith('### ')) {
				const text = processInlineMarkdown(trimmedLine.slice(4));
				return `<h3 data-line="${index}" class="matrix-line text-lg font-bold mt-4 mb-2 text-gray-900">${text}</h3>`;
			}

			// LISTAS NO ORDENADAS
			if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
				const text = processInlineMarkdown(trimmedLine.slice(2));
				return `<div data-line="${index}" class="matrix-line list-item flex items-start my-1">
					<span class="text-gray-600 mr-2 mt-0.5">•</span>
					<span>${text}</span>
				</div>`;
			}

			// LISTAS ORDENADAS
			if (/^\d+\.\s/.test(trimmedLine)) {
				const match = trimmedLine.match(/^(\d+)\.\s(.*)$/);
				if (match) {
					const [, number, text] = match;
					const processedText = processInlineMarkdown(text);
					return `<div data-line="${index}" class="matrix-line list-item flex items-start my-1">
						<span class="text-gray-600 mr-2 mt-0.5">${number}.</span>
						<span>${processedText}</span>
					</div>`;
				}
			}

			// BLOCKQUOTES
			if (trimmedLine.startsWith('> ')) {
				const text = processInlineMarkdown(trimmedLine.slice(2));
				return `<blockquote data-line="${index}" class="matrix-line border-l-4 border-gray-300 pl-4 my-2 italic text-gray-700">${text}</blockquote>`;
			}

			// SEPARADORES
			if (trimmedLine === '---') {
				return `<hr data-line="${index}" class="matrix-line border-gray-300 my-4" />`;
			}

			// PÁRRAFO NORMAL
			const processedText = processInlineMarkdown(trimmedLine);
			return `<p data-line="${index}" class="matrix-line my-2 text-gray-800 leading-relaxed">${processedText}</p>`;
			
		}).join('\n');
	}, [content]);

	return (
		<div 
			className={className}
			dangerouslySetInnerHTML={{ __html: renderLineMatrix }}
		/>
	);
}

// Procesar markdown inline manteniendo la estructura
function processInlineMarkdown(text: string): string {
	return text
		// **bold**
		.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
		// *italic*
		.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic">$1</em>')
		// <mark>highlight</mark>
		.replace(/<mark>(.*?)<\/mark>/g, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
		// [text](url)
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline">$1</a>')
		// `code`
		.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
		// Escapar HTML básico
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		// Restaurar los tags que procesamos
		.replace(/&lt;(\/?(strong|em|mark|a|code).*?)&gt;/g, '<$1>');
}
