import type { BoardMap, BoardPosition, BoardCol, BoardRow } from '$lib/board';
import type { PieceId } from '$lib/piece';
import type { FenBoardInfo } from '$lib/fen';
import { BOARD_COLS, BOARD_ROWS, isBoardPosition, isBoardCol, isBoardRow } from '$lib/board';

export interface Move {
	from: BoardPosition;
	to: BoardPosition;
	algebraic: string;
	piece: PieceId;
	turn: 'w' | 'b';
	isCapture: boolean;
	castling?: 'king-side' | 'queen-side';
	isEnPassant?: boolean;
	promotion?: 'q' | 'r' | 'b' | 'n' | 'Q' | 'R' | 'B' | 'N';
}

export function constructMove(
	from: BoardPosition,
	to: BoardPosition,
	fen: FenBoardInfo
): Move | null {
	if (!isValidPosition(from) || !isValidPosition(to)) {
		console.warn('Invalid position: ', from, to);
		return null;
	}

	const piece = fen.map.get(from);
	if (!piece) {
		throw new Error(`No piece at position ${from}`);
	}

	const pieceColor = getPieceColor(piece);
	if (pieceColor !== fen.turn) {
		console.warn(`It's not ${pieceColor}'s turn: `, pieceColor, fen.turn);
		return null;
	}

	const targetPiece = fen.map.get(to);
	if (targetPiece && pieceColor === getPieceColor(targetPiece)) {
		console.warn(`Cannot capture own piece: `, targetPiece, pieceColor);
		return null;
	}

	let isValid = false;
	let castling: 'king-side' | 'queen-side' | undefined;
	let isEnPassant = false;

	// Validate move based on piece type
	switch (piece) {
		case 'P':
		case 'p':
			isValid = isValidPawnMove(from, to, piece, fen.map, fen.enPassantTarget);
			isEnPassant = isValid && to === fen.enPassantTarget;
			break;
		case 'N':
		case 'n':
			isValid = isValidKnightMove(from, to);
			break;
		case 'B':
		case 'b':
			isValid = isValidBishopMove(from, to, fen.map);
			break;
		case 'R':
		case 'r':
			isValid = isValidRookMove(from, to, fen.map);
			break;
		case 'Q':
		case 'q':
			isValid = isValidQueenMove(from, to, fen.map);
			break;
		case 'K':
		case 'k': {
			const result = isValidKingMove(from, to, piece, fen.map, fen.canCastle);
			isValid = result.isValid;
			castling = result.castling;
			break;
		}
	}

	if (!isValid) {
		console.warn(`Invalid move for piece ${piece} from ${from} to ${to}`);
		return null;
	}

	// Check if pawn move requires promotion
	const [, toRow] = parsePosition(to);
	const promotion =
		(piece === 'p' && toRow === '8' && 'q') || (piece === 'P' && toRow === '1' && 'Q') || undefined;

	const move: Move = {
		from,
		to,
		piece,
		turn: pieceColor,
		algebraic: '',
		isCapture: !!targetPiece || isEnPassant,
		castling,
		isEnPassant,
		promotion
	};
	move.algebraic = moveToAlgebraic(move);
	return move;
}

function moveToAlgebraic(move: Move): string {
	if (move.castling) {
		return move.castling === 'king-side' ? 'O-O' : 'O-O-O';
	}

	const isPawn = move.piece === 'p' || move.piece === 'P';
	let notation = '';

	// Add piece type (except for pawns)
	if (!isPawn) {
		notation += move.piece;
	}

	// Add capture symbol
	if (move.isCapture && isPawn) {
		notation += move.from[0];
	}
	if (move.isCapture) {
		notation += 'x';
	}

	// Add destination square
	notation += move.to;

	// Add promotion
	if (move.promotion) {
		notation += '=' + move.promotion.toUpperCase();
	}

	return notation;
}

function parsePosition(position: BoardPosition): [BoardCol, BoardRow] {
	if (!isBoardPosition(position)) throw new Error('Invalid board position');
	const col = position[0] as BoardCol;
	const row = position[1] as BoardRow;
	return [col, row];
}

function getPieceColor(piece: PieceId): 'w' | 'b' {
	return piece === piece.toLowerCase() ? 'b' : 'w';
}

function getColIndex(col: string): number {
	if (!isBoardCol(col)) throw new Error('Invalid column');
	return BOARD_COLS.indexOf(col);
}

function getRowIndex(row: string): number {
	if (!isBoardRow(row)) throw new Error('Invalid row');
	return BOARD_ROWS.indexOf(row);
}

function isValidPosition(position: BoardPosition): boolean {
	const [col, row] = parsePosition(position);
	return BOARD_COLS.includes(col) && BOARD_ROWS.includes(row);
}

function getPositionsBetween(from: BoardPosition, to: BoardPosition): BoardPosition[] {
	const [fromCol, fromRow] = parsePosition(from);
	const [toCol, toRow] = parsePosition(to);
	const positions: BoardPosition[] = [];

	const fromColIdx = getColIndex(fromCol);
	const toColIdx = getColIndex(toCol);
	const fromRowIdx = getRowIndex(fromRow);
	const toRowIdx = getRowIndex(toRow);

	// Horizontal move
	if (fromRowIdx === toRowIdx) {
		const step = fromColIdx < toColIdx ? 1 : -1;
		for (let i = fromColIdx + step; i !== toColIdx; i += step) {
			const col = BOARD_COLS[i];
			if (!col || !isBoardCol(col)) continue;
			positions.push(`${col}${fromRow}`);
		}
	}
	// Vertical move
	else if (fromColIdx === toColIdx) {
		const step = fromRowIdx < toRowIdx ? 1 : -1;
		for (let i = fromRowIdx + step; i !== toRowIdx; i += step) {
			const row = BOARD_ROWS[i];
			if (!row || !isBoardRow(row)) continue;
			positions.push(`${fromCol}${row}`);
		}
	}
	// Diagonal move
	else if (Math.abs(fromColIdx - toColIdx) === Math.abs(fromRowIdx - toRowIdx)) {
		const colStep = fromColIdx < toColIdx ? 1 : -1;
		const rowStep = fromRowIdx < toRowIdx ? 1 : -1;
		let col = fromColIdx + colStep;
		let row = fromRowIdx + rowStep;
		while (col !== toColIdx && row !== toRowIdx) {
			const nextCol = BOARD_COLS[col];
			const nextRow = BOARD_ROWS[row];
			if (nextCol && nextRow && isBoardCol(nextCol) && isBoardRow(nextRow)) {
				positions.push(`${nextCol}${nextRow}`);
			}
			col += colStep;
			row += rowStep;
		}
	}

	return positions;
}

function isPathClear(from: BoardPosition, to: BoardPosition, board: BoardMap): boolean {
	return getPositionsBetween(from, to).every((pos) => !board.has(pos));
}

function isValidPawnMove(
	from: BoardPosition,
	to: BoardPosition,
	piece: PieceId,
	board: BoardMap,
	enPassantTarget: BoardPosition | null
): boolean {
	const [fromCol, fromRow] = parsePosition(from);
	const [toCol, toRow] = parsePosition(to);
	const fromColIdx = getColIndex(fromCol);
	const toColIdx = getColIndex(toCol);
	const fromRowIdx = getRowIndex(fromRow);
	const toRowIdx = getRowIndex(toRow);
	const color = getPieceColor(piece);
	const direction = color === 'w' ? 1 : -1;
	const startRow = color === 'w' ? '2' : '7';

	// Regular move forward
	if (fromCol === toCol) {
		// One square forward
		if (toRowIdx - fromRowIdx === direction) {
			return !board.has(to);
		}
		// Two squares forward from starting position
		if (fromRow === startRow && toRowIdx - fromRowIdx === 2 * direction) {
			return !board.has(to) && isPathClear(from, to, board);
		}
	}
	// Capture (including en passant)
	else if (Math.abs(toColIdx - fromColIdx) === 1 && toRowIdx - fromRowIdx === direction) {
		return board.has(to) || to === enPassantTarget;
	}

	return false;
}

function isValidKnightMove(from: BoardPosition, to: BoardPosition): boolean {
	const [fromCol, fromRow] = parsePosition(from);
	const [toCol, toRow] = parsePosition(to);
	const colDiff = Math.abs(getColIndex(toCol) - getColIndex(fromCol));
	const rowDiff = Math.abs(getRowIndex(toRow) - getRowIndex(fromRow));
	return (colDiff === 2 && rowDiff === 1) || (colDiff === 1 && rowDiff === 2);
}

function isValidBishopMove(from: BoardPosition, to: BoardPosition, board: BoardMap): boolean {
	const [fromCol, fromRow] = parsePosition(from);
	const [toCol, toRow] = parsePosition(to);
	const colDiff = Math.abs(getColIndex(toCol) - getColIndex(fromCol));
	const rowDiff = Math.abs(getRowIndex(toRow) - getRowIndex(fromRow));
	return colDiff === rowDiff && isPathClear(from, to, board);
}

function isValidRookMove(from: BoardPosition, to: BoardPosition, board: BoardMap): boolean {
	const [fromCol, fromRow] = parsePosition(from);
	const [toCol, toRow] = parsePosition(to);
	return (fromCol === toCol || fromRow === toRow) && isPathClear(from, to, board);
}

function isValidQueenMove(from: BoardPosition, to: BoardPosition, board: BoardMap): boolean {
	return isValidBishopMove(from, to, board) || isValidRookMove(from, to, board);
}

function isValidKingMove(
	from: BoardPosition,
	to: BoardPosition,
	piece: PieceId,
	board: BoardMap,
	canCastle: FenBoardInfo['canCastle']
): { isValid: boolean; castling?: 'king-side' | 'queen-side' } {
	const [fromCol, fromRow] = parsePosition(from);
	const [toCol, toRow] = parsePosition(to);
	const colDiff = Math.abs(getColIndex(toCol) - getColIndex(fromCol));
	const rowDiff = Math.abs(getRowIndex(toRow) - getRowIndex(fromRow));

	// Regular king move
	if (colDiff <= 1 && rowDiff <= 1) {
		return { isValid: true };
	}

	const color = getPieceColor(piece);
	if (
		rowDiff === 0 &&
		fromRow === (color === 'w' ? '1' : '8') &&
		fromCol === 'e' &&
		isPathClear(from, to, board)
	) {
		// King-side castling
		if (
			toCol === 'g' &&
			((color === 'w' && canCastle.whiteKingSide) || (color === 'b' && canCastle.blackKingSide))
		) {
			return { isValid: true, castling: 'king-side' };
		}
		// Queen-side castling
		if (
			toCol === 'c' &&
			((color === 'w' && canCastle.whiteQueenSide) || (color === 'b' && canCastle.blackQueenSide))
		) {
			return { isValid: true, castling: 'queen-side' };
		}
	}

	return { isValid: false };
}
