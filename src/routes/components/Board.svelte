<script lang="ts">
	import { cn } from '../../utils';

	interface Props {
		className?: string;
		boardRotated?: boolean;
	}

	let { className: classNameInput, boardRotated }: Props = $props();

	const rows = [1, 2, 3, 4, 5, 6, 7, 8] as const;
	const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

	function isEven(num: number): boolean {
		return num % 2 === 0;
	}
	function isOdd(num: number): boolean {
		return num % 2 !== 0;
	}
</script>

<!-- TODO: Make this scale up the screen size. -->

<div class={cn('flex w-full justify-center', classNameInput)}>
	<div class={cn('flex h-full w-5 justify-around', boardRotated ? 'flex-col' : 'flex-col-reverse')}>
		{#each rows as row}
			<div class="flex h-20 items-center pr-2 text-center">{row}</div>
		{/each}
	</div>

	<div class={cn('flex pr-5', boardRotated ? 'flex-col' : 'flex-col-reverse')}>
		{#each rows as row}
			<div class={cn('flex', { 'flex-row-reverse': boardRotated })}>
				{#each cols as col, colIndex}
					<div
						class={cn('flex h-20 w-20 items-center justify-center border-teal-500', {
							'bg-teal-500': isEven(row) ? isOdd(colIndex + 1) : isEven(colIndex + 1),
							'border-t': row === (boardRotated ? 1 : 8),
							'border-b': row === (boardRotated ? 8 : 1),
							'border-r': col === (boardRotated ? 'a' : 'h'),
							'border-l': col === (boardRotated ? 'h' : 'a')
						})}
					></div>
				{/each}
			</div>
		{/each}
	</div>
</div>

<div class={cn('flex w-full justify-center', { 'flex-row-reverse': boardRotated })}>
	{#each cols as col}
		<div class="w-20 pt-2 text-center">{col}</div>
	{/each}
</div>
