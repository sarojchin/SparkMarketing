import type { Decision } from '@/engine/types';

interface DecisionDialogProps {
  decision: Decision;
  onChoose: (decisionId: string, optionId: string) => void;
  onClose: () => void;
}

export function DecisionDialog({ decision, onChoose, onClose }: DecisionDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-sim-surface border-2 border-sim-green rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
        {/* Header with close button */}
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-lg font-pixel text-sim-green tracking-wide">
            {decision.title}
          </h2>
          <button
            onClick={onClose}
            className="text-sim-textDim hover:text-sim-green transition-colors font-pixel text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Description */}
        <p className="text-sm font-pixel text-sim-text mb-6 leading-relaxed">
          {decision.description}
        </p>

        {/* Options */}
        <div className="space-y-3">
          {decision.options.map((option) => (
            <button
              key={option.id}
              onClick={() => onChoose(decision.id, option.id)}
              className="w-full text-left p-3 border border-sim-border hover:border-sim-green hover:bg-sim-bg transition-colors rounded"
            >
              <div className="font-pixel text-sim-green text-sm">
                → {option.label}
              </div>
              <div className="text-xs font-pixel text-sim-textDim mt-1">
                {option.description}
              </div>
              {option.consequences && (
                <div className="text-xs font-pixel text-sim-yellow mt-2 italic">
                  {option.consequences}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 text-xs font-pixel text-sim-textDim text-center border-t border-sim-border pt-3">
          {decision.deadline ? (
            <span>Deadline: Month {decision.deadline.month}, Day {decision.deadline.day}</span>
          ) : (
            <span>Close to dismiss, or click an option to decide</span>
          )}
        </div>
      </div>
    </div>
  );
}
