/**
 * C64 demo-scene helpers
 * - Gradient generation using the C64 palette
 * - Color distance calculations
 * - Raster bar color sequences
 */

import { C64_PALETTE, type C64Color } from './palette';

/**
 * Calculate perceptual distance between two C64 colors (using Euclidean RGB distance)
 */
export function colorDistance(a: C64Color, b: C64Color): number {
	const dr = a.r - b.r;
	const dg = a.g - b.g;
	const db = a.b - b.b;
	return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Generate a gradient sequence of C64 color indices between two colors.
 * Uses nearest-color matching at each step.
 */
export function generateGradient(fromIdx: number, toIdx: number, steps: number): number[] {
	const from = C64_PALETTE[fromIdx & 0x0f];
	const to = C64_PALETTE[toIdx & 0x0f];
	const result: number[] = [];

	for (let i = 0; i < steps; i++) {
		const t = steps > 1 ? i / (steps - 1) : 0;
		const r = Math.round(from.r + (to.r - from.r) * t);
		const g = Math.round(from.g + (to.g - from.g) * t);
		const b = Math.round(from.b + (to.b - from.b) * t);

		// Find nearest C64 color
		let bestIdx = 0;
		let bestDist = Infinity;
		for (const color of C64_PALETTE) {
			const dist =
				(color.r - r) * (color.r - r) +
				(color.g - g) * (color.g - g) +
				(color.b - b) * (color.b - b);
			if (dist < bestDist) {
				bestDist = dist;
				bestIdx = color.index;
			}
		}
		result.push(bestIdx);
	}

	return result;
}

/**
 * Sort C64 palette colors by luminance (dark to bright)
 */
export function sortByLuminance(): C64Color[] {
	return [...C64_PALETTE].sort((a, b) => {
		const la = 0.299 * a.r + 0.587 * a.g + 0.114 * a.b;
		const lb = 0.299 * b.r + 0.587 * b.g + 0.114 * b.b;
		return la - lb;
	});
}

/**
 * Classic C64 raster gradient (e.g. for copper bar effect)
 * Returns an array of color indices, one per raster line (200 lines).
 */
export function rasterGradient(colors: number[]): number[] {
	if (colors.length === 0) return new Array(200).fill(0);
	const result: number[] = [];
	const linesPerSegment = 200 / (colors.length - 1 || 1);

	for (let line = 0; line < 200; line++) {
		const t = line / 199;
		const segmentPos = t * (colors.length - 1);
		const segIdx = Math.min(Math.floor(segmentPos), colors.length - 2);
		const localT = segmentPos - segIdx;

		// Snap to nearest
		result.push(localT < 0.5 ? colors[segIdx] : colors[segIdx + 1]);
	}
	return result;
}

/**
 * Find the C64 colors that best approximate a target color theme
 * Returns sorted by closeness
 */
export function findNearestColors(r: number, g: number, b: number, count = 4): C64Color[] {
	return [...C64_PALETTE]
		.sort((ca, cb) => {
			const da = (ca.r - r) ** 2 + (ca.g - g) ** 2 + (ca.b - b) ** 2;
			const db = (cb.r - r) ** 2 + (cb.g - g) ** 2 + (cb.b - b) ** 2;
			return da - db;
		})
		.slice(0, count);
}
