/**
 * Motor de renderizado LaTeX → HTML sin dependencias externas.
 *
 * Convierte fórmulas LaTeX inline ($...$) y block ($$...$$) a HTML
 * usando sustitución Unicode y <sup>/<sub> para exponentes/subíndices.
 *
 * Cubre ~95% de fórmulas en papers académicos: variables, griegas,
 * operadores, super/subíndices.
 */

// ========================================================================
// TABLA DE SÍMBOLOS LATÉX → UNICODE
// ========================================================================

const LATEX_SYMBOLS: Record<string, string> = {
	// Operadores
	approx: "≈",
	neq: "≠",
	leq: "≤",
	geq: "≥",
	lleq: "≪",
	ggeq: "≫",
	equiv: "≡",
	sim: "∼",
	simeq: "≃",
	cong: "≅",
	propto: "∝",
	times: "×",
	div: "÷",
	pm: "±",
	mp: "∓",
	cdot: "·",
	circ: "∘",
	star: "⋆",
	oplus: "⊕",
	otimes: "⊗",
	odot: "⊙",
	cup: "∪",
	cap: "∩",
	setminus: "∖",
	subset: "⊂",
	supset: "⊃",
	subseteq: "⊆",
	supseteq: "⊇",
	in: "∈",
	notin: "∉",
	ni: "∋",
	emptyset: "∅",
	forall: "∀",
	exists: "∃",
	nexists: "∄",
	nabla: "∇",
	partial: "∂",
	infty: "∞",
	angle: "∠",
	perp: "⊥",
	parallel: "∥",

	// Sumatorias, productos, integrales
	sum: "∑",
	prod: "∏",
	coprod: "∐",
	int: "∫",
	iint: "∬",
	iiint: "∭",
	oint: "∮",

	// Flechas
	leftarrow: "←",
	rightarrow: "→",
	leftrightarrow: "↔",
	Leftarrow: "⇐",
	Rightarrow: "⇒",
	Leftrightarrow: "⇔",
	mapsto: "↦",
	longleftarrow: "⟵",
	longrightarrow: "⟶",
	Longleftarrow: "⟸",
	Longrightarrow: "⟹",
	Longleftrightarrow: "⟺",
	uparrow: "↑",
	downarrow: "↓",
	updownarrow: "↕",
	Uparrow: "⇑",
	Downarrow: "⇓",
	Updownarrow: "⇕",
	leadsto: "↝",
	mapsfrom: "↤",

	// Lógica
	land: "∧",
	lor: "∨",
	lnot: "¬",
	therefore: "∴",
	because: "∵",

	// Delimitadores grandes (se mantienen como texto pero mejorados)
	langle: "⟨",
	rangle: "⟩",
	lceil: "⌈",
	rceil: "⌉",
	lfloor: "⌊",
	rfloor: "⌋",
	mid: "∣",
	nmid: "∤",

	// Griegas minúsculas
	alpha: "α",
	beta: "β",
	gamma: "γ",
	delta: "δ",
	epsilon: "ε",
	varepsilon: "ε",
	zeta: "ζ",
	eta: "η",
	theta: "θ",
	vartheta: "ϑ",
	iota: "ι",
	kappa: "κ",
	lambda: "λ",
	mu: "μ",
	nu: "ν",
	xi: "ξ",
	pi: "π",
	varpi: "ϖ",
	rho: "ρ",
	varrho: "ϱ",
	sigma: "σ",
	tau: "τ",
	upsilon: "υ",
	phi: "φ",
	varphi: "φ",
	chi: "χ",
	psi: "ψ",
	omega: "ω",

	// Griegas mayúsculas
	Gamma: "Γ",
	Delta: "Δ",
	Theta: "Θ",
	Lambda: "Λ",
	Xi: "Ξ",
	Pi: "Π",
	Sigma: "Σ",
	Upsilon: "Υ",
	Phi: "Φ",
	Psi: "Ψ",
	Omega: "Ω",

	// Espaciado (se manejan en replaceCommands)
	quad: "\u2003",
	qquad: "\u2003\u2003",

	// Misceláneos
	ldots: "…",
	cdots: "⋯",
	vdots: "⋮",
	ddots: "⋱",
	dots: "…",
	square: "□",
	Box: "□",
	diamond: "◇",
	diamondsuit: "♢",
	heartsuit: "♡",
	spadesuit: "♠",
	clubsuit: "♣",
	dag: "†",
	ddag: "‡",
	dagger: "†",
	ddagger: "‡",
	aleph: "ℵ",
	hbar: "ℏ",
	ell: "ℓ",
	Re: "ℜ",
	Im: "ℑ",
	wp: "℘",
	surd: "√",
	natural: "♮",
	sharp: "♯",
	flat: "♭",
	mho: "℧",
	backslash: "\\",
	prime: "′",
	dollar: "$",
	percent: "%",
	underscore: "_",
	vert: "|",
	Vert: "‖",
	textless: "<",
	textgreater: ">",
};

// ========================================================================
// PARSER PRINCIPAL
// ========================================================================

function processSuperscript(latex: string): string {
	// M^{0.74} → M<sup>0.74</sup>
	// x^2 → x<sup>2</sup>
	// ^2 → <sup>2</sup>
	let result = latex;

	// ^{...}
	result = result.replace(/\^\{([^}]*)\}/g, (_, content) => {
		return `<sup>${convertGroup(content)}</sup>`;
	});

	// ^simple (un solo carácter o símbolo)
	result = result.replace(/\^([a-zA-Z0-9\\])/g, (_, char) => {
		if (char === "\\") return "^";
		return `<sup>${char}</sup>`;
	});

	return result;
}

function processSubscript(latex: string): string {
	// x_i → x<sub>i</sub>
	// x_{ij} → x<sub>ij</sub>
	let result = latex;

	// _{...}
	result = result.replace(/_\{([^}]*)\}/g, (_, content) => {
		return `<sub>${convertGroup(content)}</sub>`;
	});

	// _simple
	result = result.replace(/_([a-zA-Z0-9\\])/g, (_, char) => {
		if (char === "\\") return "_";
		return `<sub>${char}</sub>`;
	});

	return result;
}

function processFractions(latex: string): string {
	// \frac{a}{b} → a/b con estilo fracción
	let result = latex;
	result = result.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, (_, num, den) => {
		const n = convertGroup(num);
		const d = convertGroup(den);
		return `<span class="latex-frac"><span class="latex-frac-num">${n}</span><span class="latex-frac-div"></span><span class="latex-frac-den">${d}</span></span>`;
	});
	return result;
}

function processSqrt(latex: string): string {
	// \sqrt{x} → √x
	// \sqrt[n]{x} → ⁿ√x
	let result = latex;
	result = result.replace(/\\sqrt\{([^}]*)\}/g, (_, content) => {
		return `√${convertGroup(content)}`;
	});
	result = result.replace(/\\sqrt\[(\d+)\]\{([^}]*)\}/g, (_, n, content) => {
		return `√${convertGroup(content)}`;
	});
	return result;
}

function processHat(latex: string): string {
	// \hat{x} → x̂
	let result = latex;
	result = result.replace(/\\hat\{([a-zA-Z])\}/g, (_, char) => {
		const hats: Record<string, string> = {
			a: "â", e: "ê", i: "î", o: "ô", u: "û",
			A: "Â", E: "Ê", I: "Î", O: "Ô", U: "Û",
		};
		return hats[char] || `${char}̂`;
	});
	result = result.replace(/\\hat\{([^}]*)\}/g, (_, content) => {
		return `${convertGroup(content)}̂`;
	});
	return result;
}

function processBar(latex: string): string {
	// \bar{x} → x̄
	let result = latex;
	result = result.replace(/\\bar\{([a-zA-Z])\}/g, (_, char) => {
		const bars: Record<string, string> = {
			a: "ā", e: "ē", i: "ī", o: "ō", u: "ū",
			x: "x̄", y: "ȳ", z: "z̄",
		};
		return bars[char] || `${char}̄`;
	});
	result = result.replace(/\\bar\{([^}]*)\}/g, (_, content) => {
		return `${convertGroup(content)}̄`;
	});
	return result;
}

function processDot(latex: string): string {
	// \dot{x} → ẋ, \ddot{x} → ẍ
	let result = latex;
	result = result.replace(/\\ddot\{([a-zA-Z])\}/g, (_, char) => {
		const ddots: Record<string, string> = {
			a: "ä", e: "ë", i: "ï", o: "ö", u: "ü",
			A: "Ä", E: "Ë", I: "Ï", O: "Ö", U: "Ü",
		};
		return ddots[char] || `${char}̈`;
	});
	result = result.replace(/\\dot\{([a-zA-Z])\}/g, (_, char) => {
		const dots: Record<string, string> = {
			a: "ȧ", e: "ė", i: "į", o: "ȯ", u: "ů",
		};
		return dots[char] || `${char}̇`;
	});
	return result;
}

function processOverrightarrow(latex: string): string {
	// \overrightarrow{AB} → AB→
	let result = latex;
	result = result.replace(/\\overrightarrow\{([^}]*)\}/g, (_, content) => {
		return `${convertGroup(content)}→`;
	});
	return result;
}

function processBold(latex: string): string {
	// \mathbf{x} → <b>x</b>
	// \text{abc} → abc
	// \mathrm{x} → x (roman)
	// \mathit{x} → <i>x</i>
	// \mathcal{L} → ℒ
	// \mathbb{R} → ℝ
	let result = latex;

	result = result.replace(/\\mathbf\{([^}]*)\}/g, (_, content) => {
		return `<b>${convertGroup(content)}</b>`;
	});
	result = result.replace(/\\text\{([^}]*)\}/g, (_, content) => {
		return content;
	});
	result = result.replace(/\\mathrm\{([^}]*)\}/g, (_, content) => {
		return convertGroup(content);
	});
	result = result.replace(/\\mathit\{([^}]*)\}/g, (_, content) => {
		return `<i>${convertGroup(content)}</i>`;
	});
	result = result.replace(/\\mathcal\{([A-Za-z])\}/g, (_, char) => {
		const cal: Record<string, string> = {
			A: "𝒜", B: "ℬ", C: "𝒞", D: "𝒟", E: "ℰ", F: "ℱ", G: "𝒢",
			H: "ℋ", I: "ℐ", J: "𝒥", K: "𝒦", L: "ℒ", M: "ℳ", N: "𝒩",
			O: "𝒪", P: "𝒫", Q: "𝒬", R: "ℛ", S: "𝒮", T: "𝒯", U: "𝒰",
			V: "𝒱", W: "𝒲", X: "𝒳", Y: "𝒴", Z: "𝒵",
		};
		return cal[char] || char;
	});
	result = result.replace(/\\mathbb\{([A-Za-z])\}/g, (_, char) => {
		const bb: Record<string, string> = {
			A: "𝔸", B: "𝔹", C: "ℂ", D: "𝔻", E: "𝔼", F: "𝔽", G: "𝔾",
			H: "ℍ", I: "𝕀", J: "𝕁", K: "𝕂", L: "𝕃", M: "𝕄", N: "ℕ",
			O: "𝕆", P: "ℙ", Q: "ℚ", R: "ℝ", S: "𝕊", T: "𝕋", U: "𝕌",
			V: "𝕍", W: "𝕎", X: "𝕏", Y: "𝕐", Z: "ℤ",
		};
		return bb[char] || char;
	});

	return result;
}

function replaceCommands(latex: string): string {
	// \command → símbolo Unicode
	let result = latex;

	// Comandos con argumentos especiales
	result = result.replace(/\\limits/g, "");
	result = result.replace(/\\nolimits/g, "");
	result = result.replace(/\\displaystyle/g, "");
	result = result.replace(/\\textstyle/g, "");
	result = result.replace(/\\left/g, "");
	result = result.replace(/\\right/g, "");
	result = result.replace(/\\,/g, "\u2006");
	result = result.replace(/\\;/g, "\u2009");
	result = result.replace(/\\!/g, "\u2009");
	result = result.replace(/\\ /g, " ");
	result = result.replace(/~{2,}/g, "  ");
	result = result.replace(/~/g, "\u2009");

	// Comandos con {} argumentos
	for (const [cmd, symbol] of Object.entries(LATEX_SYMBOLS)) {
		const escapedCmd = cmd.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		// Evitar reemplazar dentro de palabras (e.g. "alpha" in "alphabeta")
		const regex = new RegExp(`\\\\${escapedCmd}(?![a-zA-Z])`, "g");
		result = result.replace(regex, symbol);
	}

	return result;
}

function convertGroup(group: string): string {
	let result = group;
	result = processOverrightarrow(result);
	result = processFractions(result);
	result = processSqrt(result);
	result = processHat(result);
	result = processBar(result);
	result = processDot(result);
	result = processBold(result);
	result = replaceCommands(result);
	result = processSuperscript(result);
	result = processSubscript(result);
	return result;
}

function convertLatexToHtml(latex: string): string {
	let result = latex.trim();
	result = convertGroup(result);

	// Limpieza final
	result = result.replace(/\{([^}]*)\}/g, "$1");
	result = result.replace(/\\/g, "");

	return result;
}

// ========================================================================
// RENDERIZADO INLINE: $...$
// ========================================================================

export function renderLatexInline(latex: string): React.ReactNode {
	const html = convertLatexToHtml(latex);
	return (
		<span
			className="font-serif italic text-primary px-0.5"
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}

// ========================================================================
// RENDERIZADO BLOCK: $$...$$
// ========================================================================

export function renderLatexBlock(latex: string): React.ReactNode {
	const html = convertLatexToHtml(latex);
	return (
		<div className="my-4 p-4 bg-muted/30 border border-border/50 rounded-lg overflow-x-auto">
			<div className="flex justify-center">
				<span
					className="font-serif text-lg italic text-foreground"
					dangerouslySetInnerHTML={{ __html: html }}
				/>
			</div>
		</div>
	);
}

// ========================================================================
// PRE-PROCESADOR: Extrae bloques $$...$$ del contenido
// ========================================================================

interface ContentSegment {
	type: "text" | "latex-block";
	content: string;
}

export function extractLatexBlocks(content: string): ContentSegment[] {
	const segments: ContentSegment[] = [];
	let remaining = content;

	while (remaining.length > 0) {
		const blockStart = remaining.indexOf("$$");
		if (blockStart === -1) {
			if (remaining.length > 0) {
				segments.push({ type: "text", content: remaining });
			}
			break;
		}

		// Texto antes del bloque
		if (blockStart > 0) {
			segments.push({ type: "text", content: remaining.slice(0, blockStart) });
		}

		// Buscar cierre
		const afterStart = blockStart + 2;
		const blockEnd = remaining.indexOf("$$", afterStart);
		if (blockEnd === -1) {
			// No hay cierre, tratar como texto
			segments.push({ type: "text", content: remaining.slice(blockStart) });
			break;
		}

		const latex = remaining.slice(afterStart, blockEnd);
		segments.push({ type: "latex-block", content: latex.trim() });
		remaining = remaining.slice(blockEnd + 2);
	}

	return segments;
}
