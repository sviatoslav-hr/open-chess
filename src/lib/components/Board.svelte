<script lang="ts">
	import type { BoardPosition } from '$lib/board';
	import { BOARD_COLS, BOARD_ROWS } from '$lib/board';
	import Piece from '$lib/components/Piece.svelte';
	import type { FenBoardInfo } from '$lib/fen';
	import { constructMove, type Move } from '$lib/moves';
	import { isEven, isOdd } from '$lib/number';
	import { cn } from '$lib/utils';

	interface Props {
		className?: string;
		boardRotated?: boolean;
		fen: FenBoardInfo;
		onMove: (move: Move) => void;
	}

	let { className: classNameInput, boardRotated, fen, onMove }: Props = $props();
	let positionMap = $derived.by(() => fen.map);
	let dragSource: BoardPosition | null = $state(null);
	let dragTarget: BoardPosition | null = $state(null);
	const showDebugCoords = false;

	function handleDragStart(e: DragEvent, position: BoardPosition) {
		dragSource = position;
		if (e.dataTransfer) {
			e.dataTransfer.setData('text/plain', '');
			e.dataTransfer.effectAllowed = 'move';
		}
	}
	function handleDragEnd() {
		dragSource = null;
		dragTarget = null;
	}
	function handleTargetDraggedOver(event: DragEvent, position: BoardPosition) {
		event.preventDefault();
		dragTarget = position;
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
	}
	function handleDragDroppedOnTarget(event: DragEvent, targetPosition: BoardPosition) {
		event.preventDefault();
		if (dragSource === targetPosition) return;
		if (!dragSource) {
			console.warn('no drag source for position', targetPosition);
			return;
		}
		const move = constructMove(dragSource, targetPosition, fen);
		console.log('move', { move });
		if (move) {
			onMove(move);
		}
		dragSource = null;
	}
</script>

<!-- TODO: Make this scale up the screen size. -->

<div class={cn('flex justify-center', classNameInput)}>
	<div class={cn('flex h-full w-9 justify-around', boardRotated ? 'flex-col' : 'flex-col-reverse')}>
		{#each BOARD_ROWS as row}
			<div class="flex h-20 items-center justify-end pr-4 text-center">{row}</div>
		{/each}
	</div>

	<div class={cn('flex pr-9', boardRotated ? 'flex-col' : 'flex-col-reverse')}>
		{#each BOARD_ROWS as row, rowIndex}
			<div class={cn('flex bg-teal-900', { 'flex-row-reverse': boardRotated })}>
				{#each BOARD_COLS as col, colIndex}
					{@const position: BoardPosition = `${col}${row}`}
					{@const piece = positionMap.get(position)}
					<div
						class={cn('relative flex h-20 w-20 items-center justify-center border-teal-500', {
							'bg-teal-500': isEven(rowIndex + 1) ? isOdd(colIndex + 1) : isEven(colIndex + 1),
							'border-t': row === (boardRotated ? '1' : '8'),
							'border-b': row === (boardRotated ? '8' : '1'),
							'border-r': col === (boardRotated ? 'a' : 'h'),
							'border-l': col === (boardRotated ? 'h' : 'a'),
							'z-69 rounded-sm outline-4 outline-red-600': dragTarget === position
						})}
						data-position={position}
						role="gridcell"
						tabindex="0"
						ondragover={(e) => handleTargetDraggedOver(e, position)}
						ondrop={(e) => handleDragDroppedOnTarget(e, position)}
						ondragenter={(e) => e.preventDefault()}
					>
						{#if showDebugCoords}
							<div class="absolute top-1 left-1">{col}{row}</div>
						{/if}
						{#if piece}
							<div
								class={cn({
									'z-42 rounded-xs outline-2 outline-indigo-500': dragSource === position
								})}
								role="button"
								tabindex="0"
								draggable="true"
								ondragstart={(e) => handleDragStart(e, position)}
								ondragend={handleDragEnd}
							>
								<Piece id={piece} />
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/each}
	</div>
</div>

<div class={cn('flex justify-center px-9', { 'flex-row-reverse': boardRotated })}>
	{#each BOARD_COLS as col}
		<div class="w-20 pt-2 text-center">{col}</div>
	{/each}
</div>
