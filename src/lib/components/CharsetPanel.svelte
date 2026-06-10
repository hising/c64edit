<script lang="ts">
	import { editor } from '$lib/stores/editor.svelte';

	const CHARS_PER_ROW = 16;
	const TOTAL_CHARS = 256;

	// Draw a single 8×8 char to a canvas using ImageData
	function renderChar(ctx: CanvasRenderingContext2D, charIdx: number, x: number, y: number, scale: number) {
		const pixels = editor.charsetPixels[charIdx];
		const fg = editor.fgColor;
		const bg = editor.bgColor;
		const fgColor = editor.palette[fg];
		const bgColor = editor.palette[bg];

		for (let py = 0; py < 8; py++) {
			for (let px = 0; px < 8; px++) {
				const on = pixels[py * 8 + px] !== 0;
				ctx.fillStyle = on ? fgColor.hex : bgColor.hex;
				ctx.fillRect(x + px * scale, y + py * scale, scale, scale);
			}
		}

		// Highlight active
		if (charIdx === editor.activeCharIndex) {
			ctx.strokeStyle = 'rgba(255,255,0,0.8)';
			ctx.lineWidth = 1;
			ctx.strokeRect(x, y, 8 * scale, 8 * scale);
		}
	}

	let sheetCanvas: HTMLCanvasElement;
	const SCALE = 2;
	const CHAR_PX = 8 * SCALE;

	function renderSheet() {
		if (!sheetCanvas) return;
		const cols = CHARS_PER_ROW;
		const rows = TOTAL_CHARS / cols;
		sheetCanvas.width = cols * CHAR_PX;
		sheetCanvas.height = rows * CHAR_PX;
		const ctx = sheetCanvas.getContext('2d')!;
		for (let i = 0; i < TOTAL_CHARS; i++) {
			const cx = (i % cols) * CHAR_PX;
			const cy = Math.floor(i / cols) * CHAR_PX;
			renderChar(ctx, i, cx, cy, SCALE);
		}
	}

	import { tick } from 'svelte';
	import { onMount } from 'svelte';

	onMount(renderSheet);

	$effect(() => {
		const _chars = editor.charsetPixels;
		const _active = editor.activeCharIndex;
		const _fg = editor.fgColor;
		const _bg = editor.bgColor;
		tick().then(renderSheet);
	});

	function onSheetClick(e: MouseEvent) {
		if (!sheetCanvas) return;
		const rect = sheetCanvas.getBoundingClientRect();
		const cx = Math.floor((e.clientX - rect.left) * (sheetCanvas.width / rect.width) / CHAR_PX);
		const cy = Math.floor((e.clientY - rect.top) * (sheetCanvas.height / rect.height) / CHAR_PX);
		const idx = cy * CHARS_PER_ROW + cx;
		if (idx >= 0 && idx < TOTAL_CHARS) {
			editor.activeCharIndex = idx;
			// copy active char to sprite pixel canvas (as edit buffer)
			const src = editor.charsetPixels[idx];
			// switch mode to charset if not already
			if (editor.mode !== 'charset') editor.mode = 'charset';
		}
	}

	function exportCharsetBin() {
		const data = new Uint8Array(TOTAL_CHARS * 8);
		for (let c = 0; c < TOTAL_CHARS; c++) {
			const pixels = editor.charsetPixels[c];
			for (let row = 0; row < 8; row++) {
				let byte = 0;
				for (let col = 0; col < 8; col++) {
					if (pixels[row * 8 + col]) byte |= 1 << (7 - col);
				}
				data[c * 8 + row] = byte;
			}
		}
		const blob = new Blob([data], { type: 'application/octet-stream' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${editor.projectName}-charset.bin`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="flex flex-col gap-2 p-2">
	<div class="flex items-center justify-between">
		<span class="text-xs text-gray-500 pixel-font uppercase tracking-widest">Charset</span>
		<button
			class="text-xs pixel-font px-2 py-0.5 border border-gray-600 rounded text-gray-400 hover:text-gray-200 hover:border-gray-400"
			onclick={exportCharsetBin}
			title="Export charset as raw binary"
		>Export</button>
	</div>

	<div class="text-xs text-gray-500 pixel-font">
		Char #{editor.activeCharIndex} (${editor.activeCharIndex.toString(16).padStart(2,'0').toUpperCase()})
	</div>

	<div class="overflow-auto border border-gray-700 rounded cursor-pointer">
		<canvas
			bind:this={sheetCanvas}
			style="display:block; image-rendering:pixelated;"
			onclick={onSheetClick}
		></canvas>
	</div>

	<div class="text-xs text-gray-600 pixel-font text-center">
		Click a char to select for editing
	</div>
</div>
