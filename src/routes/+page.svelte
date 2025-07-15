<script lang="ts">
	import Board from './components/Board.svelte';
	import Button from './components/Button.svelte';

	let boardRotated = $state(false);
</script>

<main class="flex grow flex-col items-center justify-center">
	<Board {boardRotated} />
	<div class="fixed top-4 right-4 flex justify-center gap-2">
		<Button onClick={() => (boardRotated = !boardRotated)}>Rotate</Button>
	</div>
</main>
