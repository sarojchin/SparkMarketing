interface GameOverScreenProps {
  reason: string;
}

export function GameOverScreen({ reason }: GameOverScreenProps) {
  const handleReset = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-sim-surface border-2 border-sim-pink rounded-lg p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
        <h1 className="text-2xl font-pixel text-sim-pink mb-4 tracking-wider">
          GAME OVER
        </h1>

        <p className="text-sm font-pixel text-sim-text mb-6 leading-relaxed">
          {reason}
        </p>

        <button
          onClick={handleReset}
          className="px-4 py-2 bg-sim-green text-sim-bg font-pixel text-sm hover:bg-sim-green/80 transition-colors border border-sim-green rounded"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
