<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col justify-between">
	<div class="flex grow flex-col">
		{@render children()}
	</div>

	<footer class="w-full self-end border-t border-teal-500 p-2">
		Environment: {PUBLIC_NODE_ENV}
	</footer>
</div>
