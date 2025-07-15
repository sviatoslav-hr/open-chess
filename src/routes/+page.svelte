<script lang="ts">
	import Board from './components/Board.svelte';
	import Button from './components/Button.svelte';
	import FenInput from './components/FenInput.svelte';

	let boardRotated = $state(false);
	let currentFen = $state('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');

	function onFenChange(fen: string) {
		currentFen = fen;
	}
</script>

<main class="flex grow flex-col items-center justify-center">
	<div class="fixed top-4 left-4">
		<FenInput class="w-96" onChange={onFenChange} />
	</div>

	<Board fen={currentFen} {boardRotated} />

	<div class="fixed top-4 right-4 flex justify-center gap-2">
		<Button onClick={() => (boardRotated = !boardRotated)}>Rotate</Button>
	</div>
</main>
