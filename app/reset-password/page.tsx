"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase"; // ⚠️ ¡OJO! Asegúrate que la ruta a tu cliente de supabase sea correcta.
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardInput } from "@/components/ui/StandardInput";
import { StandardFormField } from "@/components/ui/StandardFormField";
import { StandardText } from "@/components/ui/StandardText";
import { StandardCard } from "@/components/ui/StandardCard";
import { Mail, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { StandardSustratoLogoWithFixedText } from "@/components/ui/StandardSustratoLogoWithFixedText";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";

export default function ResetPasswordPage() {
	const t = useTranslations("auth.resetPassword");
	const tAuth = useTranslations("auth");
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!email) {
			toast.error(t("emailRequired"));
			return;
		}

		setLoading(true);

		try {
			// 🧠 Lógica real de Supabase
			// Usamos `resetPasswordForEmail` para pedirle a Supabase que envíe el correo.
			// La opción `redirectTo` es crucial: le dice a Supabase a qué página debe llevar
			// el enlace del correo. Usamos `window.location.origin` para que la URL
			// funcione automáticamente en desarrollo (localhost) y producción (sustrato.ai).
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: `${window.location.origin}/update-password`,
			});

			if (error) {
				// Si Supabase devuelve un error, lo mostramos.
				throw error;
			}

			setSent(true);
			// Mantenemos un mensaje genérico por seguridad, para no revelar si un email existe o no en la base de datos.
			toast.success(t("successToast"));
		} catch (error: unknown) {
			console.error("Error al enviar correo de recuperación:", error);
			const errorMessage =
				error instanceof Error ? error.message : t("genericError");
			toast.error(t("errorToast", { message: errorMessage }));
		} finally {
			setLoading(false);
		}
	};

	return (
		<StandardPageBackground variant="subtle" bubbles={true}>
			<div className="fixed top-4 right-4 z-50">
				<LocaleSwitcher />
			</div>
			<div className="flex items-center justify-center min-h-screen p-4">
				<StandardCard
					className="max-w-md w-full"
					accentPlacement="top"
					colorScheme="primary"
					styleType="filled">
					<StandardCard.Header className="space-y-2 text-center">
						<div className="flex justify-center mb-2">
							<StandardSustratoLogoWithFixedText
								size={50}
								variant="vertical"
								speed="normal"
								initialTheme="green"
							/>
						</div>
						<StandardText
							asElement="h2"
							size="xl"
							weight="bold"
							colorScheme="primary"
							className="text-center mt-4">
							{t("title")}
						</StandardText>
						<StandardText
							asElement="p"
							colorScheme="neutral"
							className="text-center text-muted-foreground">
							{!sent ? t("instructions") : t("instructionsSent")}
						</StandardText>
					</StandardCard.Header>

					<StandardCard.Content>
						{!sent ?
							<form onSubmit={handleSubmit} className="space-y-4">
								<StandardFormField label={tAuth("email")} htmlFor="email">
									<StandardInput
										id="email"
										type="email"
										leadingIcon={Mail}
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										placeholder={t("emailPlaceholder")}
										required
										disabled={loading}
									/>
								</StandardFormField>

								<StandardButton
									type="submit"
									fullWidth
									loading={loading}
									loadingText={t("sendingButton")}
									colorScheme="primary"
									leftIcon={Send}
									className="mt-6">
									{t("submitButton")}
								</StandardButton>
							</form>
						:	<div className="text-center py-4">
								<div className="bg-primary/10 rounded-lg p-4 mb-6">
									<StandardText
										colorScheme="primary"
										size="sm"
										className="text-sm">
										{t("checkInboxPrefix")} <strong>{email}</strong>.{" "}
										{t("checkInboxSuffix")}
									</StandardText>
								</div>
								<StandardButton
									onClick={() => setSent(false)}
									colorScheme="secondary"
									styleType="outline"
									fullWidth
									className="mb-2">
									{t("tryAnotherEmail")}
								</StandardButton>
							</div>
						}
					</StandardCard.Content>

					<StandardCard.Footer className="text-center">
						<Link href="/login">
							<StandardButton
								styleType="ghost"
								leftIcon={ArrowLeft}
								size="sm"
								disabled={loading}>
								{t("backToLogin")}
							</StandardButton>
						</Link>
					</StandardCard.Footer>
				</StandardCard>
			</div>
		</StandardPageBackground>
	);
}
