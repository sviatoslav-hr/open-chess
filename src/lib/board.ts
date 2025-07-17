import type { PieceId } from '$lib/piece';

export type BoardRow = (typeof BOARD_ROWS)[number];
export type BoardCol = (typeof BOARD_COLS)[number];
export type BoardPosition = `${BoardCol}${BoardRow}`;
export type BoardMap = Map<BoardPosition, PieceId>;

export const BOARD_ROWS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;
export const BOARD_COLS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

export function isBoardRow(row: string): row is BoardRow {
	return BOARD_ROWS.includes(row as BoardRow);
}

export function isBoardCol(col: string): col is BoardCol {
	return BOARD_COLS.includes(col as BoardCol);
}

export function isBoardPosition(pos: string): pos is BoardPosition {
	if (pos.length !== 2) return false;
	return isBoardCol(pos[0]) && isBoardRow(pos[1]);
}
