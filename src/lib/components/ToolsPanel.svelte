<script lang="ts">
	import { editor, TOOLS } from '$lib/stores/editor.svelte';
	import { C64_PALETTE } from '$lib/c64/palette';

	// Multicolor slot labels
	const MC_SLOTS = ['BG', 'C1', 'C2', 'C3'];
	const MC_SLOT_TITLES = [
		'Background color (global)',
		'Color 1 (screen RAM hi nibble)',
		'Color 2 (screen RAM lo nibble)',
		'Color 3 (color RAM)'
	];
</script>

<aside class="flex flex-col gap-3 p-2 bg-gray-900 border-r border-gray-700 w-14 items-center select-none">
	<!-- Drawing tools -->
	<div class="flex flex-col gap-1 w-full items-center">
		{#each TOOLS as t}
			<button
				class="tool-btn {editor.tool === t.id ? 'tool-btn--active' : ''}"
				onclick={() => (editor.tool = t.id)}
				title="{t.label} ({t.shortcut})"
			>
				<span class="text-base">{t.icon}</span>
			</button>
		{/each}
	</div>

	<div class="w-full h-px bg-gray-700"></div>

	<!-- FG / BG color swatches -->
	<div class="relative w-10 h-10">
		<!-- BG swatch (back) -->
		<button
			class="absolute bottom-0 right-0 w-7 h-7 rounded border-2 border-gray-600 hover:border-gray-400 transition-colors"
			style="background: {C64_PALETTE[editor.bgColor].hex}"
			title="Background color: {C64_PALETTE[editor.bgColor].name}"
			onclick={() => {/* palette picker handles this */}}
		></button>
		<!-- FG swatch (front) -->
		<button
			class="absolute top-0 left-0 w-7 h-7 rounded border-2 border-white hover:border-yellow-300 transition-colors z-10"
			style="background: {C64_PALETTE[editor.fgColor].hex}"
			title="Foreground color: {C64_PALETTE[editor.fgColor].name}"
			onclick={() => {/* palette picker handles this */}}
		></button>
	</div>

	<!-- Multicolor slot selector (only visible in multicolor mode) -->
	{#if editor.mode === 'multicolor'}
		<div class="flex flex-col gap-1 w-full items-center">
			<span class="text-gray-500 text-xs">MC</span>
			{#each MC_SLOTS as slot, i}
				<button
					class="w-10 h-5 rounded text-xs pixel-font border transition-colors {editor.mcDrawSlot === i ? 'border-yellow-400 text-yellow-300' : 'border-gray-600 text-gray-400'}"
					onclick={() => (editor.mcDrawSlot = i)}
					title="{MC_SLOT_TITLES[i]}"
				>{slot}</button>
			{/each}
		</div>
	{/if}

	<div class="flex-1"></div>

	<!-- Zoom quick controls -->
	<div class="flex flex-col gap-1 items-center">
		<button class="tool-btn text-sm" onclick={() => editor.zoom++} title="Zoom in (+)">+</button>
		<span class="text-xs text-gray-400 pixel-font">{editor.zoom}x</span>
		<button class="tool-btn text-sm" onclick={() => editor.zoom--} title="Zoom out (-)">−</button>
	</div>
</aside>

<style>
	.tool-btn {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		border: 1px solid transparent;
		background: transparent;
		cursor: pointer;
		transition: background 0.1s, border-color 0.1s;
		color: #d0d0d0;
	}
	.tool-btn:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.2);
	}
	.tool-btn--active {
		background: rgba(0, 180, 255, 0.15);
		border-color: rgba(0, 180, 255, 0.6);
		color: #7dd3fc;
	}
</style>
