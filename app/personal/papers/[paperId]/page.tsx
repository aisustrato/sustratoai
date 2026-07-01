// 📍 app/personal/papers/[paperId]/page.tsx
// Página de edición de paper existente

import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/app/auth/session";
import { getPaperById } from "@/lib/papers/queries";
import { PaperEditClient } from "./PaperEditClient";

interface PageProps {
	params: {
		paperId: string;
	};
}

export default async function EditPaperPage({ params }: PageProps) {
	// 🔍 LOG INMEDIATO: Antes de cualquier cosa
	console.log("🚨🚨🚨 EDIT PAGE CALLED 🚨🚨🚨");

	const { paperId } = params;
	console.log(`🔍 Paper ID from params: ${paperId}`);

	// Si es un archivo de imagen, no procesar (dejar que Next.js lo maneje como estático)
	if (paperId.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
		console.log(`🖼️ IMAGE FILE DETECTED: ${paperId} - Not processing`);
		redirect("/personal/papers");
	}

	// Validar que paperId es un UUID válido
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (!uuidRegex.test(paperId)) {
		console.log(`❌ INVALID UUID FORMAT: ${paperId} - Redirecting`);
		redirect("/personal/papers");
	}

	// 🔍 LOG: Server Component renderizando
	console.log(
		`[${new Date().toISOString()}] 🌐 SERVER: EditPaperPage rendering - Paper ID: ${paperId}`,
	);

	// Verificar autenticación
	const supabase = await createServerSupabaseClient();
	console.log("✅ Supabase client created");

	const {
		data: { user },
	} = await supabase.auth.getUser();
	console.log(`👤 User: ${user?.id || "NO USER"}`);

	if (!user) {
		console.log("❌ NO USER - Redirecting to /login");
		redirect("/login");
	}

	// Obtener paper
	console.log(`📄 Fetching paper: ${paperId}`);
	const paper = await getPaperById(paperId);
	console.log(`📄 Paper found: ${paper ? "YES" : "NO"}`);

	if (!paper) {
		console.log("❌ PAPER NOT FOUND - Redirecting to /personal/papers");
		redirect("/personal/papers");
	}

	// Verificar que el paper pertenece al usuario
	console.log(
		`🔐 Checking ownership: paper.created_by=${paper.created_by}, user.id=${user.id}`,
	);

	// Si el paper no tiene owner (created_by=null), mostrar error explicativo
	if (!paper.created_by) {
		console.log(
			"⚠️ PAPER WITHOUT OWNER (created_by=null) - Showing error page",
		);
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background-subtle to-background-muted p-4">
				<div className="max-w-md w-full bg-surface-base border border-border-subtle rounded-lg p-6 space-y-4">
					<h1 className="text-2xl font-bold text-text-primary">
						⚠️ Paper sin propietario
					</h1>
					<p className="text-text-secondary">
						Este paper fue creado antes de implementar el sistema de ownership y
						no tiene un propietario asignado.
					</p>
					<p className="text-text-secondary">
						<strong>ID del paper:</strong>{" "}
						<code className="text-xs bg-surface-subtle px-2 py-1 rounded">
							{paperId}
						</code>
					</p>
					<p className="text-sm text-text-muted">
						Contacta al administrador para asignar ownership o eliminar este
						paper.
					</p>
					<Link
						href="/personal/papers"
						className="block w-full text-center bg-primary-base text-white py-2 px-4 rounded hover:bg-primary-hover transition-colors">
						Volver a Mis Papers
					</Link>
				</div>
			</div>
		);
	}

	if (paper.created_by !== user.id) {
		console.log("❌ NOT OWNER - Redirecting to /personal/papers");
		redirect("/personal/papers");
	}

	console.log("✅ ALL CHECKS PASSED - Rendering PaperEditClient");
	return <PaperEditClient paper={paper} />;
}
