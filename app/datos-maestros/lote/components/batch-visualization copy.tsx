//. 📍 app/datos-maestros/lote/components/batch-visualization copy.tsx
"use client";
//#region [head] - 🏷️ IMPORTS 🏷️
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/app/theme-provider";
import { generateBatchTokens } from "./batch-tokens";
import { CustomSlider } from "@/components/ui/custom-slider";
import { StandardCard, type StandardCardColorScheme } from "@/components/ui/StandardCard";
import { Text } from "@/components/ui/text";
import { BatchItem } from "./BatchItem";
import tinycolor from "tinycolor2";
//#endregion ![head]

//#region [def] - 📦 TYPES 📦
// No specific props for this component, types are for internal state or inferred.
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export default function BatchVisualization() {
	const [batchSize, setBatchSize] = useState(50);
	const [memberCount, setMemberCount] = useState(3);
	const totalItems = 3000;
	const [batches, setBatches] = useState<number[]>([]);
	const [memberAssignments, setMemberAssignments] = useState<number[]>([]);
	const [isAnimating, setIsAnimating] = useState(false);
	const [selectedMembers, setSelectedMembers] = useState<boolean[]>(() =>
		Array(5).fill(true)
	);

	// Theme tokens
	//#region [sub] - 🧰 HOOKS, STATE, EFFECTS & HELPER FUNCTIONS 🧰
	const { appColorTokens, mode } = useTheme();
	const batchTokens = useMemo(
		() => appColorTokens && generateBatchTokens(appColorTokens, mode),
		[appColorTokens, mode]
	);

	// Calculate number of batches based on batch size
	useEffect(() => {
		setIsAnimating(true);
		const timer = setTimeout(() => {
			const numberOfBatches = Math.ceil(totalItems / batchSize);
			const newBatches = Array.from({ length: numberOfBatches }, (_, i) =>
				i === numberOfBatches - 1
					? totalItems % batchSize || batchSize
					: batchSize
			);
			setBatches(newBatches);
			// Assign batches to members
			const assignments = assignBatchesToMembers(
				newBatches.length,
				memberCount
			);
			setMemberAssignments(assignments);
			setIsAnimating(false);
		}, 300);
		return () => clearTimeout(timer);
	}, [batchSize, memberCount]);

	// Assign batches to members evenly
	const assignBatchesToMembers = (batchCount: number, members: number) => {
		const assignments: number[] = [];
		const batchesPerMember = Math.ceil(batchCount / members);
		for (let i = 0; i < batchCount; i++) {
			const memberIndex = Math.min(
				Math.floor(i / batchesPerMember),
				members - 1
			);
			assignments.push(memberIndex);
		}
		return assignments;
	};

	// Calculate grid layout parameters
	const calculateGridParams = () => {
		const batchCount = batches.length;
		const columns = Math.ceil(Math.sqrt(batchCount));
		return { columns };
	};
	const { columns } = calculateGridParams();

	// Generate items for the batch weight visualization
	const batchItems = Array.from({ length: batchSize }, (_, i) => i);

	// Count batches per member
	const batchesPerMember = memberAssignments.reduce((acc, memberIndex) => {
		acc[memberIndex] = (acc[memberIndex] || 0) + 1;
		return acc;
	}, {} as Record<number, number>);

	const auxColors = batchTokens?.auxiliaries; // Added null check for batchTokens

	// Peso visual: recalcular gap y líneas cada vez que batchSize cambie
	const barHeight = 180; // px, fijo
	const barWidth = 120; // px, fijo
	const lineHeight = 2; // px
	const gap =
		batchSize > 1 ? (barHeight - batchSize * lineHeight) / (batchSize - 1) : 0;

	// Cuando cambia el número de miembros, ajustar el array de selección
	useEffect(() => {
		setSelectedMembers((prev) => {
			const arr = prev.slice(0, memberCount);
			while (arr.length < memberCount) arr.push(true);
			return arr;
		});
	}, [memberCount]);

	// Solo los miembros seleccionados
	const activeMemberIndexes = selectedMembers
		.map((selected, idx) => (selected ? idx : null))
		.filter((v) => v !== null) as number[];

	// Recalcular asignación de lotes cuando cambia la selección
	useEffect(() => {
		setIsAnimating(true);
		const timer = setTimeout(() => {
			const numberOfBatches = Math.ceil(totalItems / batchSize);
			const newBatches = Array.from({ length: numberOfBatches }, (_, i) =>
				i === numberOfBatches - 1
					? totalItems % batchSize || batchSize
					: batchSize
			);
			setBatches(newBatches);
			const assignments = assignBatchesToMembers(
				newBatches.length,
				activeMemberIndexes.length
			);
			setMemberAssignments(assignments);
			setIsAnimating(false);
		}, 300);
		return () => clearTimeout(timer);
	}, [batchSize, memberCount, selectedMembers]);
	//#endregion ![sub]

	//#region [render] - 🎨 RENDER SECTION 🎨
	if (!batchTokens || !auxColors) return null; // Ensure batchTokens and auxColors are available

	return (
		<div
			style={{
				minHeight: "100vh",
				background: batchTokens.batch.background,
				padding: 32,
			}}>
			<div
				style={{
					maxWidth: 1200,
					margin: "0 auto",
					display: "flex",
					flexDirection: "column",
					gap: 48,
				}}>
				<StandardCard
					disableShadowHover={true}
					colorScheme="primary"
					shadow="lg"
					styleType="subtle"
					hasOutline={false}
					accentPlacement="none"
				>
					<Text
						variant="heading"
						size="2xl"
						color="primary"
						style={{ textAlign: "center" }}>
						Distribución de Lotes por Miembros
					</Text>
					<div
						style={{
							display: "flex",
							gap: 32,
							marginTop: 32,
							flexWrap: "wrap",
						}}>
						<StandardCard
							disableShadowHover={true}
							colorScheme="secondary"
							style={{ flex: 1, minWidth: 320 }}
							styleType="subtle"
							hasOutline={false}
							accentPlacement="none"
						>
							<Text variant="subtitle" size="lg" color="primary" weight="bold">
								Tamaño de Lote
							</Text>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									margin: "16px 0",
								}}>
								<Text size="md">
									Tamaño:{" "}
									<span
										style={{
											fontSize: 28,
											color: appColorTokens.primary.pure,
											fontWeight: 700,
										}}>
										{batchSize}
									</span>
								</Text>
								<Text size="md">
									Total:{" "}
									<span
										style={{
											fontSize: 28,
											color: appColorTokens.primary.pure,
											fontWeight: 700,
										}}>
										{batches.length}
									</span>{" "}
									lotes
								</Text>
							</div>
							<CustomSlider
								value={[batchSize]}
								min={5}
								max={100}
								step={5}
								onValueChange={(v) => setBatchSize(v[0])}
								showValue
								showTooltip
								gradient
								color="primary"
								size="lg"
								style={{ margin: "32px 0" }}
							/>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									fontSize: 13,
									opacity: 0.7,
								}}>
								<span>Lotes pequeños (muchos)</span>
								<span>Lotes grandes (pocos)</span>
							</div>
						</StandardCard>
						<StandardCard
							disableShadowHover={true}
							colorScheme="secondary"
							style={{ flex: 1, minWidth: 320 }}
							styleType="subtle"
							hasOutline={false}
							accentPlacement="none"
						>
							<Text variant="subtitle" size="lg" color="primary" weight="bold">
								Miembros
							</Text>
							<div
								style={{
									display: "flex",
									gap: 12,
									flexWrap: "wrap",
									margin: "16px 0",
								}}>
								{Array.from({ length: memberCount }).map((_, idx) => {
									const colorScheme = auxColors[idx % auxColors.length];
									const selected = selectedMembers[idx];
									return (
										<button
											type="button"
											onClick={() => {
												setSelectedMembers((prev) => {
													if (prev.filter(Boolean).length === 1 && prev[idx])
														return prev;
													const arr = [...prev];
													arr[idx] = !arr[idx];
													return arr;
												});
											}}
											style={{
												padding: "6px 18px",
												borderRadius: 16,
												border: `2.5px solid ${colorScheme.border}`,
												background: selected ? colorScheme.solid : "#fff",
												color: selected
													? tinycolor
															.mostReadable(colorScheme.solid, ["#222", "#fff"])
															.toHexString()
													: colorScheme.border,
												fontWeight: 700,
												fontSize: 18,
												cursor: "pointer",
												boxShadow: selected
													? "0 2px 8px 0 rgba(0,0,0,0.07)"
													: undefined,
											}}>
											Miembro {idx + 1}
										</button>
									);
								})}
							</div>
						</StandardCard>
					</div>
				</StandardCard>

				<div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
					{/* Distribución de lotes */}
					<StandardCard
						disableShadowHover={true}
						colorScheme="tertiary"
						style={{
							flex: 2,
							minWidth: 400,
							minHeight: 500,
							position: "relative",
						}}
						styleType="subtle"
						hasOutline={false}
						accentPlacement="none"
					>
						<Text
							variant="subtitle"
							size="xl"
							color="primary"
							weight="bold"
							style={{ marginBottom: 8 }}>
							Distribución de Lotes
						</Text>
						<Text size="md" color="neutral" style={{ marginBottom: 16 }}>
							{batches.length} lotes de {batchSize}
						</Text>
						<div
							style={{
								display: "grid",
								gap: 12,
								width: "100%",
								height: "calc(100% - 2rem)",
								gridTemplateColumns: `repeat(${columns}, 1fr)`,
								alignItems: "center",
								justifyItems: "center",
							}}>
							{batches.map((size, index) => {
								const memberIdx = memberAssignments[index];
								const colorScheme = auxColors[memberIdx % auxColors.length] || {
									solid: "#eee",
									border: "#bbb",
									text: "#222",
								};
								const pastel = colorScheme.solid;
								const border = tinycolor(pastel).darken(15).toHexString();
								const textColor = tinycolor
									.mostReadable(pastel, ["#222", "#fff"])
									.toHexString();
								const minSize = 32;
								const maxSize = 80;
								const dynamicSize = Math.max(
									minSize,
									Math.min(maxSize, 320 / columns)
								);
								return (
									<BatchItem
										key={`${index}-${batches.length}-${memberCount}`}
										color={pastel}
										border={border}
										textColor={textColor}
										number={index + 1}
										size={dynamicSize}
										animate={true}
									/>
								);
							})}
						</div>
						{isAnimating && (
							<motion.div
								style={{
									position: "absolute",
									inset: 0,
									background: "rgba(30,30,40,0.5)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									color: "#fff",
									fontSize: 24,
									fontWeight: 700,
									zIndex: 10,
								}}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.2 }}>
								Recalculando...
							</motion.div>
						)}
					</StandardCard>

					{/* Peso del lote */}
					<StandardCard
						colorScheme="tertiary"
						style={{
							flex: 1,
							minWidth: 280,
							minHeight: 500,
							position: "relative",
							background: batchTokens.batch.background,
						}}
						styleType="subtle"
						hasOutline={false}
						accentPlacement="none"
					>
						<Text
							variant="subtitle"
							size="xl"
							color="primary"
							weight="bold"
							style={{ marginBottom: 16 }}>
							Peso del Lote
						</Text>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								height: "calc(100% - 2rem)",
								justifyContent: "end",
							}}>
							<div
								style={{
									width: barWidth,
									height: barHeight,
									background: "#fff",
									borderRadius: 16,
									border: `2.5px solid ${auxColors[0].border}`,
									margin: "0 auto",
									display: "flex",
									flexDirection: "column-reverse",
									justifyContent: "flex-start",
									alignItems: "center",
									overflow: "hidden",
								}}>
								{Array.from({ length: batchSize }).map((_, i) => (
									<div
										key={i}
										style={{
											width: "100%",
											height: lineHeight,
											background: auxColors[0].border,
											marginTop: i === batchSize - 1 ? 0 : gap,
										}}
									/>
								))}
							</div>
							<div style={{ marginTop: 24, textAlign: "center" }}>
								<Text
									variant="heading"
									size="2xl"
									style={{ color: appColorTokens.primary.pure, fontSize: 40 }}>
									{batchSize}
								</Text>
								<Text size="md" color="neutral">
									elementos por lote
								</Text>
							</div>
						</div>
					</StandardCard>
				</div>

				{/* Leyenda de miembros */}
				<StandardCard
					disableShadowHover={true}
					colorScheme="primary"
					style={{ marginTop: 24 }}
					styleType="subtle"
					hasOutline={false}
					accentPlacement="none"
				>
					<Text
						variant="subtitle"
						size="lg"
						color="primary"
						weight="bold"
						style={{ marginBottom: 16 }}>
						Distribución por Miembros
					</Text>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: `repeat(${memberCount}, 1fr)`,
							gap: 24,
						}}>
						{Array.from({ length: memberCount }).map((_, index) => {
							const colorScheme = auxColors[index % auxColors.length];
							const batchCount = batchesPerMember[index] || 0;
							const percentage =
								batches.length > 0
									? Math.round((batchCount / batches.length) * 100)
									: 0;
							return (
								<StandardCard
									disableShadowHover={true}
									key={index}
									colorScheme="secondary"
									accentPlacement="left"
									accentColorScheme={colorScheme.key as any}
									style={{ padding: 24, minWidth: 120 }}
									styleType="subtle"
									hasOutline={false} // border="left" implies no full outline
								>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											marginBottom: 8,
										}}>
										<Text size="md" color="primary" weight="bold">
											Miembro {index + 1}
										</Text>
										<Text size="sm" color="neutral">
											{percentage}%
										</Text>
									</div>
									<Text variant="heading" size="xl" color="primary">
										{batchCount}
									</Text>
									<Text size="sm" color="neutral">
										lotes asignados
									</Text>
									<div
										style={{
											marginTop: 8,
											height: 8,
											background: batchTokens.batch.background,
											borderRadius: 8,
											overflow: "hidden",
										}}>
										<motion.div
											style={{
												background: colorScheme.solid,
												height: 8,
												borderRadius: 8,
												width: 0,
											}}
											animate={{ width: `${percentage}%` }}
											transition={{ duration: 0.5 }}
										/>
									</div>
								</StandardCard>
							);
						})}
					</div>
				</StandardCard>
			</div>
		</div>
	);
	//#endregion ![render]
}
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
// Default export is part of the component declaration
//#endregion ![foo]

//#region [todo] - 👀 PENDIENTES 👀
// TODO: VERIFY - This file is named "batch-visualization copy.tsx". Check if it's a duplicate or deprecated and can be removed.
// Consider if this component should take `totalItems` as a prop for more flexibility.
// The animation on recalculation could be smoother or provide more feedback.
//#endregion ![todo]
