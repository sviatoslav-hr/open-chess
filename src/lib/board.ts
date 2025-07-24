import type { PieceId } from '$lib/piece';

export const BOARD_RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;
export const BOARD_FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export const InitialRank = { WHITE: '1', BLACK: '8' } as const;
export const PromotionRank = { WHITE: '8', BLACK: '1' } as const;
export const EnPassantRank = { WHITE: '3', BLACK: '6' } as const;

export type BoardRank = (typeof BOARD_RANKS)[number];
export type BoardFile = (typeof BOARD_FILES)[number];
export type PositionStr = `${BoardFile}${BoardRank}`;

export const PlayerColor = {
	WHITE: 'white' as const,
	BLACK: 'black' as const
};
export type PlayerColor = (typeof PlayerColor)[keyof typeof PlayerColor];

export class Position {
	file: BoardFile;
	rank: BoardRank;

	private constructor(file: BoardFile, rank: BoardRank) {
		this.file = file;
		this.rank = rank;
	}

	static make(file: BoardFile, rank: BoardRank): Position {
		return new Position(file, rank);
	}

	static fromStr(pos: PositionStr): Position {
		return new Position(pos[0] as BoardFile, pos[1] as BoardRank);
	}

	get entries(): [BoardFile, BoardRank] {
		return [this.file, this.rank];
	}

	equals(other: Position | PositionStr): boolean {
		if (typeof other === 'string') {
			return this.file === other[0] && this.rank === other[1];
		}
		return this.file === other.file && this.rank === other.rank;
	}

	fileIndex(): number {
		return BOARD_FILES.indexOf(this.file);
	}

	rankIndex(): number {
		return BOARD_RANKS.indexOf(this.rank);
	}

	toString(): PositionStr {
		return `${this.file}${this.rank}`;
	}
}

export function isBoardRank(row: string): row is BoardRank {
	return BOARD_RANKS.includes(row as BoardRank);
}

export function isBoardFile(col: string): col is BoardFile {
	return BOARD_FILES.includes(col as BoardFile);
}

export function isPositionStr(pos: string): pos is PositionStr {
	if (pos.length !== 2) return false;
	return isBoardFile(pos[0]) && isBoardRank(pos[1]);
}

// @CLEANUP: unused?
export function isValidPosition(pos: Position): boolean {
	return BOARD_FILES.includes(pos.file) && BOARD_RANKS.includes(pos.rank);
}

function makeBoardPositionStr(pos: Position): PositionStr {
	return `${pos.file}${pos.rank}`;
}

export interface CastlingRights {
	whiteKingSide: boolean;
	whiteQueenSide: boolean;
	blackKingSide: boolean;
	blackQueenSide: boolean;
}

export interface BoardInfo {
	map: BoardMap;
	turn: PlayerColor;
	canCastle: CastlingRights;
	enPassantTarget: Position | null;
	halfMoveClock: number;
	fullMoveNumber: number;
}

export class BoardMap {
	map: Map<PositionStr, PieceId> = new Map();

	constructor(map?: Map<PositionStr, PieceId>) {
		this.map = map ?? new Map<PositionStr, PieceId>();
	}

	get(position: Position | PositionStr): PieceId | undefined {
		const key = this.makePositionKey(position);
		return this.map.get(key);
	}

	has(position: Position | PositionStr): boolean {
		const key = this.makePositionKey(position);
		return this.map.has(key);
	}

	set(positionOrFile: Position | PositionStr, pieceId: PieceId): void {
		const key = this.makePositionKey(positionOrFile);
		this.map.set(key, pieceId);
	}

	delete(position: Position | PositionStr): void {
		const key = this.makePositionKey(position);
		this.map.delete(key);
	}

	clone(): BoardMap {
		return new BoardMap(new Map(this.map));
	}

	private makePositionKey(positionOrFile: Position | PositionStr): PositionStr {
		if (typeof positionOrFile === 'object') {
			return makeBoardPositionStr(positionOrFile);
		} else {
			return positionOrFile;
		}
	}
}
