import {
	BOARD_COLS,
	BOARD_ROWS,
	isBoardPosition,
	type BoardMap,
	type BoardPosition
} from '$lib/board';
import { type Move } from '$lib/moves';
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

export function fenToString(fen: FenBoardInfo): string {
	const rows: string[] = [];
	for (let i = BOARD_ROWS.length - 1; i >= 0; i--) {
		const row = BOARD_ROWS[i];
		let rowStr = '';
		let emptyCount = 0;

		for (const col of BOARD_COLS) {
			const piece = fen.map.get(`${col}${row}`);
			if (piece) {
				if (emptyCount > 0) {
					rowStr += emptyCount;
					emptyCount = 0;
				}
				rowStr += piece;
			} else {
				emptyCount++;
			}
		}
		if (emptyCount > 0) {
			rowStr += emptyCount;
		}
		rows.push(rowStr);
	}

	const placement = rows.join('/');
	const turn = fen.turn;

	let castling = '';
	if (fen.canCastle.whiteKingSide) castling += 'K';
	if (fen.canCastle.whiteQueenSide) castling += 'Q';
	if (fen.canCastle.blackKingSide) castling += 'k';
	if (fen.canCastle.blackQueenSide) castling += 'q';
	if (!castling) castling = '-';

	const enPassant = fen.enPassantTarget || '-';
	const halfMove = fen.halfMoveClock;
	const fullMove = fen.fullMoveNumber;

	return `${placement} ${turn} ${castling} ${enPassant} ${halfMove} ${fullMove}`;
}

export function applyMove(fen: FenBoardInfo, move: Move): FenBoardInfo {
	const isWhiteMove = fen.turn === 'w';
	const newFen: FenBoardInfo = {
		map: new Map(fen.map),
		turn: isWhiteMove ? 'b' : 'w',
		canCastle: { ...fen.canCastle },
		enPassantTarget: null,
		halfMoveClock: fen.halfMoveClock + 1,
		fullMoveNumber: isWhiteMove ? fen.fullMoveNumber : fen.fullMoveNumber + 1
	};

	if (fen.map.get(move.from) !== move.piece) {
		throw new Error(`Piece at ${move.from} does not match the move piece: ${move.piece}`);
	}
	if (move.castling) {
		applyCastlingMove(newFen, move);
		return newFen;
	}

	newFen.map.delete(move.from);
	if (move.promotion != null) {
		const promotedPiece = move.promotion;
		newFen.map.set(move.to, promotedPiece);
	} else {
		newFen.map.set(move.to, move.piece);
	}

	updateCastlingRights(newFen, move);

	// Reset half move clock on pawn moves or captures
	const isPawnMove = move.piece.toLowerCase() === 'p';
	if (isPawnMove || move.isCapture) {
		newFen.halfMoveClock = 0;
	}

	return newFen;
}

function applyCastlingMove(newFen: FenBoardInfo, move: Move): void {
	const isWhiteMove = move.turn === 'w';

	if (move.castling === 'king-side') {
		const rank = isWhiteMove ? '1' : '8';
		const king: PieceId = isWhiteMove ? 'K' : 'k';
		const rook: PieceId = isWhiteMove ? 'R' : 'r';

		newFen.map.delete(`e${rank}`);
		newFen.map.delete(`h${rank}`);
		newFen.map.set(`g${rank}`, king);
		newFen.map.set(`f${rank}`, rook);

		if (isWhiteMove) {
			newFen.canCastle.whiteKingSide = false;
			newFen.canCastle.whiteQueenSide = false;
		} else {
			newFen.canCastle.blackKingSide = false;
			newFen.canCastle.blackQueenSide = false;
		}
		return;
	}

	if (move.castling === 'queen-side') {
		const rank = isWhiteMove ? '1' : '8';
		const king = isWhiteMove ? 'K' : 'k';
		const rook = isWhiteMove ? 'R' : 'r';

		newFen.map.delete(`e${rank}`);
		newFen.map.delete(`a${rank}`);
		newFen.map.set(`c${rank}`, king);
		newFen.map.set(`d${rank}`, rook);

		if (isWhiteMove) {
			newFen.canCastle.whiteKingSide = false;
			newFen.canCastle.whiteQueenSide = false;
		} else {
			newFen.canCastle.blackKingSide = false;
			newFen.canCastle.blackQueenSide = false;
		}
		return;
	}
}

function updateCastlingRights(newFen: FenBoardInfo, move: Move): void {
	if (move.piece === 'k') {
		newFen.canCastle.blackKingSide = false;
		newFen.canCastle.blackQueenSide = false;
	} else if (move.piece === 'K') {
		newFen.canCastle.whiteKingSide = false;
		newFen.canCastle.whiteQueenSide = false;
	} else if (move.piece === 'r') {
		if (move.from === 'a8') newFen.canCastle.blackQueenSide = false;
		if (move.from === 'h8') newFen.canCastle.blackKingSide = false;
	} else if (move.piece === 'R') {
		if (move.from === 'a1') newFen.canCastle.whiteQueenSide = false;
		if (move.from === 'h1') newFen.canCastle.whiteKingSide = false;
	}
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
	fenRows.reverse(); // Reverse the rows to match the board's coordinate system, because FEN starts from rank 8 to rank 1

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
