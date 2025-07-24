<script lang="ts">
	import Board from '$lib/components/Board.svelte';
	import Button from '$lib/components/Button.svelte';
	import FenInput from '$lib/components/FenInput.svelte';
	import { boardToFen, INITIAL_FEN, parseFen } from '$lib/fen';
	import { applyMove, type Move } from '$lib/moves';

	let boardRotated = $state(false);
	let currentFenStr = $state(INITIAL_FEN);
	let boardInfo = $state(parseFen(INITIAL_FEN));

	function onFenChange(fenStr: string) {
		if (currentFenStr === fenStr) return;
		currentFenStr = fenStr;
		boardInfo = parseFen(fenStr);
	}

	function onMove(move: Move) {
		const newFen = applyMove(boardInfo, move);
		boardInfo = newFen;
		const newFenStr = boardToFen(newFen);
		currentFenStr = newFenStr;
		// @CLEANUP:
		console.debug('onMove: newFen', { move, newFen, newFenStr });
	}
</script>

<main class="flex grow flex-col items-start justify-center lg:items-center">
	<div class="fixed not-lg:right-4 not-lg:bottom-4 lg:top-4 lg:left-4">
		<FenInput class="w-96" value={currentFenStr} onChange={onFenChange} />
	</div>

	<Board {boardInfo} {boardRotated} {onMove} />

	<div class="fixed top-4 right-4 flex flex-col justify-center gap-2">
		<Button onClick={() => (boardRotated = !boardRotated)}>Rotate</Button>
		<div>{boardInfo.turn === 'b' ? 'Black' : 'White'}'s turn</div>
	</div>
</main>
