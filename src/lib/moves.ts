import {
	BOARD_FILES,
	BOARD_RANKS,
	EnPassantRank,
	InitialRank,
	isBoardFile,
	isBoardRank,
	PlayerColor,
	Position,
	PromotionRank,
	type BoardInfo,
	type BoardMap,
	type BoardRank,
	type CastlingRights,
	type PositionStr
} from '$lib/board';
import { PieceId, type PromotionPieceId } from '$lib/piece';

export interface Move {
	from: Position;
	to: Position;
	algebraic: string;
	piece: PieceId;
	turn: PlayerColor;
	isCapture: boolean;
	castling?: 'king-side' | 'queen-side';
	isEnPassantCapture?: boolean;
	promotion?: PromotionPieceId;
}

type MoveError =
	| {
			type: 'notYourTurn' | 'captureOwnPiece';
	  }
	| {
			type: 'invalidPieceMove';
			piece: PieceId;
	  };

// TODO: Add more specific error types for better reporting
export function calculateMove(
	board: BoardInfo,
	from: Position,
	to: Position
): Either<Move, MoveError> {
	const piece = board.map.get(from);
	if (!piece) {
		throw new Error(`No piece at position ${from}`);
	}

	const pieceColor = PieceId.getColor(piece);
	if (pieceColor !== board.turn) {
		return [null, { type: 'notYourTurn' }];
	}

	const targetPiece = board.map.get(to);
	if (targetPiece && pieceColor === PieceId.getColor(targetPiece)) {
		return [null, { type: 'captureOwnPiece' }];
	}

	let isValid = false;
	let castling: 'king-side' | 'queen-side' | undefined;
	let isEnPassantCapture = false;

	// Validate move based on piece type
	switch (piece) {
		case PieceId.BLACK_PAWN:
		case PieceId.WHITE_PAWN:
			isValid = isValidPawnMove(from, to, piece, board.map, board.enPassantTarget);
			isEnPassantCapture = isValid && Boolean(board.enPassantTarget?.equals(to));
			break;
		case PieceId.BLACK_KNIGHT:
		case PieceId.WHITE_KNIGHT:
			isValid = isValidKnightMove(from, to);
			break;
		case PieceId.BLACK_BISHOP:
		case PieceId.WHITE_BISHOP:
			isValid = isValidBishopMove(from, to, board.map);
			break;
		case PieceId.BLACK_ROOK:
		case PieceId.WHITE_ROOK:
			isValid = isValidRookMove(from, to, board.map);
			break;
		case PieceId.BLACK_QUEEN:
		case PieceId.WHITE_QUEEN:
			isValid = isValidQueenMove(from, to, board.map);
			break;
		case PieceId.BLACK_KING:
		case PieceId.WHITE_KING: {
			const result = isValidKingMove(from, to, piece, board.map, board.canCastle);
			isValid = result.isValid;
			castling = result.castling;
			break;
		}
	}

	if (!isValid) {
		return [null, { type: 'invalidPieceMove', piece }];
	}

	// Check if pawn move requires promotion
	const promotion =
		(piece === PieceId.BLACK_PAWN && to.rank === PromotionRank.BLACK && PieceId.BLACK_QUEEN) ||
		(piece === PieceId.WHITE_PAWN && to.rank === PromotionRank.WHITE && PieceId.WHITE_QUEEN) ||
		undefined;

	const move: Move = {
		from,
		to,
		piece,
		turn: pieceColor,
		algebraic: '',
		isCapture: !!targetPiece || isEnPassantCapture,
		castling,
		isEnPassantCapture,
		promotion
	};
	move.algebraic = moveToAlgebraic(move);
	return [move, null];
}

function moveToAlgebraic(move: Move): string {
	if (move.castling) {
		return move.castling === 'king-side' ? 'O-O' : 'O-O-O';
	}

	let notation = '';
	const isPawn = PieceId.isPawn(move.piece);
	if (!isPawn) notation += move.piece;
	if (move.isCapture && isPawn) notation += move.from.file;
	if (move.isCapture) notation += 'x';
	notation += move.to;
	if (move.promotion) notation += '=' + move.promotion.toUpperCase();

	return notation;
}

function getPositionsBetween(from: Position, to: Position): PositionStr[] {
	const positions: PositionStr[] = [];

	const fromFileIdx = from.fileIndex();
	const toFileIdx = to.fileIndex();
	const fromRankIdx = from.rankIndex();
	const toRankIdx = to.rankIndex();

	// Horizontal move
	if (fromRankIdx === toRankIdx) {
		const step = fromFileIdx < toFileIdx ? 1 : -1;
		for (let i = fromFileIdx + step; i !== toFileIdx; i += step) {
			const file = BOARD_FILES[i];
			if (!file || !isBoardFile(file)) continue;
			positions.push(`${file}${from.rank}`);
		}
	}
	// Vertical move
	else if (fromFileIdx === toFileIdx) {
		const step = fromRankIdx < toRankIdx ? 1 : -1;
		for (let i = fromRankIdx + step; i !== toRankIdx; i += step) {
			const rank = BOARD_RANKS[i];
			if (!rank || !isBoardRank(rank)) continue;
			positions.push(`${from.file}${rank}`);
		}
	}
	// Diagonal move
	else if (Math.abs(fromFileIdx - toFileIdx) === Math.abs(fromRankIdx - toRankIdx)) {
		const fileStep = fromFileIdx < toFileIdx ? 1 : -1;
		const rankStep = fromRankIdx < toRankIdx ? 1 : -1;
		let file = fromFileIdx + fileStep;
		let rank = fromRankIdx + rankStep;
		while (file !== toFileIdx && rank !== toRankIdx) {
			const nextFile = BOARD_FILES[file];
			const nextRank = BOARD_RANKS[rank];
			if (nextFile && nextRank) {
				positions.push(`${nextFile}${nextRank}`);
			}
			file += fileStep;
			rank += rankStep;
		}
	}

	return positions;
}

function isPathClear(from: Position, to: Position, board: BoardMap): boolean {
	return getPositionsBetween(from, to).every((pos) => !board.has(pos));
}

function isValidPawnMove(
	from: Position,
	to: Position,
	piece: PieceId,
	board: BoardMap,
	enPassantTarget: Position | null
): boolean {
	const fromFileIdx = from.fileIndex();
	const toFileIdx = to.fileIndex();
	const fromRankIdx = from.rankIndex();
	const toRankIdx = to.rankIndex();
	const isWhite = PieceId.isWhite(piece);
	const direction = isWhite ? 1 : -1;

	// Regular move forward
	if (from.file === to.file) {
		// One square forward
		if (toRankIdx - fromRankIdx === direction) {
			return !board.has(to);
		}
		// Two squares forward from starting position
		const startRank = isWhite ? '2' : '7';
		if (from.rank === startRank && toRankIdx - fromRankIdx === 2 * direction) {
			return !board.has(to) && isPathClear(from, to, board);
		}
	}
	// Capture (including en passant)
	else if (Math.abs(toFileIdx - fromFileIdx) === 1 && toRankIdx - fromRankIdx === direction) {
		return board.has(to) || Boolean(enPassantTarget?.equals(to));
	}

	return false;
}

function isValidKnightMove(from: Position, to: Position): boolean {
	const fileDiff = Math.abs(to.fileIndex() - from.fileIndex());
	const rankDiff = Math.abs(to.rankIndex() - from.rankIndex());
	return (fileDiff === 2 && rankDiff === 1) || (fileDiff === 1 && rankDiff === 2);
}

function isValidBishopMove(from: Position, to: Position, board: BoardMap): boolean {
	const fileDiff = Math.abs(to.fileIndex() - from.fileIndex());
	const rankDiff = Math.abs(to.rankIndex() - from.rankIndex());
	return fileDiff === rankDiff && isPathClear(from, to, board);
}

function isValidRookMove(from: Position, to: Position, board: BoardMap): boolean {
	return (from.file === to.file || from.rank === to.rank) && isPathClear(from, to, board);
}

function isValidQueenMove(from: Position, to: Position, board: BoardMap): boolean {
	return isValidBishopMove(from, to, board) || isValidRookMove(from, to, board);
}

function isValidKingMove(
	from: Position,
	to: Position,
	piece: PieceId,
	board: BoardMap,
	castling: CastlingRights
): { isValid: boolean; castling?: 'king-side' | 'queen-side' } {
	const fileDiff = Math.abs(to.fileIndex() - from.fileIndex());
	const rankDiff = Math.abs(to.rankIndex() - from.rankIndex());

	// Regular king move
	if (fileDiff <= 1 && rankDiff <= 1) {
		return { isValid: true };
	}

	const isWhite = PieceId.isWhite(piece);
	if (
		rankDiff === 0 &&
		from.rank === (isWhite ? InitialRank.WHITE : InitialRank.BLACK) &&
		from.file === 'e' &&
		isPathClear(from, to, board)
	) {
		// King-side castling
		if (
			to.file === 'g' &&
			((isWhite && castling.whiteKingSide) || (!isWhite && castling.blackKingSide))
		) {
			return { isValid: true, castling: 'king-side' };
		}
		// Queen-side castling
		if (
			to.file === 'c' &&
			((isWhite && castling.whiteQueenSide) || (!isWhite && castling.blackQueenSide))
		) {
			return { isValid: true, castling: 'queen-side' };
		}
	}

	return { isValid: false };
}

export function applyMove(board: BoardInfo, move: Move): BoardInfo {
	const isWhiteMove = board.turn === PlayerColor.WHITE;
	const newBoard: BoardInfo = {
		map: board.map.clone(),
		turn: isWhiteMove ? PlayerColor.BLACK : PlayerColor.WHITE,
		canCastle: { ...board.canCastle },
		enPassantTarget: null,
		halfMoveClock: board.halfMoveClock + 1,
		fullMoveNumber: isWhiteMove ? board.fullMoveNumber : board.fullMoveNumber + 1
	};

	if (board.map.get(move.from) !== move.piece) {
		throw new Error(`Piece at ${move.from} does not match the move piece: ${move.piece}`);
	}
	if (move.castling) {
		applyCastlingMove(newBoard, move);
		return newBoard;
	}

	newBoard.map.delete(move.from);

	if (move.isEnPassantCapture) {
		const capturedPawnRank = move.from.rank;
		const capturedPawnPos: PositionStr = `${move.to.file}${capturedPawnRank}`;
		newBoard.map.delete(capturedPawnPos);
	}

	if (move.promotion != null) {
		const promotedPiece = move.promotion;
		newBoard.map.set(move.to, promotedPiece);
	} else {
		newBoard.map.set(move.to, move.piece);
	}

	updateCastlingRights(newBoard.canCastle, move);

	// Reset half move clock on pawn moves or captures
	const isPawnMove = PieceId.isPawn(move.piece);
	if (isPawnMove || move.isCapture) {
		newBoard.halfMoveClock = 0;
	}
	// When a pawn moves two squares forward, it can be captured via en passant
	if (isPawnMove && Math.abs(move.from.rankIndex() - move.to.rankIndex()) == 2) {
		const rank: BoardRank = isWhiteMove ? EnPassantRank.WHITE : EnPassantRank.BLACK;
		newBoard.enPassantTarget = Position.make(move.from.file, rank);
	}

	return newBoard;
}

function applyCastlingMove(newBoard: BoardInfo, move: Move): void {
	const isWhiteMove = move.turn === PlayerColor.WHITE;

	if (move.castling === 'king-side') {
		const rank = isWhiteMove ? '1' : '8';
		const king = isWhiteMove ? PieceId.WHITE_KING : PieceId.BLACK_KING;
		const rook = isWhiteMove ? PieceId.WHITE_ROOK : PieceId.BLACK_ROOK;

		newBoard.map.delete(`e${rank}`);
		newBoard.map.delete(`h${rank}`);
		newBoard.map.set(`g${rank}`, king);
		newBoard.map.set(`f${rank}`, rook);

		if (isWhiteMove) {
			newBoard.canCastle.whiteKingSide = false;
			newBoard.canCastle.whiteQueenSide = false;
		} else {
			newBoard.canCastle.blackKingSide = false;
			newBoard.canCastle.blackQueenSide = false;
		}
		return;
	}

	if (move.castling === 'queen-side') {
		const rank = isWhiteMove ? '1' : '8';
		const king = isWhiteMove ? PieceId.WHITE_KING : PieceId.BLACK_KING;
		const rook = isWhiteMove ? PieceId.WHITE_ROOK : PieceId.BLACK_ROOK;

		newBoard.map.delete(`e${rank}`);
		newBoard.map.delete(`a${rank}`);
		newBoard.map.set(`c${rank}`, king);
		newBoard.map.set(`d${rank}`, rook);

		if (isWhiteMove) {
			newBoard.canCastle.whiteKingSide = false;
			newBoard.canCastle.whiteQueenSide = false;
		} else {
			newBoard.canCastle.blackKingSide = false;
			newBoard.canCastle.blackQueenSide = false;
		}
		return;
	}
}

function updateCastlingRights(castling: CastlingRights, move: Move): void {
	if (move.piece === PieceId.BLACK_KING) {
		castling.blackKingSide = false;
		castling.blackQueenSide = false;
	} else if (move.piece === PieceId.WHITE_KING) {
		castling.whiteKingSide = false;
		castling.whiteQueenSide = false;
	} else if (move.piece === PieceId.BLACK_ROOK) {
		if (move.from.equals('a8')) castling.blackQueenSide = false;
		if (move.from.equals('h8')) castling.blackKingSide = false;
	} else if (move.piece === PieceId.WHITE_ROOK) {
		if (move.from.equals('a1')) castling.whiteQueenSide = false;
		if (move.from.equals('h1')) castling.whiteKingSide = false;
	}
}
