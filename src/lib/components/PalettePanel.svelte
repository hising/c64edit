<script lang="ts">
	import { editor } from '$lib/stores/editor.svelte';
	import { C64_PALETTE } from '$lib/c64/palette';

	// Which "slot" we're assigning to when clicking a color
	type ColorTarget = 'fg' | 'bg' | 'mc1' | 'mc2';
	let activeTarget = $state<ColorTarget>('fg');

	function selectColor(idx: number) {
		switch (activeTarget) {
			case 'fg': editor.fgColor = idx; break;
			case 'bg': editor.bgColor = idx; break;
			case 'mc1': editor.mc1Color = idx; break;
			case 'mc2': editor.mc2Color = idx; break;
		}
	}

	function isSelected(idx: number): boolean {
		switch (activeTarget) {
			case 'fg': return editor.fgColor === idx;
			case 'bg': return editor.bgColor === idx;
			case 'mc1': return editor.mc1Color === idx;
			case 'mc2': return editor.mc2Color === idx;
		}
	}

	function mcSlotColor(slot: number): string {
		switch (slot) {
			case 0: return C64_PALETTE[editor.bgColor].hex;
			case 1: return C64_PALETTE[editor.mc1Color].hex;
			case 2: return C64_PALETTE[editor.mc2Color].hex;
			default: return '#888';
		}
	}

	const TARGET_LABELS: { id: ColorTarget; label: string; title: string }[] = [
		{ id: 'fg', label: 'FG', title: 'Foreground / draw color' },
		{ id: 'bg', label: 'BG', title: 'Background color' },
		{ id: 'mc1', label: 'C1', title: 'Multicolor 1 (screen RAM hi)' },
		{ id: 'mc2', label: 'C2', title: 'Multicolor 2 (screen RAM lo)' }
	];

	function currentColor(): number {
		switch (activeTarget) {
			case 'fg': return editor.fgColor;
			case 'bg': return editor.bgColor;
			case 'mc1': return editor.mc1Color;
			case 'mc2': return editor.mc2Color;
		}
	}
</script>

<aside class="flex flex-col gap-3 p-3 bg-gray-900 border-l border-gray-700 w-48 select-none overflow-y-auto">
	<div class="text-xs text-gray-500 pixel-font uppercase tracking-widest">Palette</div>

	<!-- Color target selector -->
	<div class="flex gap-1 flex-wrap">
		{#each TARGET_LABELS as t}
			<button
				class="px-2 py-0.5 text-xs pixel-font rounded border transition-colors {activeTarget === t.id ? 'border-cyan-400 text-cyan-300 bg-cyan-900/20' : 'border-gray-600 text-gray-400'}"
				onclick={() => (activeTarget = t.id)}
				title={t.title}
			>{t.label}</button>
		{/each}
	</div>

	<!-- Color grid (4×4) -->
	<div class="grid grid-cols-4 gap-1">
		{#each C64_PALETTE as color}
			<button
				class="w-9 h-9 rounded transition-all {isSelected(color.index) ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}"
				style="background: {color.hex}; border: 2px solid {isSelected(color.index) ? 'white' : 'transparent'}"
				onclick={() => selectColor(color.index)}
				title="{color.index}: {color.name}"
			></button>
		{/each}
	</div>

	<!-- Active color info -->
	<div class="flex items-center gap-2 mt-1">
		<div class="w-8 h-8 rounded border border-gray-500" style="background: {C64_PALETTE[currentColor()].hex}"></div>
		<div>
			<div class="text-xs text-gray-300 pixel-font">{C64_PALETTE[currentColor()].name}</div>
			<div class="text-xs text-gray-500">#{currentColor()}</div>
		</div>
	</div>

	<div class="h-px bg-gray-700 my-1"></div>

	<!-- Current colors summary -->
	<div class="text-xs text-gray-500 pixel-font uppercase tracking-widest">Active colors</div>
	<div class="flex flex-col gap-1 text-xs pixel-font">
		<div class="flex items-center gap-2">
			<div class="w-4 h-4 rounded" style="background: {C64_PALETTE[editor.fgColor].hex}; border: 1px solid #666"></div>
			<span class="text-gray-400">FG</span>
			<span class="text-gray-300">{C64_PALETTE[editor.fgColor].name}</span>
		</div>
		<div class="flex items-center gap-2">
			<div class="w-4 h-4 rounded" style="background: {C64_PALETTE[editor.bgColor].hex}; border: 1px solid #666"></div>
			<span class="text-gray-400">BG</span>
			<span class="text-gray-300">{C64_PALETTE[editor.bgColor].name}</span>
		</div>
		{#if editor.mode === 'multicolor'}
			<div class="flex items-center gap-2">
				<div class="w-4 h-4 rounded" style="background: {C64_PALETTE[editor.mc1Color].hex}; border: 1px solid #666"></div>
				<span class="text-gray-400">C1</span>
				<span class="text-gray-300">{C64_PALETTE[editor.mc1Color].name}</span>
			</div>
			<div class="flex items-center gap-2">
				<div class="w-4 h-4 rounded" style="background: {C64_PALETTE[editor.mc2Color].hex}; border: 1px solid #666"></div>
				<span class="text-gray-400">C2</span>
				<span class="text-gray-300">{C64_PALETTE[editor.mc2Color].name}</span>
			</div>
		{/if}
	</div>

	<div class="h-px bg-gray-700 my-1"></div>

	<!-- Quick fill -->
	<div class="text-xs text-gray-500 pixel-font uppercase tracking-widest">Canvas</div>
	<div class="flex flex-col gap-1">
		<button
			class="text-xs pixel-font px-2 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-gray-300 text-left"
			onclick={() => editor.fillCanvas(editor.mode === 'multicolor' ? editor.mcDrawSlot : editor.fgColor)}
			title="Fill entire canvas with foreground color"
		>Fill with FG</button>
		<button
			class="text-xs pixel-font px-2 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-gray-300 text-left"
			onclick={() => editor.clearCanvas()}
			title="Clear canvas (fill with color 0)"
		>Clear</button>
	</div>

	{#if editor.mode === 'multicolor'}
		<div class="h-px bg-gray-700 my-1"></div>
		<div class="text-xs text-gray-500 pixel-font uppercase tracking-widest">Draw slot</div>
		<div class="text-xs text-gray-400 pixel-font leading-relaxed">
			Click a MC slot to choose which color you're drawing with.
		</div>
		<div class="flex flex-col gap-1">
			{#each [0,1,2,3] as slot}
				<button
					class="flex items-center gap-2 px-2 py-1 rounded text-xs pixel-font border transition-colors {editor.mcDrawSlot === slot ? 'border-yellow-400 bg-yellow-900/20 text-yellow-300' : 'border-gray-600 text-gray-400 hover:border-gray-400'}"
					onclick={() => (editor.mcDrawSlot = slot)}
				>
					<div class="w-4 h-4 rounded" style="background: {mcSlotColor(slot)}; border: 1px solid #666"></div>
					Slot {slot} {['(BG)','(C1)','(C2)','(C3)'][slot]}
				</button>
			{/each}
		</div>
	{/if}
</aside>
