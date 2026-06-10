<script lang="ts">
	import Toolbar from '$lib/components/Toolbar.svelte';
	import ToolsPanel from '$lib/components/ToolsPanel.svelte';
	import PixelCanvas from '$lib/components/PixelCanvas.svelte';
	import RightPanel from '$lib/components/RightPanel.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	import KeyboardShortcuts from '$lib/components/KeyboardShortcuts.svelte';
	import { editor } from '$lib/stores/editor.svelte';
</script>

<KeyboardShortcuts />

<div class="flex flex-col h-screen overflow-hidden bg-gray-950">
	<!-- Top toolbar -->
	<Toolbar />

	<!-- Main editor area -->
	<div class="flex flex-1 overflow-hidden">
		<!-- Left: tools panel -->
		<ToolsPanel />

		<!-- Center: canvas area (scrollable) -->
		<main
			class="flex-1 overflow-auto flex items-start justify-start p-4"
			style="background: radial-gradient(ellipse at center, #1a2035 0%, #0d0d1a 100%)"
		>
			<div class="shadow-2xl">
				<PixelCanvas />
			</div>
		</main>

		<!-- Right panel: tabs for palette, gradient, preview, charset -->
		<RightPanel />
	</div>

	<!-- Status bar -->
	<StatusBar />
</div>
