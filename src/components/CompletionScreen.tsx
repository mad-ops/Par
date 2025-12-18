import { X } from 'lucide-react';

interface CompletionScreenProps {
    score: number;
    submissions: string[];
    onClose: () => void;
    isComplete: boolean;
    onRestart?: () => void;
    onStartHardMode?: () => void;
    isHardMode?: boolean;
}

export const CompletionScreen = ({ score, submissions, onClose, isComplete, onRestart, onStartHardMode, isHardMode }: CompletionScreenProps) => {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 animate-fadeIn backdrop-blur-sm">
            <div
                className="relative flex flex-col items-center p-6 rounded-xl shadow-2xl overflow-hidden border-4 border-black !bg-white !opacity-100"
                style={{ width: '96vw', height: '96vh', maxWidth: 'none', maxHeight: 'none', backgroundColor: 'white' }}
            >
                <button
                    onClick={onClose}
                    className="text-slate-900 hover:text-black hover:scale-110 transition-all z-50"
                    style={{
                        position: 'absolute',
                        top: '32px',
                        right: '32px',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        cursor: 'pointer',
                        padding: 0
                    }}
                    aria-label="Close"
                >
                    <X size={48} strokeWidth={3} />
                </button>

                {isComplete && (
                    <>
                        <h1 className="font-extrabold mb-8 tracking-widest uppercase mt-8 text-center text-slate-900 text-[32px]">
                            {isHardMode ? "Thank you for playing!" : "COMPLETE!"}
                        </h1>

                        {/* Score Section */}
                        <h2 className="text-slate-400 uppercase tracking-widest font-bold mb-8 text-center py-2 text-[32px]">
                            {isHardMode ? "SWAPS:" : "SCORE:"} {score}
                        </h2>

                        {!isHardMode && (
                            <div className="w-full max-w-[400px] px-1 mb-8">
                                <button
                                    onClick={onStartHardMode || onRestart}
                                    className="w-full !h-12 min-h-[48px] bg-slate-200 rounded-xl flex items-center justify-center shadow hover:bg-slate-300 active:bg-slate-400 active:scale-95 transition-all uppercase font-black text-sm tracking-wide text-slate-700 shrink-0 cursor-pointer border border-slate-300"
                                    style={{ height: '48px' }}
                                >
                                    TRY HARD MODE
                                </button>
                            </div>
                        )}
                    </>
                )}

                {!isComplete && (
                    <div className="mt-16"></div>
                )}

                {/* History */}
                {!isHardMode && (
                    <div className="w-full mb-4 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-slate-300">
                        <h2 className="text-slate-400 uppercase tracking-widest font-bold mb-8 text-center sticky top-0 bg-white py-2 z-10 text-[32px]">
                            History
                        </h2>

                        <div className="flex flex-col gap-4 items-center pb-12">
                            {submissions.map((word, i) => (
                                <div key={i} className="flex gap-2 my-[2px]">
                                    {word.split('').map((char, j) => (
                                        <div
                                            key={j}
                                            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center font-black text-slate-900 text-[24px]"
                                        >
                                            {char}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
