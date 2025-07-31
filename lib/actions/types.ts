// lib/actions/types.ts

export type ResultadoOperacion<T> =
	| { success: true; data: T }
	| { success: false; error: string; errorCode?: string };