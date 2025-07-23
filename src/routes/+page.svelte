<script lang="ts">
	import Board from '$lib/components/Board.svelte';
	import Button from '$lib/components/Button.svelte';
	import FenInput from '$lib/components/FenInput.svelte';
	import {
		INITIAL_FEN_POSITION,
		parseFenString,
		applyMove,
		fenToString,
		type FenBoardInfo
	} from '$lib/fen';
	import type { Move } from '$lib/moves';

	let boardRotated = $state(false);
	let currentFenStr = $state(INITIAL_FEN_POSITION);
	let fen: FenBoardInfo = $derived.by(() => parseFenString(currentFenStr));

	function onFenChange(fen: string) {
		currentFenStr = fen;
	}

	function onMove(move: Move) {
		const newFen = applyMove(fen, move);
		const newFenStr = fenToString(newFen);
		// @CLEANUP:
		console.debug('onMove: newFen', { move, newFen, newFenStr });
		currentFenStr = newFenStr;
	}
</script>

<main class="flex grow flex-col items-start justify-center lg:items-center">
	<div class="fixed not-lg:right-4 not-lg:bottom-4 lg:top-4 lg:left-4">
		<FenInput class="w-96" value={currentFenStr} onChange={onFenChange} />
	</div>

	<Board {fen} {boardRotated} {onMove} />

	<div class="fixed top-4 right-4 flex flex-col justify-center gap-2">
		<Button onClick={() => (boardRotated = !boardRotated)}>Rotate</Button>
		<div>{fen.turn === 'b' ? 'Black' : 'White'}'s turn</div>
	</div>
</main>
