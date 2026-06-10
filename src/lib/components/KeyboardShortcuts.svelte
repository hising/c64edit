<script lang="ts">
	import { editor, TOOLS, type Tool } from '$lib/stores/editor.svelte';

	const TOOL_SHORTCUTS: Record<string, Tool> = {
		b: 'pencil',
		e: 'eraser',
		f: 'fill',
		l: 'line',
		r: 'rect',
		i: 'pick',
		s: 'select'
	};

	function onKeydown(e: KeyboardEvent) {
		// Don't intercept when typing in an input
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

		const key = e.key.toLowerCase();

		// Ctrl+Z / Cmd+Z = Undo
		if ((e.ctrlKey || e.metaKey) && key === 'z' && !e.shiftKey) {
			e.preventDefault();
			editor.undo();
			return;
		}

		// Ctrl+Shift+Z / Ctrl+Y = Redo
		if ((e.ctrlKey || e.metaKey) && (key === 'y' || (key === 'z' && e.shiftKey))) {
			e.preventDefault();
			editor.redo();
			return;
		}

		// Ctrl+N = New
		if ((e.ctrlKey || e.metaKey) && key === 'n') {
			e.preventDefault();
			if (editor.isDirty && !confirm('Discard changes?')) return;
			editor.clearCanvas();
			editor.projectName = 'untitled';
			editor.isDirty = false;
			return;
		}

		// Skip other Ctrl combos
		if (e.ctrlKey || e.metaKey || e.altKey) return;

		// G = toggle grid
		if (key === 'g') {
			editor.showGrid = !editor.showGrid;
			return;
		}

		// P = toggle preview
		if (key === 'p') {
			editor.showPreview = !editor.showPreview;
			return;
		}

		// + / = = zoom in
		if (key === '+' || key === '=') {
			editor.zoom++;
			return;
		}

		// - = zoom out
		if (key === '-') {
			editor.zoom--;
			return;
		}

		// Number keys for zoom
		if (key >= '1' && key <= '8') {
			editor.zoom = parseInt(key);
			return;
		}

		// Tool shortcuts
		if (TOOL_SHORTCUTS[key]) {
			editor.tool = TOOL_SHORTCUTS[key];
			editor.statusMessage = `Tool: ${TOOLS.find((t) => t.id === TOOL_SHORTCUTS[key])?.label}`;
			return;
		}

		// [ and ] = cycle colors
		if (key === '[') {
			editor.fgColor = (editor.fgColor - 1 + 16) % 16;
			return;
		}
		if (key === ']') {
			editor.fgColor = (editor.fgColor + 1) % 16;
			return;
		}

		// Delete / Backspace = clear
		if (key === 'delete' || key === 'backspace') {
			e.preventDefault();
			editor.clearCanvas();
			return;
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />
