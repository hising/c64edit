/**
 * Central editor state using Svelte 5 runes ($state / $derived)
 */
import { C64_PALETTE, type C64Color } from '$lib/c64/palette';
import { MODES, type GraphicsMode } from '$lib/c64/modes';

// ── Tool types ───────────────────────────────────────────────────────────────

export type Tool = 'pencil' | 'eraser' | 'fill' | 'line' | 'rect' | 'pick' | 'select';

export interface ToolInfo {
	id: Tool;
	label: string;
	icon: string;
	shortcut: string;
}

export const TOOLS: ToolInfo[] = [
	{ id: 'pencil', label: 'Pencil', icon: '✏️', shortcut: 'B' },
	{ id: 'eraser', label: 'Eraser', icon: '🧹', shortcut: 'E' },
	{ id: 'fill', label: 'Fill', icon: '🪣', shortcut: 'F' },
	{ id: 'line', label: 'Line', icon: '╱', shortcut: 'L' },
	{ id: 'rect', label: 'Rectangle', icon: '▭', shortcut: 'R' },
	{ id: 'pick', label: 'Color Pick', icon: '💉', shortcut: 'I' },
	{ id: 'select', label: 'Select', icon: '⬚', shortcut: 'S' }
];

// ── Undo/Redo stack ──────────────────────────────────────────────────────────

const MAX_HISTORY = 50;

interface HistoryEntry {
	pixels: Uint8Array;
	cellColors: Uint8Array;
	spritePixels: Uint8Array;
	charsetPixels: Uint8Array[];
}

// ── Editor state ─────────────────────────────────────────────────────────────

function createEditorStore() {
	let mode = $state<GraphicsMode>('hires');
	let tool = $state<Tool>('pencil');
	let zoom = $state(2);
	let showGrid = $state(true);
	let showPreview = $state(true);

	// Active colors
	let fgColor = $state(1); // White
	let bgColor = $state(0); // Black

	// Multicolor extra colors (for multicolor mode)
	let mc1Color = $state(2); // Red
	let mc2Color = $state(5); // Green

	// For multicolor: active draw color slot 0-3
	let mcDrawSlot = $state(1);

	// Current mode info
	let modeInfo = $derived(MODES[mode]);

	// Canvas pixel data: color index per pixel
	// For hires: 0 = bg, 1 = fg (per cell), stored as full palette index
	// For multicolor: 0-3 (slot index), stored as slot index
	// For sprite: similar to hires
	let pixels = $state<Uint8Array>(new Uint8Array(320 * 200));

	// Cell colors for hires/multicolor: screen RAM + color RAM
	// hires: screenRam[cellY*40+cellX] = (fgIdx << 4) | bgIdx
	// multicolor: screenRam = (col1 << 4) | col2, colorRam = col3
	let cellColors = $state<Uint8Array>(new Uint8Array(2000));

	// Sprite/charset frame data
	let spritePixels = $state<Uint8Array>(new Uint8Array(24 * 21));
	let charsetPixels = $state<Uint8Array[]>(
		Array.from({ length: 256 }, () => new Uint8Array(8 * 8))
	);
	let activeCharIndex = $state(0);

	// Selection rectangle
	let selection = $state<{ x: number; y: number; w: number; h: number } | null>(null);

	// History
	let history: HistoryEntry[] = [];
	let historyIndex = $state(-1);

	// Status
	let statusMessage = $state('Ready');
	let cursorPos = $state<{ x: number; y: number } | null>(null);

	// Project name
	let projectName = $state('untitled');

	// Dirty flag
	let isDirty = $state(false);

	// ── Helpers ───────────────────────────────────────────────────────────────

	function pushHistory() {
		const entry: HistoryEntry = {
			pixels: new Uint8Array(pixels),
			cellColors: new Uint8Array(cellColors),
			spritePixels: new Uint8Array(spritePixels),
			charsetPixels: charsetPixels.map((c) => new Uint8Array(c))
		};
		// Truncate any redo history
		history = history.slice(0, historyIndex + 1);
		history.push(entry);
		if (history.length > MAX_HISTORY) history.shift();
		historyIndex = history.length - 1;
		isDirty = true;
	}

	function undo() {
		if (historyIndex > 0) {
			historyIndex--;
			const entry = history[historyIndex];
			pixels = new Uint8Array(entry.pixels);
			cellColors = new Uint8Array(entry.cellColors);
			spritePixels = new Uint8Array(entry.spritePixels);
			charsetPixels = entry.charsetPixels.map((c) => new Uint8Array(c));
			statusMessage = 'Undo';
		}
	}

	function redo() {
		if (historyIndex < history.length - 1) {
			historyIndex++;
			const entry = history[historyIndex];
			pixels = new Uint8Array(entry.pixels);
			cellColors = new Uint8Array(entry.cellColors);
			spritePixels = new Uint8Array(entry.spritePixels);
			charsetPixels = entry.charsetPixels.map((c) => new Uint8Array(c));
			statusMessage = 'Redo';
		}
	}

	// ── Drawing operations ────────────────────────────────────────────────────

	function getDrawColor(): number {
		if (mode === 'multicolor') return mcDrawSlot;
		return fgColor;
	}

	function setPixel(x: number, y: number, colorValue?: number) {
		const w = modeInfo.width;
		const h = modeInfo.height;
		if (x < 0 || y < 0 || x >= w || y >= h) return;

		const val = colorValue !== undefined ? colorValue : getDrawColor();
		const idx = y * w + x;

		if (mode === 'sprite') {
			spritePixels[idx] = val;
			spritePixels = new Uint8Array(spritePixels);
		} else if (mode === 'charset') {
			// Normalize to 0/1 for charset; write into active character buffer
			const buf = new Uint8Array(charsetPixels[activeCharIndex]);
			buf[idx] = val !== 0 ? 1 : 0;
			charsetPixels[activeCharIndex] = buf;
		} else {
			pixels[idx] = val;
			pixels = new Uint8Array(pixels);
		}
	}

	function erasePixel(x: number, y: number) {
		setPixel(x, y, 0);
	}

	function floodFill(startX: number, startY: number, fillColor: number) {
		const w = modeInfo.width;
		const h = modeInfo.height;
		const target =
			mode === 'sprite'
				? spritePixels
				: mode === 'charset'
					? charsetPixels[activeCharIndex]
					: pixels;
		const targetColor = target[startY * w + startX];

		// Normalize fill color to 0/1 for charset mode
		if (mode === 'charset') fillColor = fillColor !== 0 ? 1 : 0;

		if (targetColor === fillColor) return;

		const stack: [number, number][] = [[startX, startY]];
		const visited = new Uint8Array(w * h);

		while (stack.length > 0) {
			const [cx, cy] = stack.pop()!;
			if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
			const idx = cy * w + cx;
			if (visited[idx] || target[idx] !== targetColor) continue;
			visited[idx] = 1;
			target[idx] = fillColor;
			stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
		}

		if (mode === 'sprite') {
			spritePixels = new Uint8Array(target);
		} else if (mode === 'charset') {
			charsetPixels[activeCharIndex] = new Uint8Array(target);
		} else {
			pixels = new Uint8Array(target);
		}
	}

	function drawLine(x0: number, y0: number, x1: number, y1: number, colorValue?: number) {
		const color = colorValue !== undefined ? colorValue : getDrawColor();
		const dx = Math.abs(x1 - x0);
		const dy = Math.abs(y1 - y0);
		const sx = x0 < x1 ? 1 : -1;
		const sy = y0 < y1 ? 1 : -1;
		let err = dx - dy;
		let cx = x0;
		let cy = y0;
		const w = modeInfo.width;
		const h = modeInfo.height;
		const target =
			mode === 'sprite'
				? spritePixels
				: mode === 'charset'
					? charsetPixels[activeCharIndex]
					: pixels;

		while (true) {
			if (cx >= 0 && cy >= 0 && cx < w && cy < h) target[cy * w + cx] = color;
			if (cx === x1 && cy === y1) break;
			const e2 = 2 * err;
			if (e2 > -dy) { err -= dy; cx += sx; }
			if (e2 < dx) { err += dx; cy += sy; }
		}

		if (mode === 'sprite') {
			spritePixels = new Uint8Array(target);
		} else if (mode === 'charset') {
			charsetPixels[activeCharIndex] = new Uint8Array(target);
		} else {
			pixels = new Uint8Array(target);
		}
	}

	function drawRect(
		x0: number,
		y0: number,
		x1: number,
		y1: number,
		colorValue?: number,
		filled = false
	) {
		const color = colorValue !== undefined ? colorValue : getDrawColor();
		const minX = Math.min(x0, x1);
		const maxX = Math.max(x0, x1);
		const minY = Math.min(y0, y1);
		const maxY = Math.max(y0, y1);

		for (let y = minY; y <= maxY; y++) {
			for (let x = minX; x <= maxX; x++) {
				const onEdge = x === minX || x === maxX || y === minY || y === maxY;
				if (filled || onEdge) setPixel(x, y, color);
			}
		}
	}

	function clearCanvas() {
		pushHistory();
		if (mode === 'sprite') {
			spritePixels = new Uint8Array(24 * 21);
		} else {
			pixels = new Uint8Array(modeInfo.width * modeInfo.height);
		}
		statusMessage = 'Canvas cleared';
	}

	/** Fill entire canvas with a color */
	function fillCanvas(colorIndex: number) {
		pushHistory();
		if (mode === 'sprite') {
			spritePixels.fill(colorIndex);
			spritePixels = new Uint8Array(spritePixels);
		} else {
			pixels.fill(colorIndex);
			pixels = new Uint8Array(pixels);
		}
	}

	/** Initialize cell colors for the current mode */
	function initCellColors() {
		const arr = new Uint8Array(2000);
		if (mode === 'hires') {
			// screen RAM: (fg<<4)|bg per cell, reflecting current color selection
			arr.fill((fgColor << 4) | bgColor, 0, 1000);
		} else if (mode === 'multicolor') {
			// screen RAM: (col1<<4)|col2, color RAM: col3
			for (let i = 0; i < 1000; i++) arr[i] = (mc1Color << 4) | mc2Color;
			arr.fill(mc1Color, 1000, 2000);
		}
		cellColors = arr;
	}

	/** Get the current pixels for a specific mode */
	function getActivePixels(): Uint8Array {
		if (mode === 'sprite') return spritePixels;
		if (mode === 'charset') return charsetPixels[activeCharIndex];
		return pixels;
	}

	// Initialize with blank history snapshot
	pushHistory();

	return {
		// State getters
		get mode() { return mode; },
		get tool() { return tool; },
		get zoom() { return zoom; },
		get showGrid() { return showGrid; },
		get showPreview() { return showPreview; },
		get fgColor() { return fgColor; },
		get bgColor() { return bgColor; },
		get mc1Color() { return mc1Color; },
		get mc2Color() { return mc2Color; },
		get mcDrawSlot() { return mcDrawSlot; },
		get modeInfo() { return modeInfo; },
		get pixels() { return pixels; },
		get cellColors() { return cellColors; },
		get spritePixels() { return spritePixels; },
		get charsetPixels() { return charsetPixels; },
		get activeCharIndex() { return activeCharIndex; },
		get selection() { return selection; },
		get historyIndex() { return historyIndex; },
		get historyLength() { return history.length; },
		get statusMessage() { return statusMessage; },
		get cursorPos() { return cursorPos; },
		get projectName() { return projectName; },
		get isDirty() { return isDirty; },
		get palette() { return C64_PALETTE; },

		// State setters
		set mode(v: GraphicsMode) {
			mode = v;
			initCellColors();
			statusMessage = `Mode: ${MODES[v].label}`;
		},
		set tool(v: Tool) { tool = v; },
		set zoom(v: number) { zoom = Math.max(1, Math.min(8, v)); },
		set showGrid(v: boolean) { showGrid = v; },
		set showPreview(v: boolean) { showPreview = v; },
		set fgColor(v: number) { fgColor = v & 0x0f; },
		set bgColor(v: number) { bgColor = v & 0x0f; },
		set mc1Color(v: number) { mc1Color = v & 0x0f; },
		set mc2Color(v: number) { mc2Color = v & 0x0f; },
		set mcDrawSlot(v: number) { mcDrawSlot = v & 0x03; },
		set activeCharIndex(v: number) { activeCharIndex = v & 0xff; },
		set selection(v: { x: number; y: number; w: number; h: number } | null) { selection = v; },
		set statusMessage(v: string) { statusMessage = v; },
		set cursorPos(v: { x: number; y: number } | null) { cursorPos = v; },
		set projectName(v: string) { projectName = v; isDirty = true; },
		set isDirty(v: boolean) { isDirty = v; },

		// Actions
		pushHistory,
		undo,
		redo,
		setPixel,
		erasePixel,
		floodFill,
		drawLine,
		drawRect,
		clearCanvas,
		fillCanvas,
		initCellColors,
		getActivePixels,

		/** Update cell color for a specific cell (used by hires/multicolor constraint enforcement) */
		setCellColor(cellX: number, cellY: number, fgIdx: number, bgIdx: number) {
			const ci = cellY * 40 + cellX;
			if (mode === 'hires') {
				cellColors[ci] = (fgIdx << 4) | bgIdx;
			} else if (mode === 'multicolor') {
				cellColors[ci] = (fgIdx << 4) | bgIdx; // screen RAM
				cellColors[1000 + ci] = mc1Color; // color RAM
			}
			cellColors = new Uint8Array(cellColors);
		},

		/** Resolve the actual palette color for a pixel in the current context */
		resolveColor(pixelValue: number, cellX: number, cellY: number): number {
			if (mode === 'hires') {
				const ci = cellY * 40 + cellX;
				const screenByte = cellColors[ci] ?? 0x10;
				return pixelValue === 0 ? (screenByte & 0x0f) : (screenByte >> 4);
			} else if (mode === 'multicolor') {
				// slot 0 = background, 1 = screenRam hi, 2 = screenRam lo, 3 = colorRam
				const ci = cellY * 40 + cellX;
				const screenByte = cellColors[ci] ?? 0;
				switch (pixelValue & 0x03) {
					case 0: return bgColor;
					case 1: return (screenByte >> 4) & 0x0f;
					case 2: return screenByte & 0x0f;
					case 3: return cellColors[1000 + ci] & 0x0f;
					default: return 0;
				}
			} else {
				// sprite / charset: 0 = transparent/bg, 1 = fg
				return pixelValue === 0 ? bgColor : fgColor;
			}
		}
	};
}

export const editor = createEditorStore();
export type EditorStore = ReturnType<typeof createEditorStore>;
