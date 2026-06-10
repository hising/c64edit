<script lang="ts">
	import PalettePanel from './PalettePanel.svelte';
	import PreviewPanel from './PreviewPanel.svelte';
	import GradientPanel from './GradientPanel.svelte';
	import CharsetPanel from './CharsetPanel.svelte';
	import { editor } from '$lib/stores/editor.svelte';

	type Tab = 'palette' | 'gradient' | 'preview' | 'charset';
	let activeTab = $state<Tab>('palette');

	const TABS: { id: Tab; label: string; title: string }[] = [
		{ id: 'palette', label: 'PAL', title: 'Color palette' },
		{ id: 'gradient', label: 'GRD', title: 'Gradient generator' },
		{ id: 'preview', label: 'PRV', title: 'Canvas preview' },
		{ id: 'charset', label: 'CHR', title: 'Charset / font editor' }
	];
</script>

<aside class="flex flex-col bg-gray-900 border-l border-gray-700" style="width: 200px; min-width: 200px">
	<!-- Tab bar -->
	<div class="flex border-b border-gray-700">
		{#each TABS as tab}
			<button
				class="flex-1 py-1.5 text-xs pixel-font transition-colors {activeTab === tab.id ? 'text-cyan-300 border-b-2 border-cyan-400 -mb-px bg-gray-800' : 'text-gray-500 hover:text-gray-300'}"
				onclick={() => (activeTab = tab.id)}
				title={tab.title}
			>{tab.label}</button>
		{/each}
	</div>

	<!-- Tab content -->
	<div class="flex-1 overflow-y-auto">
		{#if activeTab === 'palette'}
			<PalettePanel />
		{:else if activeTab === 'gradient'}
			<GradientPanel />
		{:else if activeTab === 'preview'}
			<PreviewPanel />
		{:else if activeTab === 'charset'}
			<CharsetPanel />
		{/if}
	</div>
</aside>
