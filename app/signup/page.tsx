"use client";

import Link from "next/link";
import { StandardButton } from "@/components/ui/StandardButton";
import { StandardText } from "@/components/ui/StandardText";
import { StandardCard } from "@/components/ui/StandardCard";
import {
	Mail,
	Github,
	FileText,
	Fingerprint,
	ArrowRight,
	Scale,
} from "lucide-react";
import { SustratoLogoWithFixedText } from "@/components/ui/sustrato-logo-with-fixed-text";
import { StandardPageBackground } from "@/components/ui/StandardPageBackground";

export default function SignUpPage() {
	return (
		<StandardPageBackground variant="gradient" bubbles={true}>
			<div className="flex items-center justify-center min-h-screen p-4">
				<StandardCard 
                    className="max-w-3xl w-full" 
                    accentPlacement="left" 
                    colorScheme="primary" 
                    styleType="elevated"
                >
					{/* Cabecera: Identidad y Cambio Ontológico */}
					<StandardCard.Header className="space-y-4 text-center pb-6 border-b border-border/40">
						<div className="flex justify-center mb-6">
							<SustratoLogoWithFixedText
								size={80}
								variant="vertical"
								speed="slow"
								initialTheme="orange"
							/>
						</div>
						<StandardText
							asElement="h1"
							size="3xl"
							weight="bold"
							colorScheme="primary"
							className="text-center tracking-tight">
							Infraestructura Forense para la <span className="text-secondary">Cognición Aumentada</span>
						</StandardText>
						<StandardText
							asElement="p"
							size="lg"
							colorScheme="neutral"
							className="text-center max-w-2xl mx-auto italic text-muted-foreground">
							&quot;Cultivando sinergias humano·AI bajo la Ética de Moebius&quot;
						</StandardText>
					</StandardCard.Header>

					<StandardCard.Content className="space-y-8 pt-8">
						
						{/* Manifiesto Breve */}
						<div className="prose prose-slate max-w-none text-center">
							<StandardText asElement="p" size="md" colorScheme="neutral" className="leading-relaxed">
								Sustrato.ai ha evolucionado. Ya no es una herramienta de productividad, 
								es un <strong>Búnker de Integridad Epistémica</strong>. 
								En una era de métricas sintéticas, reivindicamos la <strong>Soberanía Cognitiva</strong>: 
								el derecho a investigar con herramientas que amplifican la intuición humana 
								y dejan un rastro auditable, en lugar de reemplazar el pensamiento.
							</StandardText>
						</div>

						{/* Grid de Evidencia (El "Monolito") */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<StandardCard styleType="subtle" colorScheme="neutral" className="bg-slate-50/50">
								<StandardCard.Content className="flex flex-col items-center text-center p-4">
									<div className="bg-blue-100 p-2 rounded-full mb-3">
										<FileText className="text-blue-600" size={24} />
									</div>
									<StandardText asElement="h3" weight="bold" size="sm" className="uppercase tracking-widest text-slate-500 mb-1">
										Registro Inmutable
									</StandardText>
									<Link href="https://doi.org/10.5281/zenodo.18274097" target="_blank" className="hover:opacity-70 transition-opacity">
										<StandardText asElement="p" weight="bold" size="md" colorScheme="primary" className="font-mono">
											DOI: 10.5281/zenodo.18274097
										</StandardText>
									</Link>
									<StandardText asElement="span" size="xs" className="text-green-600 mt-2 font-medium">
										● Validado (CERN/Zenodo)
									</StandardText>
								</StandardCard.Content>
							</StandardCard>

							<StandardCard styleType="subtle" colorScheme="neutral" className="bg-slate-50/50">
								<StandardCard.Content className="flex flex-col items-center text-center p-4">
									<div className="bg-emerald-100 p-2 rounded-full mb-3">
										<Fingerprint className="text-emerald-600" size={24} />
									</div>
									<StandardText asElement="h3" weight="bold" size="sm" className="uppercase tracking-widest text-slate-500 mb-1">
										Investigador F0
									</StandardText>
									<Link href="https://orcid.org/0009-0003-4251-2733" target="_blank" className="hover:opacity-70 transition-opacity">
										<StandardText asElement="p" weight="bold" size="md" colorScheme="primary" className="font-mono">
											ORCID: 0009-0003-4251-2733
										</StandardText>
									</Link>
									<StandardText asElement="span" size="xs" colorScheme="neutral" className="mt-2">
										Rodolfo Leiva (Independent Researcher)
									</StandardText>
								</StandardCard.Content>
							</StandardCard>
						</div>

						{/* Estado de Beta y Llamada a la Acción */}
						<div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
							<div className="flex items-center justify-center gap-2 mb-4">
								<Scale className="text-primary" size={20} />
								<StandardText asElement="h3" weight="bold" size="lg" colorScheme="primary">
									Estado: Beta Restringida
								</StandardText>
							</div>
							<StandardText asElement="p" size="sm" colorScheme="neutral" className="text-center mb-6 max-w-lg mx-auto">
								Estamos ordenando el jardín. El acceso directo está restringido para garantizar 
								la estabilidad del entorno, pero <strong>todos son bienvenidos</strong> a colaborar, 
								auditar o apoyar. La puerta no está cerrada, solo tiene portero.
							</StandardText>

							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<Link href="mailto:etica.fractal@proton.me">
									<StandardButton 
										size="lg" 
										colorScheme="primary" 
										leftIcon={Mail}
										className="w-full sm:w-auto shadow-md"
									>
										Contactar Proyecto
									</StandardButton>
								</Link>
								
								<Link href="https://github.com/rodolfo-leiva/sustrato.ai" target="_blank">
									<StandardButton 
										size="lg" 
										styleType="outline" 
										colorScheme="neutral" 
										leftIcon={Github}
										className="w-full sm:w-auto bg-white"
									>
										Auditar Código (GitHub)
									</StandardButton>
								</Link>
							</div>
						</div>

						{/* Enlace discreto para Login */}
						<div className="text-center pt-4">
							<Link href="/login" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-primary transition-colors">
								<span>Acceso a Nodos Activos</span>
								<ArrowRight size={14} />
							</Link>
						</div>

					</StandardCard.Content>

					<StandardCard.Footer className="text-center border-t border-border/40 py-4 bg-slate-50/50 rounded-b-xl">
						<StandardText
							asElement="p"
							size="xs"
							colorScheme="neutral"
							colorShade="subtle"
							className="font-mono opacity-60">
							v0.9.1 (Auditoría Pública) • Santiago, Chile • 2026 • Open Science
						</StandardText>
					</StandardCard.Footer>
				</StandardCard>
			</div>
		</StandardPageBackground>
	);
}
