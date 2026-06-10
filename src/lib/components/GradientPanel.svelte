<script lang="ts">
	import { editor } from '$lib/stores/editor.svelte';
	import { C64_PALETTE } from '$lib/c64/palette';
	import { generateGradient, sortByLuminance } from '$lib/c64/gradient';

	let fromColor = $state(0);
	let toColor = $state(1);
	let steps = $state(8);
	let gradient = $state<number[]>([]);

	function buildGradient() {
		gradient = generateGradient(fromColor, toColor, steps);
	}

	function applyGradient() {
		if (gradient.length === 0) return;
		const mode = editor.modeInfo;
		const w = mode.width;
		const h = mode.height;
		const linesPerColor = Math.floor(h / gradient.length);
		editor.pushHistory();

		for (let gi = 0; gi < gradient.length; gi++) {
			const colorIdx = gradient[gi];
			const startY = gi * linesPerColor;
			const endY = gi === gradient.length - 1 ? h : startY + linesPerColor;
			for (let y = startY; y < endY; y++) {
				for (let x = 0; x < w; x++) {
					if (editor.mode === 'hires') {
						// In hires: set cell color to have fg = colorIdx
						const cellX = Math.floor(x / 8);
						const cellY = Math.floor(y / 8);
						editor.setCellColor(cellX, cellY, colorIdx, editor.bgColor);
					} else {
						editor.setPixel(x, y, editor.mode === 'multicolor' ? 1 : 1);
					}
				}
			}
		}
		editor.statusMessage = `Gradient applied (${gradient.length} steps)`;
	}

	// Luminance sorted palette for reference
	const byLuminance = sortByLuminance();

	buildGradient();
</script>

<div class="p-3 flex flex-col gap-3">
	<div class="text-xs text-gray-500 pixel-font uppercase tracking-widest">Gradient</div>

	<!-- From / To color selectors -->
	<div class="flex flex-col gap-2">
		<div class="flex items-center gap-2">
			<span class="text-xs text-gray-400 w-6">From</span>
			<div class="flex flex-wrap gap-0.5">
				{#each C64_PALETTE as c}
					<button
						class="w-4 h-4 rounded-sm transition-transform {fromColor === c.index ? 'ring-1 ring-white scale-125' : 'hover:scale-110'}"
						style="background: {c.hex}"
						onclick={() => { fromColor = c.index; buildGradient(); }}
						title={c.name}
					></button>
				{/each}
			</div>
		</div>
		<div class="flex items-center gap-2">
			<span class="text-xs text-gray-400 w-6">To</span>
			<div class="flex flex-wrap gap-0.5">
				{#each C64_PALETTE as c}
					<button
						class="w-4 h-4 rounded-sm transition-transform {toColor === c.index ? 'ring-1 ring-white scale-125' : 'hover:scale-110'}"
						style="background: {c.hex}"
						onclick={() => { toColor = c.index; buildGradient(); }}
						title={c.name}
					></button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Steps slider -->
	<div class="flex items-center gap-2">
		<span class="text-xs text-gray-400 w-10">Steps</span>
		<input
			type="range"
			min="2"
			max="16"
			bind:value={steps}
			oninput={buildGradient}
			class="flex-1 accent-cyan-400"
		/>
		<span class="text-xs text-gray-300 w-4">{steps}</span>
	</div>

	<!-- Gradient preview -->
	{#if gradient.length > 0}
		<div class="flex rounded overflow-hidden h-6">
			{#each gradient as ci}
				<div class="flex-1 h-full" style="background: {C64_PALETTE[ci].hex}" title={C64_PALETTE[ci].name}></div>
			{/each}
		</div>
		<div class="text-xs text-gray-500 pixel-font text-center">
			{gradient.map(i => `$${i.toString(16)}`).join(',')}
		</div>
	{/if}

	<!-- Apply to canvas -->
	<button
		class="text-xs pixel-font px-2 py-1 bg-cyan-900/40 hover:bg-cyan-900/60 border border-cyan-700 rounded text-cyan-300 transition-colors"
		onclick={applyGradient}
		title="Apply gradient as horizontal color bands"
	>Apply to canvas</button>

	<!-- Luminance order reference -->
	<div class="mt-1">
		<div class="text-xs text-gray-500 pixel-font mb-1">Luminance order:</div>
		<div class="flex rounded overflow-hidden h-3">
			{#each byLuminance as c}
				<div class="flex-1 h-full" style="background: {c.hex}" title="{c.index}: {c.name}"></div>
			{/each}
		</div>
	</div>
</div>
