import { useState } from 'react';
import { useSimStore } from '@/hooks/useSimStore';
import { PIPELINE_STEPS } from '@/simulation/data/production';

const PHASE_LABELS: Record<string, string> = {
  prospecting: 'Prospecting',
  sales: 'Sales',
  production: 'Production',
  delivery: 'Delivery',
};

export function PipelinePanel() {
  const [minimized, setMinimized] = useState(false);
  const person = useSimStore((s) => s.people[0]);
  const campaignsShipped = useSimStore((s) => s.campaignsShipped);

  const currentStep = person?.currentStep ?? 0;

  if (minimized) {
    return (
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-20">
        <button
          onClick={() => setMinimized(false)}
          className="bg-sim-surface border border-r-0 border-sim-border px-1.5 py-3 font-pixel text-[7px] text-sim-textDim hover:text-sim-text transition-colors rounded-l"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          Campaign #{campaignsShipped + 1} ▸
        </button>
      </div>
    );
  }

  // Group steps by phase
  let lastPhase = '';

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-20 w-[180px] bg-sim-surface border border-r-0 border-sim-border rounded-l shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-sim-border">
        <span className="text-[8px] font-pixel text-sim-text uppercase tracking-[1.5px]">
          Campaign #{campaignsShipped + 1}
        </span>
        <button
          onClick={() => setMinimized(true)}
          className="text-[8px] font-pixel text-sim-textDim hover:text-sim-text transition-colors"
        >
          ◂
        </button>
      </div>

      {/* Step list */}
      <div className="px-2.5 py-2 space-y-0.5 max-h-[320px] overflow-y-auto">
        {PIPELINE_STEPS.map((step, i) => {
          const isComplete = i < currentStep;
          const isCurrent = i === currentStep;
          const showPhaseHeader = step.phase !== lastPhase;
          lastPhase = step.phase;

          return (
            <div key={i}>
              {showPhaseHeader && (
                <div className="text-[6px] font-pixel text-sim-textDim uppercase tracking-[1.5px] mt-1.5 mb-0.5">
                  {PHASE_LABELS[step.phase] || step.phase}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] flex-shrink-0 ${
                  isComplete ? 'text-sim-green' : isCurrent ? 'text-sim-blue' : 'text-sim-border'
                }`}>
                  {isComplete ? '✓' : isCurrent ? '▸' : '·'}
                </span>
                <span className={`text-[7px] font-pixel truncate ${
                  isComplete
                    ? 'text-sim-textDim line-through'
                    : isCurrent
                    ? 'text-sim-text'
                    : 'text-sim-textDim'
                }`}>
                  {step.name}
                </span>
                {isCurrent && person && (
                  <span className="text-[6px] font-pixel text-sim-blue ml-auto flex-shrink-0">
                    {Math.round(person.stepProgress * 100)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
