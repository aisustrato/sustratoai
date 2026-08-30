// 📍 app/papers/components/DMZNavbar.tsx
// Navbar minimalista para la DMZ (zona pública de papers)
// NO reutiliza StandardNavbar de la app logueada

import Link from "next/link";
import { StandardButton } from "@/components/ui/StandardButton";
import { PAPER_LABELS, type PaperIdioma } from "@/lib/papers/i18n";

interface DMZNavbarProps {
	/** Idioma de la página actual (por defecto "es" para el índice, que es bilingüe/mixto). */
	idioma?: PaperIdioma;
}

export function DMZNavbar({ idioma = "es" }: DMZNavbarProps) {
	const t = PAPER_LABELS[idioma];

	return (
		<nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-16 items-center justify-between">
				{/* Logo y nombre */}
				<div className="flex items-center gap-6">
					<Link
						href="/papers"
						className="flex items-center gap-2 font-heading text-xl font-bold">
						<span className="text-primary">sustrato</span>
						<span className="text-muted-foreground">.ai</span>
					</Link>

					{/* Links de navegación */}
					<div className="hidden md:flex items-center gap-4">
						<Link
							href="/papers"
							className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
							{t.navPublicaciones}
						</Link>
						<Link
							href="#"
							className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
							{t.navSobre}
						</Link>
					</div>
				</div>

				{/* Botón "Ir a la app" */}
				<div className="flex items-center gap-4">
					<Link href="/">
						<StandardButton styleType="outline" size="sm">
							{t.navIrALaApp}
						</StandardButton>
					</Link>
				</div>
			</div>
		</nav>
	);
}
