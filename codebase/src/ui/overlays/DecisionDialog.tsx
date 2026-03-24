import type { Decision } from '@/engine/types';

interface DecisionDialogProps {
  decision: Decision;
  onChoose: (decisionId: string, optionId: string) => void;
  onClose?: () => void;
}

export function DecisionDialog({ decision, onChoose, onClose }: DecisionDialogProps) {
  console.log('📋 DecisionDialog rendered with decision:', decision.id);

  const handleOptionClick = (optionId: string) => {
    console.warn('🎯 OPTION CLICKED:', { decisionId: decision.id, optionId });
    console.warn('🎯 Calling onChoose...');
    try {
      onChoose(decision.id, optionId);
      console.warn('✅ onChoose called successfully');
    } catch (error) {
      console.error('❌ Error calling onChoose:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-sim-surface border-2 border-sim-green rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl relative pointer-events-auto">
        {/* Close button */}
        <button
          onClick={() => {
            console.log('Dialog dismissed');
            onClose?.();
          }}
          className="absolute top-2 right-2 text-sim-textDim hover:text-sim-green transition-colors text-lg w-6 h-6 flex items-center justify-center"
          title="Dismiss (no action)"
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-lg font-pixel text-sim-green mb-2 tracking-wide pr-6">
          {decision.title}
        </h2>

        {/* Description */}
        <p className="text-sm font-pixel text-sim-text mb-6 leading-relaxed">
          {decision.description}
        </p>

        {/* Options */}
        <div className="space-y-3">
          {decision.options.map((option) => (
            <button
              key={option.id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleOptionClick(option.id);
              }}
              onMouseDown={(e) => {
                console.warn('🖱️ MOUSE DOWN on:', option.id);
              }}
              className="w-full text-left p-3 border border-sim-border hover:border-sim-green hover:bg-sim-bg transition-colors rounded cursor-pointer active:bg-sim-border"
              type="button"
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
        {decision.deadline && (
          <div className="mt-4 text-xs font-pixel text-sim-textDim text-center border-t border-sim-border pt-3">
            Deadline: Month {decision.deadline.month}, Day {decision.deadline.day}
          </div>
        )}
      </div>
    </div>
  );
}
