<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col justify-between" data-env={PUBLIC_NODE_ENV}>
	{@render children()}
</div>
