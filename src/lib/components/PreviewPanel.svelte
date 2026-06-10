<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { editor } from '$lib/stores/editor.svelte';
	import { C64_PALETTE } from '$lib/c64/palette';

	let canvas: HTMLCanvasElement;
	/** Scale factor for the preview canvas (1 = actual C64 resolution) */
	let previewScale = $state(1);

	function render() {
		if (!canvas) return;
		const mode = editor.modeInfo;
		const w = mode.width;
		const h = mode.height;
		const aspect = mode.pixelAspect;

		canvas.width = w * aspect * previewScale;
		canvas.height = h * previewScale;

		const ctx = canvas.getContext('2d')!;
		ctx.imageSmoothingEnabled = false;

		const pixels = editor.getActivePixels();
		const imageData = ctx.createImageData(canvas.width, canvas.height);
		const data = imageData.data;

		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				const pv = pixels[y * w + x];
				const cellX = Math.floor(x / (aspect === 2 ? 4 : 8));
				const cellY = Math.floor(y / 8);
				const colorIdx = editor.resolveColor(pv, cellX, cellY);
				const color = C64_PALETTE[colorIdx & 0x0f];

				for (let sy = 0; sy < previewScale; sy++) {
					for (let px = 0; px < aspect * previewScale; px++) {
						const i = ((y * previewScale + sy) * canvas.width + x * aspect * previewScale + px) * 4;
						data[i] = color.r;
						data[i + 1] = color.g;
						data[i + 2] = color.b;
						data[i + 3] = 255;
					}
				}
			}
		}

		ctx.putImageData(imageData, 0, 0);
	}

	onMount(() => {
		render();
	});

	$effect(() => {
		const _pixels = editor.pixels;
		const _spritePixels = editor.spritePixels;
		const _mode = editor.mode;
		const _fg = editor.fgColor;
		const _bg = editor.bgColor;
		const _cellColors = editor.cellColors;
		tick().then(() => render());
	});
</script>

<div class="flex flex-col gap-2 p-2">
	<div class="flex items-center justify-between">
		<span class="text-xs text-gray-500 pixel-font uppercase tracking-widest">Preview</span>
		<div class="flex gap-1">
			{#each [1, 2] as s}
				<button
					class="text-xs pixel-font px-1 border rounded {previewScale === s ? 'border-cyan-400 text-cyan-300' : 'border-gray-600 text-gray-500'}"
					onclick={() => { previewScale = s; tick().then(render); }}
				>{s}×</button>
			{/each}
		</div>
	</div>
	<div class="overflow-hidden rounded border border-gray-700">
		<canvas
			bind:this={canvas}
			style="display: block; image-rendering: pixelated; max-width: 100%;"
		></canvas>
	</div>
	<div class="text-xs text-gray-600 pixel-font text-center">
		{editor.modeInfo.width * editor.modeInfo.pixelAspect * previewScale}×{editor.modeInfo.height * previewScale}px
	</div>
</div>
