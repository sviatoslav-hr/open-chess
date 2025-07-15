<script lang="ts">
	import { base } from '$app/paths';
	import { cn } from '../../utils';
	import type { PieceId } from '../../types/chess';

	interface Props {
		className?: string;
		id: PieceId;
	}

	let { className: classNameInput, id }: Props = $props();
	let pieceSrc = $derived.by(() => {
		const color = id === id.toLowerCase() ? 'black' : 'white';
		const pieceType = id.toLowerCase();
		return `${base}/piece_${pieceType}_${color}.svg`;
	});
</script>

<div class={cn('flex h-20 w-20 items-center justify-center', classNameInput)}>
	<img src={pieceSrc} alt={id} class="h-16 w-16" />
</div>
