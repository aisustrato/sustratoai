// components/ui/form-field.tsx
"use client";

import * as React from "react";
import { Label } from "./label";
import { cn } from "@/lib/utils";
import { Text } from "./text";
import type { TextProps } from "./text";

type TextColor = TextProps["color"];
type TextColorVariant = TextProps["colorVariant"];

export interface FormFieldProps {
	label: string;
	htmlFor: string;
	className?: string;
	children: React.ReactNode;
	hint?: string;
	error?: string;
	isRequired?: boolean;
}

export function FormField({
	label,
	htmlFor,
	className,
	children,
	hint,
	error,
	isRequired,
}: FormFieldProps) {
	const [isFocused, setIsFocused] = React.useState(false);

	const formFieldWrapperId = `form-field-wrapper-${htmlFor}`;
	const hintId = hint ? `${htmlFor}-hint` : undefined;
	const errorId = error ? `${htmlFor}-error` : undefined;

	React.useEffect(() => {
		const formFieldDiv = document.getElementById(formFieldWrapperId);
		if (!formFieldDiv) {
			return;
		}
		const handleFocusIn = (event: FocusEvent) => {
			if (
				event.target &&
				(event.target as HTMLElement).closest(
					'input, textarea, select, [role="combobox"]'
				)
			) {
				setIsFocused(true);
			}
		};
		const handleFocusOut = (event: FocusEvent) => {
			if (!formFieldDiv.contains(event.relatedTarget as Node)) {
				setIsFocused(false);
			}
		};
		formFieldDiv.addEventListener("focusin", handleFocusIn);
		formFieldDiv.addEventListener("focusout", handleFocusOut);
		return () => {
			formFieldDiv.removeEventListener("focusin", handleFocusIn);
			formFieldDiv.removeEventListener("focusout", handleFocusOut);
		};
	}, [htmlFor, formFieldWrapperId]);

	let labelTextColor: TextColor = "neutral";
	let labelTextVariant: TextColorVariant | undefined = "text";

	if (error) {
		labelTextColor = "danger";
		labelTextVariant = "pure";
	} else if (isFocused) {
		labelTextColor = "primary";
		labelTextVariant = "pure";
	}

	// Clone children to pass the IDs for ARIA attributes
	const childrenWithProps = React.Children.map(children, (child) => {
		if (React.isValidElement(child)) {
			return React.cloneElement(child as React.ReactElement<any>, {
				"aria-describedby":
					[hintId, errorId].filter(Boolean).join(" ") || undefined,
			});
		}
		return child;
	});

	return (
		<div id={formFieldWrapperId} className={cn("space-y-1.5", className)}>
			<div>
				<Label htmlFor={htmlFor}>
					<Text
						variant="label"
						color={labelTextColor}
						colorVariant={labelTextVariant}
						className="transition-colors duration-200">
						{label}
						{isRequired && (
							<span className="text-danger-pure ml-0.5 select-none">*</span>
						)}
					</Text>
				</Label>
			</div>

			{childrenWithProps}

			{hint && !error && (
				<div id={hintId}>
					<Text variant="caption" color="neutral" colorVariant="textShade">
						{hint}
					</Text>
				</div>
			)}
			{error && (
				<div id={errorId}>
					<Text variant="caption" color="danger" colorVariant="pure">
						{error}
					</Text>
				</div>
			)}
		</div>
	);
}
