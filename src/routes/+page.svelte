<script lang="ts">
	import Board from '$lib/components/Board.svelte';
	import Button from '$lib/components/Button.svelte';
	import FenInput from '$lib/components/FenInput.svelte';
	import { INITIAL_FEN_POSITION, parseFenString, type FenBoardInfo } from '$lib/fen';

	let boardRotated = $state(false);
	let currentFenStr = $state(INITIAL_FEN_POSITION);
	let fen: FenBoardInfo = $derived.by(() => parseFenString(currentFenStr));

	function onFenChange(fen: string) {
		currentFenStr = fen;
	}
</script>

<main class="flex grow flex-col items-center justify-center">
	<div class="fixed top-4 left-4">
		<FenInput class="w-96" value={currentFenStr} onChange={onFenChange} />
	</div>

	<Board {fen} {boardRotated} />

	<div class="fixed top-4 right-4 flex justify-center gap-2">
		<Button onClick={() => (boardRotated = !boardRotated)}>Rotate</Button>
	</div>
</main>
