<script lang="ts">
	import { base } from '$app/paths';
	import { cn } from '../../utils';
	import type { PieceColor, PieceId } from '../types';

	interface Props {
		className?: string;
		id: PieceId;
		color: PieceColor;
	}

	let { className: classNameInput, id, color }: Props = $props();
	let pieceSrc = $derived.by(() => {
		const colorCode = color === 'white' ? 'W' : 'B';
		return `${base}/pieces/${colorCode}${id}.svg`;
	});
</script>

<div class={cn('flex h-20 w-20 items-center justify-center', classNameInput)}>
	<img src={pieceSrc} alt={id} class="h-16 w-16" />
</div>
