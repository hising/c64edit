<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { editor } from '$lib/stores/editor.svelte';
	import { C64_PALETTE } from '$lib/c64/palette';

	let canvas: HTMLCanvasElement;
	let overlayCanvas: HTMLCanvasElement; // for grid + selection overlay
	let containerEl: HTMLDivElement;

	// Interaction state
	let isDrawing = false;
	let lastX = -1;
	let lastY = -1;
	let lineStartX = -1;
	let lineStartY = -1;
	let linePreviewPixels: Uint8Array | null = null;

	// Rect drag state
	let rectStartX = -1;
	let rectStartY = -1;

	// ── Rendering ─────────────────────────────────────────────────────────────

	function pixelToCanvas(px: number): number {
		return px * editor.zoom * editor.modeInfo.pixelAspect;
	}

	function canvasToPixel(cx: number): [number, number] {
		const cellPx = editor.zoom * editor.modeInfo.pixelAspect;
		const cellPy = editor.zoom;
		return [
			Math.floor(cx / cellPx),
			Math.floor(cx / cellPy) // reused below with correct y
		];
	}

	function canvasXYtoPixelXY(cx: number, cy: number): [number, number] {
		const pixelW = editor.zoom * editor.modeInfo.pixelAspect;
		const pixelH = editor.zoom;
		return [Math.floor(cx / pixelW), Math.floor(cy / pixelH)];
	}

	function renderCanvas() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d')!;
		const mode = editor.modeInfo;
		const w = mode.width;
		const h = mode.height;
		const pixelW = editor.zoom * mode.pixelAspect;
		const pixelH = editor.zoom;

		canvas.width = w * pixelW;
		canvas.height = h * pixelH;

		const pixels = editor.getActivePixels();

		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				const pv = pixels[y * w + x];
				const cellX = Math.floor(x / (mode.pixelAspect === 2 ? 4 : 8));
				const cellY = Math.floor(y / 8);
				const colorIdx = editor.resolveColor(pv, cellX, cellY);
				const color = C64_PALETTE[colorIdx & 0x0f];
				ctx.fillStyle = color.hex;
				ctx.fillRect(x * pixelW, y * pixelH, pixelW, pixelH);
			}
		}

		renderOverlay();
	}

	function renderOverlay() {
		if (!overlayCanvas) return;
		const ctx = overlayCanvas.getContext('2d')!;
		const mode = editor.modeInfo;
		const w = mode.width;
		const h = mode.height;
		const pixelW = editor.zoom * mode.pixelAspect;
		const pixelH = editor.zoom;

		overlayCanvas.width = canvas.width;
		overlayCanvas.height = canvas.height;
		ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

		// Grid
		if (editor.showGrid && editor.zoom >= 2) {
			ctx.strokeStyle = 'rgba(255,255,255,0.12)';
			ctx.lineWidth = 0.5;

			// Fine pixel grid
			if (editor.zoom >= 4) {
				for (let x = 0; x <= w; x++) {
					ctx.beginPath();
					ctx.moveTo(x * pixelW, 0);
					ctx.lineTo(x * pixelW, h * pixelH);
					ctx.stroke();
				}
				for (let y = 0; y <= h; y++) {
					ctx.beginPath();
					ctx.moveTo(0, y * pixelH);
					ctx.lineTo(w * pixelW, y * pixelH);
					ctx.stroke();
				}
			}

			// 8×8 cell grid
			ctx.strokeStyle = 'rgba(100,180,255,0.25)';
			ctx.lineWidth = 1;
			const cellW = 8 * pixelW;
			const cellH = 8 * pixelH;
			for (let cx = 0; cx <= w / 8; cx++) {
				ctx.beginPath();
				ctx.moveTo(cx * cellW, 0);
				ctx.lineTo(cx * cellW, h * pixelH);
				ctx.stroke();
			}
			for (let cy = 0; cy <= h / 8; cy++) {
				ctx.beginPath();
				ctx.moveTo(0, cy * cellH);
				ctx.lineTo(w * pixelW, cy * cellH);
				ctx.stroke();
			}
		}

		// Selection rectangle
		if (editor.selection) {
			const s = editor.selection;
			ctx.strokeStyle = 'rgba(255,255,0,0.8)';
			ctx.lineWidth = 1;
			ctx.setLineDash([4, 4]);
			ctx.strokeRect(s.x * pixelW, s.y * pixelH, s.w * pixelW, s.h * pixelH);
			ctx.setLineDash([]);
		}

		// Line preview
		if (linePreviewPixels && editor.tool === 'line' && isDrawing) {
			// already rendered in main canvas
		}
	}

	// ── Mouse event helpers ───────────────────────────────────────────────────

	function getPixelCoords(e: MouseEvent): [number, number] {
		const rect = canvas.getBoundingClientRect();
		const cx = e.clientX - rect.left;
		const cy = e.clientY - rect.top;
		// Scale from display to canvas
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		return canvasXYtoPixelXY(cx * scaleX, cy * scaleY);
	}

	function applyTool(x: number, y: number, isStart = false) {
		const tool = editor.tool;
		switch (tool) {
			case 'pencil':
				if (isStart || (lastX !== x || lastY !== y)) {
					if (!isStart && lastX >= 0) {
						editor.drawLine(lastX, lastY, x, y);
					} else {
						editor.setPixel(x, y);
					}
				}
				break;
			case 'eraser':
				if (!isStart && lastX >= 0) {
					editor.drawLine(lastX, lastY, x, y, 0);
				} else {
					editor.erasePixel(x, y);
				}
				break;
			case 'pick': {
				const pixels = editor.getActivePixels();
				const w = editor.modeInfo.width;
				const pv = pixels[y * w + x];
				const cellX = Math.floor(x / (editor.modeInfo.pixelAspect === 2 ? 4 : 8));
				const cellY = Math.floor(y / 8);
				const colorIdx = editor.resolveColor(pv, cellX, cellY);
				editor.fgColor = colorIdx;
				editor.statusMessage = `Picked color: ${C64_PALETTE[colorIdx].name}`;
				break;
			}
		}
	}

	function onMouseDown(e: MouseEvent) {
		if (e.button !== 0 && e.button !== 2) return;
		e.preventDefault();

		const [x, y] = getPixelCoords(e);
		isDrawing = true;

		// Right-click: pick bg color
		if (e.button === 2) {
			const pixels = editor.getActivePixels();
			const w = editor.modeInfo.width;
			const pv = pixels[y * w + x];
			const cellX = Math.floor(x / (editor.modeInfo.pixelAspect === 2 ? 4 : 8));
			const cellY = Math.floor(y / 8);
			editor.bgColor = editor.resolveColor(pv, cellX, cellY);
			isDrawing = false;
			return;
		}

		editor.pushHistory();

		if (editor.tool === 'fill') {
			editor.floodFill(x, y, editor.mode === 'multicolor' ? editor.mcDrawSlot : editor.fgColor);
			isDrawing = false;
			renderCanvas();
			return;
		}

		if (editor.tool === 'line') {
			lineStartX = x;
			lineStartY = y;
			lastX = x;
			lastY = y;
			return;
		}

		if (editor.tool === 'rect') {
			rectStartX = x;
			rectStartY = y;
			lastX = x;
			lastY = y;
			return;
		}

		applyTool(x, y, true);
		lastX = x;
		lastY = y;
		renderCanvas();
	}

	function onMouseMove(e: MouseEvent) {
		const [x, y] = getPixelCoords(e);
		editor.cursorPos = { x, y };

		if (!isDrawing) {
			renderOverlay();
			return;
		}

		if (editor.tool === 'line') {
			// Preview: restore snapshot then draw preview line
			renderCanvas(); // full re-render (uses committed history)
			// Draw preview line on overlay
			const ctx = overlayCanvas.getContext('2d')!;
			const mode = editor.modeInfo;
			const pixelW = editor.zoom * mode.pixelAspect;
			const pixelH = editor.zoom;
			const colorIdx = editor.mode === 'multicolor' ? editor.mcDrawSlot : editor.fgColor;
			const color = C64_PALETTE[editor.resolveColor(colorIdx, 0, 0)];
			ctx.fillStyle = color.hex;

			// Bresenham preview
			let x0 = lineStartX, y0 = lineStartY, x1 = x, y1 = y;
			const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
			const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
			let err = dx - dy;
			while (true) {
				ctx.fillRect(x0 * pixelW, y0 * pixelH, pixelW, pixelH);
				if (x0 === x1 && y0 === y1) break;
				const e2 = 2 * err;
				if (e2 > -dy) { err -= dy; x0 += sx; }
				if (e2 < dx) { err += dx; y0 += sy; }
			}
			return;
		}

		if (editor.tool === 'rect') {
			renderCanvas();
			const ctx = overlayCanvas.getContext('2d')!;
			const mode = editor.modeInfo;
			const pixelW = editor.zoom * mode.pixelAspect;
			const pixelH = editor.zoom;
			const colorIdx = editor.mode === 'multicolor' ? editor.mcDrawSlot : editor.fgColor;
			const color = C64_PALETTE[editor.resolveColor(colorIdx, 0, 0)];
			ctx.strokeStyle = color.hex;
			ctx.lineWidth = Math.max(1, editor.zoom / 2);
			const minX = Math.min(rectStartX, x);
			const minY = Math.min(rectStartY, y);
			const maxX = Math.max(rectStartX, x);
			const maxY = Math.max(rectStartY, y);
			ctx.strokeRect(minX * pixelW, minY * pixelH, (maxX - minX + 1) * pixelW, (maxY - minY + 1) * pixelH);
			return;
		}

		if (x !== lastX || y !== lastY) {
			applyTool(x, y);
			lastX = x;
			lastY = y;
			renderCanvas();
		}
	}

	function onMouseUp(e: MouseEvent) {
		if (!isDrawing) return;
		const [x, y] = getPixelCoords(e);

		if (editor.tool === 'line') {
			editor.drawLine(lineStartX, lineStartY, x, y);
			lineStartX = -1;
			lineStartY = -1;
		} else if (editor.tool === 'rect') {
			editor.drawRect(rectStartX, rectStartY, x, y);
			rectStartX = -1;
			rectStartY = -1;
		}

		isDrawing = false;
		lastX = -1;
		lastY = -1;
		renderCanvas();
	}

	function onMouseLeave() {
		editor.cursorPos = null;
		if (isDrawing) {
			isDrawing = false;
			lastX = -1;
			lastY = -1;
		}
		renderOverlay();
	}

	// ── Lifecycle ─────────────────────────────────────────────────────────────

	onMount(() => {
		renderCanvas();
	});

	// Re-render when relevant state changes
	$effect(() => {
		// Depend on reactive state
		const _pixels = editor.pixels;
		const _spritePixels = editor.spritePixels;
		const _zoom = editor.zoom;
		const _showGrid = editor.showGrid;
		const _mode = editor.mode;
		const _fg = editor.fgColor;
		const _bg = editor.bgColor;
		const _cellColors = editor.cellColors;
		tick().then(() => renderCanvas());
	});
</script>

<div class="relative select-none" bind:this={containerEl}>
	<canvas
		bind:this={canvas}
		style="display: block; image-rendering: pixelated;"
		onmousedown={onMouseDown}
		onmousemove={onMouseMove}
		onmouseup={onMouseUp}
		onmouseleave={onMouseLeave}
		oncontextmenu={(e) => e.preventDefault()}
		class="cursor-crosshair"
	></canvas>
	<canvas
		bind:this={overlayCanvas}
		style="position: absolute; top: 0; left: 0; pointer-events: none; image-rendering: pixelated;"
	></canvas>
</div>
