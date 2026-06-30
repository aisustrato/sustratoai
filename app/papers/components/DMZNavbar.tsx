// 📍 app/papers/components/DMZNavbar.tsx
// Navbar minimalista para la DMZ (zona pública de papers)
// NO reutiliza StandardNavbar de la app logueada

import Link from "next/link";
import { StandardButton } from "@/components/ui/StandardButton";

export function DMZNavbar() {
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
							Publicaciones
						</Link>
						<Link
							href="#"
							className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
							Sobre
						</Link>
					</div>
				</div>

				{/* Botón "Ir a la app" */}
				<div className="flex items-center gap-4">
					<Link href="/">
						<StandardButton styleType="outline" size="sm">
							Ir a la app
						</StandardButton>
					</Link>
				</div>
			</div>
		</nav>
	);
}
