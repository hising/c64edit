<script lang="ts">
	import { editor, TOOLS } from '$lib/stores/editor.svelte';
	import { MODES } from '$lib/c64/modes';
	import { exportPng, downloadBlob, downloadBinary, encodeKoala, encodeHiRes, exportAsm } from '$lib/c64/export';
	import { C64_PALETTE } from '$lib/c64/palette';

	const modes = Object.values(MODES);

	async function handleExportPng() {
		const w = editor.modeInfo.width;
		const h = editor.modeInfo.height;
		const rawPixels = editor.getActivePixels();
		// Resolve each pixel to its actual C64 palette index before rendering
		const resolved = new Uint8Array(w * h);
		for (let y = 0; y < h; y++) {
			for (let x = 0; x < w; x++) {
				const pv = rawPixels[y * w + x];
				const cellX = Math.floor(x / (editor.modeInfo.pixelAspect === 2 ? 4 : 8));
				const cellY = Math.floor(y / 8);
				resolved[y * w + x] = editor.resolveColor(pv, cellX, cellY);
			}
		}
		const blob = await exportPng(resolved, w, h, editor.modeInfo.pixelAspect, C64_PALETTE);
		downloadBlob(blob, `${editor.projectName}.png`);
		editor.statusMessage = 'Exported PNG';
	}

	function handleExportKoala() {
		if (editor.mode !== 'multicolor') {
			editor.statusMessage = 'Koala export requires Multicolor mode';
			return;
		}
		const data = encodeKoala(editor.pixels, editor.cellColors, editor.bgColor);
		downloadBinary(data, `${editor.projectName}.kla`);
		editor.statusMessage = 'Exported Koala (.kla)';
	}

	function handleExportHiRes() {
		if (editor.mode !== 'hires') {
			editor.statusMessage = 'HiRes export requires HiRes mode';
			return;
		}
		const data = encodeHiRes(editor.pixels, editor.cellColors, editor.bgColor);
		downloadBinary(data, `${editor.projectName}.art`);
		editor.statusMessage = 'Exported HiRes (.art)';
	}

	function handleExportAsm() {
		const pixels = editor.getActivePixels();
		const asm = exportAsm(pixels, editor.projectName.replace(/[^a-zA-Z0-9_]/g, '_'));
		const blob = new Blob([asm], { type: 'text/plain' });
		downloadBlob(blob, `${editor.projectName}.asm`);
		editor.statusMessage = 'Exported ASM';
	}

	function handleNew() {
		if (editor.isDirty && !confirm('Discard changes?')) return;
		editor.clearCanvas();
		editor.projectName = 'untitled';
		editor.isDirty = false;
	}

	let exportMenuOpen = $state(false);
	let modeMenuOpen = $state(false);

	function closeMenus() {
		exportMenuOpen = false;
		modeMenuOpen = false;
	}
</script>

<svelte:window onclick={closeMenus} />

<header class="flex items-center gap-1 px-2 py-1 bg-gray-900 border-b border-gray-700 select-none" style="min-height:40px">
	<!-- App name -->
	<span class="text-yellow-400 font-bold pixel-font mr-3 text-sm tracking-widest">C64EDIT</span>

	<!-- File actions -->
	<button
		class="toolbar-btn"
		onclick={handleNew}
		title="New (Ctrl+N)"
	>NEW</button>

	<!-- Export menu -->
	<div class="relative">
		<button
			class="toolbar-btn"
			onclick={(e) => { e.stopPropagation(); exportMenuOpen = !exportMenuOpen; modeMenuOpen = false; }}
			title="Export"
		>EXPORT ▾</button>
		{#if exportMenuOpen}
			<div class="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg z-50 min-w-40">
				<button class="menu-item w-full text-left" onclick={handleExportPng}>PNG image</button>
				<button class="menu-item w-full text-left" onclick={handleExportKoala}>Koala (.kla) multicolor</button>
				<button class="menu-item w-full text-left" onclick={handleExportHiRes}>HiRes Art Studio (.art)</button>
				<button class="menu-item w-full text-left" onclick={handleExportAsm}>Assembly hex dump (.asm)</button>
			</div>
		{/if}
	</div>

	<div class="w-px h-6 bg-gray-600 mx-1"></div>

	<!-- Mode selector -->
	<div class="relative">
		<button
			class="toolbar-btn text-cyan-300"
			onclick={(e) => { e.stopPropagation(); modeMenuOpen = !modeMenuOpen; exportMenuOpen = false; }}
			title="Switch mode"
		>{MODES[editor.mode].label} ▾</button>
		{#if modeMenuOpen}
			<div class="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg z-50 min-w-52">
				{#each modes as m}
					<button
						class="menu-item w-full text-left {editor.mode === m.id ? 'text-cyan-300' : ''}"
						onclick={() => { editor.mode = m.id; closeMenus(); }}
					>
						<div class="font-semibold">{m.label}</div>
						<div class="text-xs text-gray-400">{m.description}</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<div class="w-px h-6 bg-gray-600 mx-1"></div>

	<!-- Zoom controls -->
	<button class="toolbar-btn" onclick={() => editor.zoom--} title="Zoom out (-)">−</button>
	<span class="text-xs text-gray-300 w-8 text-center">{editor.zoom}×</span>
	<button class="toolbar-btn" onclick={() => editor.zoom++} title="Zoom in (+)">+</button>

	<div class="w-px h-6 bg-gray-600 mx-1"></div>

	<!-- Grid toggle -->
	<button
		class="toolbar-btn {editor.showGrid ? 'text-yellow-300' : ''}"
		onclick={() => (editor.showGrid = !editor.showGrid)}
		title="Toggle grid (G)"
	>GRID</button>

	<!-- Preview toggle -->
	<button
		class="toolbar-btn {editor.showPreview ? 'text-yellow-300' : ''}"
		onclick={() => (editor.showPreview = !editor.showPreview)}
		title="Toggle preview (P)"
	>PREVIEW</button>

	<div class="w-px h-6 bg-gray-600 mx-1"></div>

	<!-- Undo/Redo -->
	<button
		class="toolbar-btn"
		onclick={() => editor.undo()}
		title="Undo (Ctrl+Z)"
		disabled={editor.historyIndex <= 0}
	>UNDO</button>
	<button
		class="toolbar-btn"
		onclick={() => editor.redo()}
		title="Redo (Ctrl+Y)"
		disabled={editor.historyIndex >= editor.historyLength - 1}
	>REDO</button>

	<div class="flex-1"></div>

	<!-- Project name -->
	<input
		class="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded border border-gray-600 focus:border-cyan-500 outline-none w-32 pixel-font"
		value={editor.projectName}
		oninput={(e) => (editor.projectName = (e.target as HTMLInputElement).value)}
		placeholder="filename"
		title="Project name"
	/>
	{#if editor.isDirty}
		<span class="text-orange-400 text-xs ml-1">●</span>
	{/if}
</header>

<style>
	:global(.toolbar-btn) {
		padding: 2px 8px;
		font-size: 0.7rem;
		font-family: 'Courier New', monospace;
		background: transparent;
		color: #d0d0d0;
		border: 1px solid transparent;
		border-radius: 3px;
		cursor: pointer;
		transition: background 0.1s, border-color 0.1s;
		letter-spacing: 0.05em;
	}
	:global(.toolbar-btn:hover:not(:disabled)) {
		background: rgba(255,255,255,0.08);
		border-color: rgba(255,255,255,0.2);
	}
	:global(.toolbar-btn:disabled) {
		opacity: 0.35;
		cursor: default;
	}
	:global(.menu-item) {
		padding: 6px 12px;
		font-size: 0.75rem;
		font-family: 'Courier New', monospace;
		color: #d0d0d0;
		cursor: pointer;
	}
	:global(.menu-item:hover) {
		background: rgba(255,255,255,0.1);
	}
</style>
