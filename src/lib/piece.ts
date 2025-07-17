export type PieceId =
	| 'p' // Black Pawn
	| 'P' // White Pawn
	| 'k' // Black King
	| 'K' // White King
	| 'q' // Black Queen
	| 'Q' // White Queen
	| 'r' // Black Rook
	| 'R' // White Rook
	| 'b' // Black Bishop
	| 'B' // White Bishop
	| 'n' // Black Knight
	| 'N'; // White Knight

const VALID_PIECES = ['p', 'n', 'b', 'r', 'q', 'k', 'P', 'N', 'B', 'R', 'Q', 'K'];

export function isValidPieceId(pieceId: string): pieceId is PieceId {
	return VALID_PIECES.includes(pieceId);
}
