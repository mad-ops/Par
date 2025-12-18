import { StandardBoard } from './StandardBoard';
import { HardBoard } from './HardBoard';
import type { LetterState } from '../types';

interface GameBoardProps {
    letters: LetterState[];
    selectedIndices: number[];
    onTileClick: (index: number) => void;
}

export const GameBoard = ({ letters, selectedIndices, onTileClick, isHardMode }: GameBoardProps & { isHardMode?: boolean }) => {
    if (isHardMode) {
        return <HardBoard letters={letters} selectedIndices={selectedIndices} onTileClick={onTileClick} />;
    }
    return <StandardBoard letters={letters} selectedIndices={selectedIndices} onTileClick={onTileClick} />;
};
