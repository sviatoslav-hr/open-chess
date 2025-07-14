<script lang="ts">
	import { cn } from '../../utils';
	import Button from './Button.svelte';

	const rows = [1, 2, 3, 4, 5, 6, 7, 8] as const;
	const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

	function isEven(num: number): boolean {
		return num % 2 === 0;
	}
	function isOdd(num: number): boolean {
		return num % 2 !== 0;
	}
	let boardRotated = $state(false);
</script>

<div class="flex w-full justify-center">
	<div class={cn('flex h-full justify-around', boardRotated ? 'flex-col' : 'flex-col-reverse')}>
		{#each rows as row}
			<div class="flex h-20 items-center pr-2 text-center">
				{row}
			</div>
		{/each}
	</div>
	<div class={cn('flex', boardRotated ? 'flex-col' : 'flex-col-reverse')}>
		{#each rows as row}
			<div class="flex">
				{#each boardRotated ? cols.toReversed() : cols as col, colIndex}
					<div
						class={cn(
							'flex h-20 w-20 items-center justify-center border-t border-l border-teal-500 last:border-r last:border-l',
							{
								'bg-teal-500':
									isEven(row) !== boardRotated ? isOdd(colIndex + 1) : isEven(colIndex + 1),
								'border-b': boardRotated ? row === 8 : row === 1
							}
						)}
					></div>
				{/each}
			</div>
		{/each}
	</div>
</div>
<div class="flex w-full justify-center">
	<div class="w-8"></div>
	{#each cols as col}
		<div class="w-20 pt-2 text-center">
			{col}
		</div>
	{/each}
</div>
<div class="fixed top-4 right-4 flex justify-center gap-2">
	<Button onClick={() => (boardRotated = !boardRotated)}>Rotate</Button>
</div>
