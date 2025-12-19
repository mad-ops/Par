import clsx from 'clsx';




export const InputRow = ({ currentInput, isError, isSuccess, isWarning, isComplete, placeholder }: { currentInput: string; isError: boolean; isSuccess?: boolean; isWarning?: boolean; isComplete?: boolean; placeholder?: string }) => {
    const slots = Array(5).fill('');

    return (
        <div className={clsx("grid grid-cols-5 gap-4 w-full max-w-[400px]", isError && "animate-shake", isSuccess && "animate-pop", isWarning && "animate-shake")} style={{ marginBottom: '4px' }}>
            {slots.map((_, i) => (
                <div key={i} className="flex flex-col items-center w-full">
                    {/* Letter Card */}
                    <div
                        className={clsx(
                            "w-full aspect-square flex items-center justify-center text-3xl sm:text-4xl font-black rounded-xl p-1 m-[2px] transition-all z-10",
                            isComplete
                                ? "bg-purple-500 text-white border-none"
                                : isSuccess
                                    ? "bg-green-500 text-white border-none"
                                    : isError
                                        ? "bg-red-500 text-white border-none"
                                        : isWarning
                                            ? "bg-yellow-500 text-white border-none"
                                            : i < currentInput.length
                                                ? "card-input-filled shadow-sm"
                                                : !currentInput && placeholder ? "bg-blue-400 text-white border-none" : "bg-transparent"
                        )}
                        style={{
                            backgroundColor: isComplete ? '#a855f7' : isSuccess ? '#22c55e' : isError ? '#ef4444' : isWarning ? '#eab308' : (!currentInput && placeholder) ? '#60a5fa' : undefined,
                            color: (isComplete || isSuccess || isError || isWarning || (!currentInput && placeholder)) ? 'white' : undefined,
                        }}
                    >
                        {currentInput[i] || (placeholder && !currentInput ? placeholder[i] : '')}
                    </div>

                    {/* Spacer (at least 2px) */}
                    <div className="w-full h-[4px] shrink-0" />

                    {/* Persistent Block Underline (Width of 2px = Thickness) */}
                    <div
                        className="mx-auto shrink-0"
                        style={{
                            width: 'calc(100% - 2px)',
                            height: '2px',
                            minHeight: '2px',
                            backgroundColor: 'black'
                        }}
                    />
                </div>
            ))}
        </div>
    );
};
