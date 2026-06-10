/**
 * C64 export formats
 *
 * Koala Painter (.kla / .koa):
 *   - Load address: $6000 (2 bytes, little-endian)
 *   - Bitmap data:  8000 bytes  ($6002–$7F41)
 *   - Screen RAM:   1000 bytes  ($7F42–$8329)
 *   - Color RAM:    1000 bytes  ($832A–$870D)
 *   - Background:   1 byte
 *   Total: 10003 bytes
 *
 * HiRes / Art Studio (.art):
 *   - Load address: $2000 (2 bytes)
 *   - Bitmap data:  8000 bytes
 *   - Screen RAM:   1000 bytes
 *   Total: 9002 bytes + border color (1 byte)
 */

import { colorToRGB, type C64Color } from './palette';

// ── Koala (multicolor bitmap) ────────────────────────────────────────────────

export interface KoalaData {
	/** 8000 bytes – bitmap data */
	bitmap: Uint8Array;
	/** 1000 bytes – screen RAM (hi=fg color, lo=bg color per cell) */
	screenRam: Uint8Array;
	/** 1000 bytes – color RAM (0–15 per cell) */
	colorRam: Uint8Array;
	/** 0–15, global background color */
	background: number;
}

/**
 * Encode a multicolor pixel canvas to Koala format.
 * pixelData is indexed 0–3 per pixel (160×200).
 * cellColors[y][x] = [bg, col1, col2, col3] (background global, screen RAM nibbles, color RAM)
 */
export function encodeKoala(
	pixelData: Uint8Array,
	cellColors: Uint8Array,
	background: number
): Uint8Array {
	// 2 (load addr) + 8000 (bitmap) + 1000 (screen) + 1000 (color) + 1 (bg) = 10003
	const out = new Uint8Array(10003);
	out[0] = 0x00;
	out[1] = 0x60; // load address $6000

	// bitmap: 160×200 pixels, 2 bits each → 4 pixels per byte → 40 bytes per row → 8000 bytes
	const bitmap = out.subarray(2, 8002);
	for (let by = 0; by < 25; by++) {
		// cell rows
		for (let bx = 0; bx < 40; bx++) {
			// cell columns (but multicolor is 2px wide so 20 cells wide in pixels)
			for (let row = 0; row < 8; row++) {
				let byte = 0;
				for (let col = 0; col < 4; col++) {
					// 4 double-wide pixels per byte
					const px = bx * 4 + col; // logical pixel x (0-159)
					const py = by * 8 + row;
					const idx = py * 160 + px;
					const val = pixelData[idx] & 0x03;
					byte |= val << (6 - col * 2);
				}
				bitmap[(by * 40 + bx) * 8 + row] = byte;
			}
		}
	}

	// screen RAM and color RAM (already filled in cellColors)
	const screenRam = out.subarray(8002, 9002);
	const colorRam = out.subarray(9002, 10002);
	screenRam.set(cellColors.subarray(0, 1000));
	colorRam.set(cellColors.subarray(1000, 2000));

	out[10002] = background & 0x0f;
	return out;
}

// ── HiRes (Art Studio compatible) ───────────────────────────────────────────

export interface HiResData {
	bitmap: Uint8Array;
	screenRam: Uint8Array;
	border: number;
}

/**
 * Encode a hires pixel canvas to Art Studio / AFLI format.
 * pixelData: 320×200, values 0 or 1 (foreground/background per cell).
 * cellColors: 1000 bytes, screen RAM (hi nibble = fg, lo nibble = bg per 8×8 cell)
 */
export function encodeHiRes(
	pixelData: Uint8Array,
	cellColors: Uint8Array,
	border: number
): Uint8Array {
	const out = new Uint8Array(9003);
	out[0] = 0x00;
	out[1] = 0x20; // load address $2000

	const bitmap = out.subarray(2, 8002);
	for (let by = 0; by < 25; by++) {
		for (let bx = 0; bx < 40; bx++) {
			for (let row = 0; row < 8; row++) {
				let byte = 0;
				for (let col = 0; col < 8; col++) {
					const px = bx * 8 + col;
					const py = by * 8 + row;
					if (pixelData[py * 320 + px]) byte |= 1 << (7 - col);
				}
				bitmap[(by * 40 + bx) * 8 + row] = byte;
			}
		}
	}

	const screenRam = out.subarray(8002, 9002);
	screenRam.set(cellColors.subarray(0, 1000));
	out[9002] = border & 0x0f;
	return out;
}

// ── PNG export ───────────────────────────────────────────────────────────────

/**
 * Render pixel data to a canvas and return a PNG blob.
 * pixelData: array of C64 color indices, length = width * height
 * For multicolor mode, pixelAspect=2 → each logical pixel is 2 canvas pixels wide.
 */
export function renderToCanvas(
	pixelData: Uint8Array,
	width: number,
	height: number,
	pixelAspect: number,
	palette: C64Color[]
): HTMLCanvasElement {
	const canvas = document.createElement('canvas');
	canvas.width = width * pixelAspect;
	canvas.height = height;
	const ctx = canvas.getContext('2d')!;
	const imageData = ctx.createImageData(canvas.width, canvas.height);
	const data = imageData.data;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const colorIdx = pixelData[y * width + x] & 0x0f;
			const color = palette[colorIdx];
			for (let px = 0; px < pixelAspect; px++) {
				const i = (y * canvas.width + x * pixelAspect + px) * 4;
				data[i] = color.r;
				data[i + 1] = color.g;
				data[i + 2] = color.b;
				data[i + 3] = 255;
			}
		}
	}

	ctx.putImageData(imageData, 0, 0);
	return canvas;
}

export async function exportPng(
	pixelData: Uint8Array,
	width: number,
	height: number,
	pixelAspect: number,
	palette: C64Color[]
): Promise<Blob> {
	const canvas = renderToCanvas(pixelData, width, height, pixelAspect, palette);
	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (blob) resolve(blob);
			else reject(new Error('Failed to create PNG blob'));
		}, 'image/png');
	});
}

/** Trigger a browser file download */
export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

/** Download raw binary data */
export function downloadBinary(data: Uint8Array, filename: string): void {
	const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
	downloadBlob(new Blob([buffer], { type: 'application/octet-stream' }), filename);
}

/** Export pixel data as a C source/asm hex dump (useful for demo coders) */
export function exportAsm(data: Uint8Array, label: string): string {
	const lines: string[] = [`${label}:`];
	for (let i = 0; i < data.length; i += 16) {
		const chunk = Array.from(data.slice(i, i + 16))
			.map((b) => `$${b.toString(16).padStart(2, '0')}`)
			.join(', ');
		lines.push(`  !byte ${chunk}`);
	}
	return lines.join('\n');
}
