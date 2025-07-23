//. 📍 components/ui/StandardPagination.tsx

//#region [head] - 🏷️ IMPORTS 🏷️
"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { StandardButton } from "./StandardButton";
import { StandardText } from "./StandardText";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
//#endregion ![head]

//#region [def] - 📦 TYPES & INTERFACE 📦
export interface StandardPaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	itemsPerPage: number;
	totalItems: number;
	className?: string;
}

const usePagination = ({
	totalPages,
	currentPage,
	siblings = 1,
}: {
	totalPages: number;
	currentPage: number;
	siblings?: number;
}) => {
	const range = (start: number, end: number) => {
		const length = end - start + 1;
		return Array.from({ length }, (_, idx) => idx + start);
	};

	const paginationRange = useMemo(() => {
		const totalPageNumbers = siblings * 2 + 3 + 2; // siblings + first/last + current + 2*DOTS

		if (totalPageNumbers >= totalPages) {
			return range(1, totalPages);
		}

		const leftSiblingIndex = Math.max(currentPage - siblings, 1);
		const rightSiblingIndex = Math.min(currentPage + siblings, totalPages);

		const shouldShowLeftDots = leftSiblingIndex > 2;
		const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

		const firstPageIndex = 1;
		const lastPageIndex = totalPages;

		if (!shouldShowLeftDots && shouldShowRightDots) {
			const leftItemCount = 3 + 2 * siblings;
			const leftRange = range(1, leftItemCount);
			return [...leftRange, "...", totalPages];
		}

		if (shouldShowLeftDots && !shouldShowRightDots) {
			const rightItemCount = 3 + 2 * siblings;
			const rightRange = range(totalPages - rightItemCount + 1, totalPages);
			return [firstPageIndex, "...", ...rightRange];
		}

		if (shouldShowLeftDots && shouldShowRightDots) {
			const middleRange = range(leftSiblingIndex, rightSiblingIndex);
			return [firstPageIndex, "...", ...middleRange, "...", lastPageIndex];
		}

		return [];
	}, [totalPages, currentPage, siblings]);

	return paginationRange;
};
//#endregion ![def]

//#region [main] - 🔧 COMPONENT 🔧
export const StandardPagination: React.FC<StandardPaginationProps> = ({
	currentPage,
	totalPages,
	onPageChange,
	itemsPerPage,
	totalItems,
	className,
}) => {
	const paginationRange = usePagination({ currentPage, totalPages });

	const handlePrevious = () => {
		if (currentPage > 1) {
			onPageChange(currentPage - 1);
		}
	};

	const handleNext = () => {
		if (currentPage < totalPages) {
			onPageChange(currentPage + 1);
		}
	};

	if (totalPages <= 1) {
		return null;
	}

	const startItem = (currentPage - 1) * itemsPerPage + 1;
	const endItem = Math.min(currentPage * itemsPerPage, totalItems);

	return (
		<div
			className={cn(
				"flex items-center justify-between w-full px-2 py-3",
				className
			)}>
			<div className="flex-1">
				<StandardText size="sm" colorShade="subtle">
					Mostrando {startItem}-{endItem} de {totalItems} resultados
				</StandardText>
			</div>
			<div className="flex items-center gap-2">
				<StandardButton
					styleType="outline"
					size="sm"
					onClick={handlePrevious}
					disabled={currentPage === 1}
					aria-label="Go to previous page"
					leftIcon={ChevronLeft}>
					Anterior
				</StandardButton>

				<div className="flex items-center gap-1">
					{paginationRange.map((pageNumber, index) => {
						if (pageNumber === "...") {
							return (
								<span
									key={`dots-${index}`}
									className="flex items-center justify-center h-9 w-9">
									<MoreHorizontal className="h-4 w-4" />
								</span>
							);
						}

						return (
							<StandardButton
								key={pageNumber}
								styleType={currentPage === pageNumber ? "solid" : "ghost"}
								colorScheme={currentPage === pageNumber ? "primary" : "neutral"}
								size="sm"
								onClick={() => onPageChange(pageNumber as number)}
								className="h-9 w-9">
								{pageNumber}
							</StandardButton>
						);
					})}
				</div>

				<StandardButton
					styleType="outline"
					size="sm"
					onClick={handleNext}
					disabled={currentPage === totalPages}
					aria-label="Go to next page"
					rightIcon={ChevronRight}>
					Siguiente
				</StandardButton>
			</div>
			<div className="flex-1" /> {/* Spacer */}
		</div>
	);
};
//#endregion ![main]

//#region [foo] - 🔚 EXPORTS 🔚
StandardPagination.displayName = "StandardPagination";
//#endregion ![foo]
