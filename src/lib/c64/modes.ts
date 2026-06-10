/**
 * C64 graphics mode definitions and constraints
 */

export type GraphicsMode = 'hires' | 'multicolor' | 'sprite' | 'charset';

export interface ModeInfo {
	id: GraphicsMode;
	label: string;
	description: string;
	width: number;
	height: number;
	/** Pixel aspect ratio (width:height), 1 for hires, 2:1 for multicolor */
	pixelAspect: number;
	/** Number of colors simultaneously visible */
	colors: number;
	/** Colors per 8x8 cell (for bitmap modes) */
	colorsPerCell: number;
}

export const MODES: Record<GraphicsMode, ModeInfo> = {
	hires: {
		id: 'hires',
		label: 'Hi-Res Bitmap',
		description: '320×200, 2 colors per 8×8 cell',
		width: 320,
		height: 200,
		pixelAspect: 1,
		colors: 2,
		colorsPerCell: 2
	},
	multicolor: {
		id: 'multicolor',
		label: 'Multicolor Bitmap',
		description: '160×200 (double-wide pixels), 4 colors per 4×8 cell',
		width: 160,
		height: 200,
		pixelAspect: 2,
		colors: 4,
		colorsPerCell: 4
	},
	sprite: {
		id: 'sprite',
		label: 'Sprite Editor',
		description: '24×21 pixels, single or multicolor',
		width: 24,
		height: 21,
		pixelAspect: 1,
		colors: 2,
		colorsPerCell: 2
	},
	charset: {
		id: 'charset',
		label: 'Charset / Font',
		description: '8×8 per character, 256 characters',
		width: 8,
		height: 8,
		pixelAspect: 1,
		colors: 2,
		colorsPerCell: 2
	}
};

/** C64 screen dimensions */
export const SCREEN_WIDTH = 320;
export const SCREEN_HEIGHT = 200;

/** Character cell size */
export const CELL_W = 8;
export const CELL_H = 8;

/** Number of cells across the screen */
export const CELLS_X = SCREEN_WIDTH / CELL_W; // 40
export const CELLS_Y = SCREEN_HEIGHT / CELL_H; // 25

/** Sprite dimensions */
export const SPRITE_W = 24;
export const SPRITE_H = 21;

/** Number of character definitions */
export const CHARSET_SIZE = 256;
