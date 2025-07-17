<script lang="ts">
	import { BOARD_COLS, BOARD_ROWS } from '$lib/board';
	import Piece from '$lib/components/Piece.svelte';
	import type { FenBoardInfo } from '$lib/fen';
	import { isEven, isOdd } from '$lib/number';
	import { cn } from '$lib/utils';

	interface Props {
		className?: string;
		boardRotated?: boolean;
		fen: FenBoardInfo;
	}

	let { className: classNameInput, boardRotated, fen }: Props = $props();
	let positionMap = $derived(fen.map);
</script>

<!-- TODO: Make this scale up the screen size. -->

<div class={cn('flex w-full justify-center', classNameInput)}>
	<div class={cn('flex h-full w-5 justify-around', boardRotated ? 'flex-col' : 'flex-col-reverse')}>
		{#each BOARD_ROWS as row}
			<div class="flex h-20 items-center pr-2 text-center">{row}</div>
		{/each}
	</div>

	<div class={cn('flex pr-5', boardRotated ? 'flex-col' : 'flex-col-reverse')}>
		{#each BOARD_ROWS as row, rowIndex}
			<div class={cn('flex bg-teal-900', { 'flex-row-reverse': boardRotated })}>
				{#each BOARD_COLS as col, colIndex}
					<div
						class={cn('flex h-20 w-20 items-center justify-center border-teal-500', {
							'bg-teal-500': isEven(rowIndex + 1) ? isOdd(colIndex + 1) : isEven(colIndex + 1),
							'border-t': row === (boardRotated ? '1' : '8'),
							'border-b': row === (boardRotated ? '8' : '1'),
							'border-r': col === (boardRotated ? 'a' : 'h'),
							'border-l': col === (boardRotated ? 'h' : 'a')
						})}
					>
						{#if positionMap.has(`${col}${row}`)}
							{@const piece = positionMap.get(`${col}${row}`)}
							{#if piece}
								<Piece id={piece} />
							{/if}
						{/if}
					</div>
				{/each}
			</div>
		{/each}
	</div>
</div>

<div class={cn('flex w-full justify-center', { 'flex-row-reverse': boardRotated })}>
	{#each BOARD_COLS as col}
		<div class="w-20 pt-2 text-center">{col}</div>
	{/each}
</div>
