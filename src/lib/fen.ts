import {
	BOARD_COLS,
	BOARD_ROWS,
	isBoardPosition,
	type BoardMap,
	type BoardPosition
} from '$lib/board';
import { isNumberChar } from '$lib/number';
import { isValidPieceId, type PieceId } from '$lib/piece';

export const INITIAL_FEN_POSITION = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function validateFen(fen: string): boolean {
	if (!fen) return false;

	const fenParts = fen.split(' ');
	if (fenParts.length !== 6) return false;
	// TODO: @Incomplete: Validate turn, castling rights, en passant target, half move clock, and full move number
	const [piecePlacement] = fenParts;
	if (!piecePlacement) return false;

	const rows = piecePlacement.split('/');
	if (rows.length !== 8) return false;

	for (const row of rows) {
		let sum = 0;
		for (const char of row) {
			if (!isNaN(Number(char))) {
				sum += Number(char);
			} else {
				if (!isValidPieceId(char.toLowerCase())) {
					return false;
				}
				sum += 1;
			}
		}
		if (sum !== 8) return false;
	}

	return true;
}

export interface FenBoardInfo {
	map: BoardMap;
	turn: 'w' | 'b';
	canCastle: {
		whiteKingSide: boolean;
		whiteQueenSide: boolean;
		blackKingSide: boolean;
		blackQueenSide: boolean;
	};
	enPassantTarget: BoardPosition | null;
	halfMoveClock: number;
	fullMoveNumber: number;
}

export function parseFenString(fenString: string): FenBoardInfo {
	const fenParts = fenString.split(' ');
	if (fenParts.length < 1) {
		throw new Error('Invalid FEN string: must contain at least the piece placement');
	}

	const [
		piecePlacement,
		turnStr = 'w',
		castlingRightsStr = '-',
		enPassantTargetStr = '-',
		halfMoveClockStr = '0',
		fullMoveNumberStr = '1'
	] = fenParts;
	const fenRows = piecePlacement.split('/');
	if (fenRows.length !== 8) {
		throw new Error('Invalid FEN string: must contain exactly 8 rows');
	}

	const map: BoardMap = new Map<BoardPosition, PieceId>();
	for (let rowIndex = fenRows.length - 1; rowIndex >= 0; rowIndex--) {
		const rowStr = fenRows[rowIndex];

		let colIndex = 0;
		for (const char of rowStr) {
			if (isNumberChar(char)) {
				colIndex += Number(char);
				continue;
			}
			if (!isValidPieceId(char)) throw new Error(`Invalid piece ID in FEN string: ${char}`);
			const col = BOARD_COLS[colIndex];
			if (!col) throw new Error(`Invalid column index in FEN string: ${colIndex}`);
			const row = BOARD_ROWS[rowIndex];
			if (!row) throw new Error(`Invalid row index in FEN string: ${rowIndex}`);

			map.set(`${col}${row}`, char);
			colIndex += 1;
		}
	}

	const turn = turnStr === 'w' ? 'w' : 'b';
	const canCastle = {
		whiteKingSide: castlingRightsStr.includes('K'),
		whiteQueenSide: castlingRightsStr.includes('Q'),
		blackKingSide: castlingRightsStr.includes('k'),
		blackQueenSide: castlingRightsStr.includes('q')
	};

	let enPassantTarget: BoardPosition | null = null;
	if (enPassantTargetStr !== '-') {
		if (!isBoardPosition(enPassantTargetStr)) {
			throw new Error(`Invalid en passant target position in FEN string: ${enPassantTarget}`);
		}
		enPassantTarget = enPassantTargetStr;
	}

	const halfMoveClock = parseInt(halfMoveClockStr, 10);
	if (isNaN(halfMoveClock) || halfMoveClock < 0) {
		throw new Error(`Invalid half move clock in FEN string: ${halfMoveClock}`);
	}

	const fullMoveNumber = parseInt(fullMoveNumberStr, 10);
	if (isNaN(fullMoveNumber) || fullMoveNumber < 1) {
		throw new Error(`Invalid full move number in FEN string: ${fullMoveNumber}`);
	}

	return { map, turn, canCastle, enPassantTarget, halfMoveClock, fullMoveNumber };
}
