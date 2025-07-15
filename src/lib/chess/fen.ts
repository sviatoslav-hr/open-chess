import type { PieceId, PieceColor } from '../../routes/types';

const VALID_PIECES = ['p', 'n', 'b', 'r', 'q', 'k'];

export function validateFen(fen: string): boolean {
	if (!fen) return false;

	// Split FEN into its components (we only care about piece placement for now)
	const [piecePlacement] = fen.split(' ');
	if (!piecePlacement) return false;

	const rows = piecePlacement.split('/');
	if (rows.length !== 8) return false;

	for (const row of rows) {
		let sum = 0;
		for (const char of row) {
			if (!isNaN(Number(char))) {
				sum += Number(char);
			} else {
				if (!VALID_PIECES.includes(char.toLowerCase())) {
					return false;
				}
				sum += 1;
			}
		}
		if (sum !== 8) return false;
	}

	return true;
}

export function fenToPieceId(char: string): PieceId {
	const mapping: Record<string, PieceId> = {
		p: 'p',
		n: 'N',
		b: 'B',
		r: 'R',
		q: 'Q',
		k: 'K'
	};
	return mapping[char.toLowerCase()];
}

export function getColorFromFenChar(char: string): PieceColor {
	return char === char.toUpperCase() ? 'white' : 'black';
}
