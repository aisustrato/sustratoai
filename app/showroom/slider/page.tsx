"use client";

import { useState } from "react";
import { CustomSlider } from "@/components/ui/custom-slider";
import { CustomButton } from "@/components/ui/custom-button";
import { ProCard } from '@/components/ui/pro-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/app/theme-provider";

export default function SliderShowroom() {
	const { setColorScheme } = useTheme();
	const [value, setValue] = useState(50);
	const [rangeValue, setRangeValue] = useState<[number, number]>([25, 75]);

	return (
		<div className="container py-10">
			<h1 className="text-3xl font-bold mb-6">Custom Slider Showroom</h1>

			<div className="mb-8">
				<h2 className="text-xl font-semibold mb-4">Tema</h2>
				<div className="flex gap-2 mb-6">
					<CustomButton onClick={() => setColorScheme("blue")}>
						Azul
					</CustomButton>
					<CustomButton onClick={() => setColorScheme("green")}>
						Verde
					</CustomButton>
					<CustomButton onClick={() => setColorScheme("orange")}>
						Naranja
					</CustomButton>
				</div>
			</div>

			<Tabs defaultValue="basic">
				<TabsList className="mb-4">
					<TabsTrigger value="basic">Básico</TabsTrigger>
					<TabsTrigger value="variants">Variantes</TabsTrigger>
					<TabsTrigger value="colors">Colores</TabsTrigger>
					<TabsTrigger value="sizes">Tamaños</TabsTrigger>
					<TabsTrigger value="features">Características</TabsTrigger>
				</TabsList>

				<TabsContent value="basic">
					<ProCard>
						<ProCard.Header>
							<ProCard.Title>Slider Básico</ProCard.Title>
						</ProCard.Header>
						<ProCard.Content className="space-y-8">
							<div>
								<h3 className="text-lg font-medium mb-4">Slider Simple</h3>
								<CustomSlider
									defaultValue={[50]}
									max={100}
									step={1}
									value={[value]}
									onValueChange={(newValue: number | number[]) =>
										setValue(Array.isArray(newValue) ? newValue[0] : newValue)
									}
								/>
								<p className="mt-2">Valor actual: {value}</p>
							</div>

							<div>
								<h3 className="text-lg font-medium mb-4">Slider de Rango</h3>
								<CustomSlider
									defaultValue={[25, 75]}
									max={100}
									step={1}
									value={rangeValue}
									onValueChange={(newValue: number | number[]) =>
										setRangeValue(
											Array.isArray(newValue)
												? (newValue as [number, number])
												: [newValue, newValue]
										)
									}
								/>
								<p className="mt-2">
									Rango actual: {rangeValue[0]} - {rangeValue[1]}
								</p>
							</div>

							<div>
								<h3 className="text-lg font-medium mb-4">
									Slider Deshabilitado
								</h3>
								<CustomSlider defaultValue={[50]} max={100} step={1} disabled />
							</div>
						</ProCard.Content>
					</ProCard>
				</TabsContent>

				<TabsContent value="variants">
					<ProCard>
						<ProCard.Header>
							<ProCard.Title>Variantes de Slider</ProCard.Title>
						</ProCard.Header>
						<ProCard.Content className="space-y-8">
							<div>
								<h3 className="text-lg font-medium mb-4">
									Solid (Predeterminado)
								</h3>
								<CustomSlider defaultValue={[50]} max={100} variant="solid" />
							</div>

							<div>
								<h3 className="text-lg font-medium mb-4">Outline</h3>
								<CustomSlider defaultValue={[50]} max={100} variant="outline" />
							</div>

							<div>
								<h3 className="text-lg font-medium mb-4">Subtle</h3>
								<CustomSlider defaultValue={[50]} max={100} variant="subtle" />
							</div>

							<div>
								<h3 className="text-lg font-medium mb-4">Con Gradiente</h3>
								<CustomSlider defaultValue={[50]} max={100} gradient />
							</div>
						</ProCard.Content>
					</ProCard>
				</TabsContent>

				<TabsContent value="colors">
					<ProCard>
						<ProCard.Header>
							<ProCard.Title>Colores de Slider</ProCard.Title>
						</ProCard.Header>
						<ProCard.Content className="space-y-8">
							<div>
								<h3 className="text-lg font-medium mb-4">
									Primary (Predeterminado)
								</h3>
								<CustomSlider defaultValue={[50]} max={100} color="primary" />
							</div>

							<div>
								<h3 className="text-lg font-medium mb-4">Secondary</h3>
								<CustomSlider defaultValue={[50]} max={100} color="secondary" />
							</div>

							<div>
								<h3 className="text-lg font-medium mb-4">Tertiary</h3>
								<CustomSlider defaultValue={[50]} max={100} color="tertiary" />
							</div>

							<div>
								<h3 className="text-lg font-medium mb-4">Accent</h3>
								<CustomSlider defaultValue={[50]} max={100} color="accent" />
							</div>

							<div>
								<h3 className="text-lg font-medium mb-4">Success</h3>
								<CustomSlider defaultValue={[50]} max={100} color="success" />
							</div>

							<div>
								<h3 className="text-lg font-medium mb-4">Warning</h3>
								<CustomSlider defaultValue={[50]} max={100} color="warning" />
							</div>

							<div>
								<h3 className="text-lg font-medium mb-4">Danger</h3>
								<CustomSlider defaultValue={[50]} max={100} color="danger" />
							</div>

							<div>
								<h3 className="text-lg font-medium mb-4">Default</h3>
								<CustomSlider defaultValue={[50]} max={100} color="default" />
							</div>
						</ProCard.Content>
					</ProCard>
				</TabsContent>

				<TabsContent value="sizes">
					<ProCard>
						<ProCard.Header>
							<ProCard.Title>Tamaños de Slider</ProCard.Title>
						</ProCard.Header>
						<ProCard.Content className="space-y-8">
							<div>
								<h3 className="text-lg font-medium mb-4">XS</h3>
								<CustomSlider defaultValue={[50]} max={100} size="xs" />
							</div>

							<div>
								<h3 className="text-lg font-medium mb-4">SM</h3>
								<CustomSlider defaultValue={[50]} max={100} size="sm" />
							</div>

							<div>
								<h3 className="text-lg font-medium mb-4">
									MD (Predeterminado)
								</h3>
								<CustomSlider defaultValue={[50]} max={100} size="md" />
							</div>

							<div>
								<h3 className="text-lg font-medium mb-4">LG</h3>
								<CustomSlider defaultValue={[50]} max={100} size="lg" />
							</div>

							<div>
								<h3 className="text-lg font-medium mb-4">XL</h3>
								<CustomSlider defaultValue={[50]} max={100} size="xl" />
							</div>
						</ProCard.Content>
					</ProCard>
				</TabsContent>

				<TabsContent value="features">
					<ProCard>
						<ProCard.Header>
							<ProCard.Title>Características Adicionales</ProCard.Title>
						</ProCard.Header>
						<ProCard.Content className="space-y-8">
							<div>
								<h3 className="text-lg font-medium mb-4">Mostrar Valor</h3>
								<CustomSlider defaultValue={[50]} max={100} showValue />
							</div>

							<div>
								<h3 className="text-lg font-medium mb-4">Prefijo y Sufijo</h3>
								<CustomSlider
									defaultValue={[50]}
									max={100}
									showValue
									valuePrefix="$"
									valueSuffix=" USD"
								/>
							</div>

							<div>
								<h3 className="text-lg font-medium mb-4">Con Tooltip</h3>
								<CustomSlider defaultValue={[50]} max={100} showTooltip />
							</div>

							<div>
								<h3 className="text-lg font-medium mb-4">Con Marcas (Ticks)</h3>
								<CustomSlider
									defaultValue={[50]}
									max={100}
									showTicks
									tickCount={5}
								/>
							</div>

							<div>
								<h3 className="text-lg font-medium mb-4">
									Con Etiquetas en Marcas
								</h3>
								<CustomSlider
									defaultValue={[50]}
									max={100}
									showTicks
									tickCount={5}
									tickLabels={["0%", "25%", "50%", "75%", "100%"]}
								/>
							</div>

							<div>
								<h3 className="text-lg font-medium mb-4">
									Orientación Vertical
								</h3>
								<div className="h-64">
									<CustomSlider
										defaultValue={[50]}
										max={100}
										orientation="vertical"
									/>
								</div>
							</div>
						</ProCard.Content>
					</ProCard>
				</TabsContent>
			</Tabs>
		</div>
	);
}
