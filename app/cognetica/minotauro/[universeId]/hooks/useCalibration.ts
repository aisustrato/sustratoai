import { useState, useCallback } from "react";
import type { HumanResponse } from "@/lib/types/minotauro-types";

interface AnalysisComment {
	id: string;
	point: string;
}

interface Analysis {
	comments: AnalysisComment[];
}

interface CalibrationData {
	response?: HumanResponse;
	note?: string;
}

interface UseCalibrationReturn {
	calibrations: Record<string, Record<string, CalibrationData>>;
	handleCalibrationResponse: (
		galaxyId: string,
		commentId: string,
		response: HumanResponse,
	) => void;
	handleCalibrationNote: (
		galaxyId: string,
		commentId: string,
		note: string,
	) => void;
	isCalibrationValid: (
		galaxyId: string,
		analysis: Analysis,
	) => { valid: boolean; message?: string };
}

export function useCalibration(): UseCalibrationReturn {
	const [calibrations, setCalibrations] = useState<
		Record<string, Record<string, CalibrationData>>
	>({});

	const handleCalibrationResponse = useCallback(
		(galaxyId: string, commentId: string, response: HumanResponse) => {
			setCalibrations((prev) => ({
				...prev,
				[galaxyId]: {
					...(prev[galaxyId] || {}),
					[commentId]: {
						response,
						note: prev[galaxyId]?.[commentId]?.note || "",
					},
				},
			}));
		},
		[],
	);

	const handleCalibrationNote = useCallback(
		(galaxyId: string, commentId: string, note: string) => {
			setCalibrations((prev) => ({
				...prev,
				[galaxyId]: {
					...(prev[galaxyId] || {}),
					[commentId]: {
						...prev[galaxyId]?.[commentId],
						note,
					},
				},
			}));
		},
		[],
	);

	const isCalibrationValid = useCallback(
		(
			galaxyId: string,
			analysis: Analysis,
		): { valid: boolean; message?: string } => {
			const galaxyCalibrations = calibrations[galaxyId] || {};

			for (const comment of analysis.comments) {
				const calibration = galaxyCalibrations[comment.id];

				if (!calibration?.response) {
					return {
						valid: false,
						message: `Falta responder al comentario: "${comment.point}"`,
					};
				}

				if (
					calibration.response === "rechazado_con_razon" &&
					!calibration.note?.trim()
				) {
					return {
						valid: false,
						message: `Debes justificar el rechazo de: "${comment.point}"`,
					};
				}
			}

			return { valid: true };
		},
		[calibrations],
	);

	return {
		calibrations,
		handleCalibrationResponse,
		handleCalibrationNote,
		isCalibrationValid,
	};
}
