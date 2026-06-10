/**
 * C64 color palette - the canonical 16 colors of the Commodore 64
 * Index matches the C64 color RAM value (0–15)
 */
export interface C64Color {
	index: number;
	name: string;
	hex: string;
	r: number;
	g: number;
	b: number;
}

export const C64_PALETTE: C64Color[] = [
	{ index: 0, name: 'Black', hex: '#000000', r: 0, g: 0, b: 0 },
	{ index: 1, name: 'White', hex: '#ffffff', r: 255, g: 255, b: 255 },
	{ index: 2, name: 'Red', hex: '#9f4e44', r: 159, g: 78, b: 68 },
	{ index: 3, name: 'Cyan', hex: '#6abfc6', r: 106, g: 191, b: 198 },
	{ index: 4, name: 'Purple', hex: '#a057a3', r: 160, g: 87, b: 163 },
	{ index: 5, name: 'Green', hex: '#5caa59', r: 92, g: 170, b: 89 },
	{ index: 6, name: 'Blue', hex: '#40318d', r: 64, g: 49, b: 141 },
	{ index: 7, name: 'Yellow', hex: '#bfce72', r: 191, g: 206, b: 114 },
	{ index: 8, name: 'Orange', hex: '#a05f00', r: 160, g: 95, b: 0 },
	{ index: 9, name: 'Brown', hex: '#6d4100', r: 109, g: 65, b: 0 },
	{ index: 10, name: 'Light Red', hex: '#c87764', r: 200, g: 119, b: 100 },
	{ index: 11, name: 'Dark Gray', hex: '#505050', r: 80, g: 80, b: 80 },
	{ index: 12, name: 'Gray', hex: '#8b8b8b', r: 139, g: 139, b: 139 },
	{ index: 13, name: 'Light Green', hex: '#94e089', r: 148, g: 224, b: 137 },
	{ index: 14, name: 'Light Blue', hex: '#7869c4', r: 120, g: 105, b: 196 },
	{ index: 15, name: 'Light Gray', hex: '#c0c0c0', r: 192, g: 192, b: 192 }
];

/** Get a C64Color by index (0–15) */
export function getColor(index: number): C64Color {
	return C64_PALETTE[index & 0x0f];
}

/** Convert a C64 color index to a CSS hex string */
export function colorToHex(index: number): string {
	return C64_PALETTE[index & 0x0f].hex;
}

/** Convert a C64 color index to [r, g, b] */
export function colorToRGB(index: number): [number, number, number] {
	const c = C64_PALETTE[index & 0x0f];
	return [c.r, c.g, c.b];
}
