<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '../../utils';

	interface Props {
		type?: 'button' | 'submit' | 'reset';
		className?: string;
		onClick?: (event: MouseEvent) => void;
		children: Snippet;
	}

	let { type = 'button', className: classNameInput, onClick, children }: Props = $props();
</script>

<button
	{type}
	class={cn(
		'rounded border border-teal-500 bg-teal-900 px-3 py-2 hover:cursor-pointer hover:bg-teal-800',
		classNameInput
	)}
	onclick={onClick}
>
	{@render children()}
</button>
