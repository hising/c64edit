<script lang="ts">
	import { editor } from '$lib/stores/editor.svelte';
	import { MODES } from '$lib/c64/modes';
</script>

<footer class="flex items-center gap-4 px-3 py-1 bg-gray-950 border-t border-gray-800 text-xs pixel-font text-gray-400 select-none" style="min-height: 24px">
	<!-- Mode -->
	<span class="text-cyan-600">{MODES[editor.mode].label}</span>

	<!-- Cursor position -->
	{#if editor.cursorPos}
		<span>
			x:<span class="text-gray-200">{editor.cursorPos.x}</span>
			y:<span class="text-gray-200">{editor.cursorPos.y}</span>
		</span>
	{:else}
		<span class="text-gray-600">—</span>
	{/if}

	<!-- Canvas size -->
	<span>{editor.modeInfo.width}×{editor.modeInfo.height}</span>

	<!-- Zoom -->
	<span>zoom: <span class="text-gray-200">{editor.zoom}×</span></span>

	<div class="flex-1"></div>

	<!-- Status message -->
	<span class="text-gray-300">{editor.statusMessage}</span>

	<!-- Dirty indicator -->
	{#if editor.isDirty}
		<span class="text-orange-400">unsaved</span>
	{/if}

	<!-- Shortcuts hint -->
	<span class="text-gray-600">| B=pencil E=eraser F=fill L=line R=rect I=pick | Z=undo Y=redo | G=grid P=preview</span>
</footer>
