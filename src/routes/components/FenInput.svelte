<script lang="ts">
	import { validateFen } from '$lib/chess/fen';
	import { cn, debounce } from '../../utils';

	interface Props {
		class?: string;
		onChange?: (fen: string) => void;
	}

	let { class: className, onChange }: Props = $props();
	let value = $state('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
	let isValid = $state(true);

	const debouncedValidate = debounce((newValue: string) => {
		if (validateFen(newValue)) {
			isValid = true;
			onChange?.(newValue);
		} else {
			isValid = false;
		}
	}, 300);

	function onInput() {
		debouncedValidate(value);
	}

	$effect(() => {
		return () => debouncedValidate.cancel();
	});
</script>

<textarea
	bind:value
	oninput={onInput}
	class={cn(
		'max-w-[200px] resize-none rounded-md border px-3 py-2 outline-0',
		isValid ? 'border-gray-300' : 'border-red-500',
		className
	)}
	rows={3}
></textarea>
