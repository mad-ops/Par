import clsx from 'clsx';
import type { LetterState } from '../types';

interface GameBoardProps {
    letters: LetterState[];
    selectedIndices: number[];
    onTileClick: (index: number) => void;
}

export const HardBoard = ({ letters, selectedIndices, onTileClick }: GameBoardProps) => {
    return (
        <div
            className="grid grid-cols-5 mt-12 w-full max-w-[400px] mx-auto mb-4"
            style={{ rowGap: '8px', columnGap: '4px' }}
        >
            {letters.map((l) => {
                const isSelected = selectedIndices.includes(l.id);
                return (
                    <div
                        key={l.id}
                        id={`board-tile-${l.id}`}
                        data-testid={`board-tile-${l.id}`}
                        onClick={() => onTileClick(l.id)}
                        className={clsx(
                            "flex items-center justify-center text-3xl sm:text-4xl font-black rounded-xl shadow-md transition-all duration-100 select-none p-1 cursor-pointer",
                            "border-4", // Always have border width to prevent layout shift
                            isSelected ? "z-10" : "",

                            // Base State (only if not selected)
                            (!isSelected && l.status === 'consumed') && "bg-par-primary card-consumed",
                            (!isSelected && l.status !== 'consumed') && "card-available",

                            // Dimmed if consumed but not selected
                            (l.status === 'consumed' && !isSelected) && "bg-slate-300 text-slate-500 opacity-50",

                            // Hard Mode Selection
                            isSelected && "!bg-blue-500 text-white !border-transparent",

                            // Shape
                            "hexagon-tile aspect-square" // Removed scale-90 as requested
                        )}
                        style={{
                            borderColor: 'transparent',
                            // Force background color via style for hard mode selection
                            backgroundColor: isSelected ? '#3b82f6' : undefined
                        }}
                    >
                        {l.char}
                    </div>
                );
            })}
        </div>
    );
};
