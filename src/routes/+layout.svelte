<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>C64Edit – C64 Graphics Studio</title>
	<meta name="description" content="Modern C64 graphics editor for the demo scene" />
</svelte:head>

{@render children()}
