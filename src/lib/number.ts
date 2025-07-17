const ASCII_CODE_0 = '0'.charCodeAt(0);
const ASCII_CODE_9 = '9'.charCodeAt(0);

export function isNumberChar(char: string): boolean {
	const code = char.charCodeAt(0);
	return code >= ASCII_CODE_0 && code <= ASCII_CODE_9;
}

export function isEven(num: number): boolean {
	return num % 2 === 0;
}
export function isOdd(num: number): boolean {
	return num % 2 !== 0;
}
