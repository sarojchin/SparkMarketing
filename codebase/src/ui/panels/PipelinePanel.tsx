import { useState } from 'react';
import { useSimStore } from '@/hooks/useSimStore';
import { PIPELINE_STEPS } from '@/simulation/data/production';

const PHASE_LABELS: Record<string, string> = {
  prospecting: 'Outreach',
  sales: 'Sales',
  production: 'Production',
  delivery: 'Delivery',
};

/** Ordered phases for prerequisite checking */
const PHASE_ORDER = ['prospecting', 'sales', 'production', 'delivery'];

/** Get the first step index for a given phase */
function phaseStartIndex(phase: string): number {
  return PIPELINE_STEPS.findIndex(s => s.phase === phase);
}

/** Check if all steps in a phase are complete (all steps before next phase's first step) */
function isPhaseComplete(phase: string, currentStep: number): boolean {
  const start = phaseStartIndex(phase);
  if (start === -1) return false;
  const nextPhaseIdx = PHASE_ORDER.indexOf(phase) + 1;
  const end = nextPhaseIdx < PHASE_ORDER.length
    ? phaseStartIndex(PHASE_ORDER[nextPhaseIdx])
    : PIPELINE_STEPS.length;
  return currentStep >= end;
}

/** Check if a phase's prerequisites are met */
function canAssignPhase(phase: string, currentStep: number): boolean {
  const phaseIdx = PHASE_ORDER.indexOf(phase);
  if (phaseIdx <= 0) return true; // prospecting always available
  // Previous phase must be complete
  const prevPhase = PHASE_ORDER[phaseIdx - 1];
  return isPhaseComplete(prevPhase, currentStep);
}

/** Check if the current step belongs to this phase (meaning it's the active phase) */
function isPhaseActive(phase: string, currentStep: number): boolean {
  const step = PIPELINE_STEPS[currentStep];
  return step?.phase === phase;
}

export function PipelinePanel() {
  const [minimized, setMinimized] = useState(false);
  const person = useSimStore((s) => s.people[0]);
  const campaignsShipped = useSimStore((s) => s.campaignsShipped);
  const directive = useSimStore((s) => s.directive);
  const setDirective = useSimStore((s) => s.setDirective);

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
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-20 w-[200px] bg-sim-surface border border-r-0 border-sim-border rounded-l shadow-sm">
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

      {/* Awaiting orders banner */}
      {!directive && (
        <div className="px-2.5 py-1.5 bg-amber-50 border-b border-amber-200">
          <span className="text-[7px] font-pixel text-amber-700">
            ⚡ Assign a task below
          </span>
        </div>
      )}

      {/* Step list */}
      <div className="px-2.5 py-2 space-y-0.5 max-h-[320px] overflow-y-auto">
        {PIPELINE_STEPS.map((step, i) => {
          const isComplete = i < currentStep;
          const isCurrent = i === currentStep;
          const showPhaseHeader = step.phase !== lastPhase;
          lastPhase = step.phase;

          const phaseComplete = isPhaseComplete(step.phase, currentStep);
          const canAssign = canAssignPhase(step.phase, currentStep);
          const isAssigned = directive === step.phase;
          const isWaiting = !directive && isPhaseActive(step.phase, currentStep);

          return (
            <div key={i}>
              {showPhaseHeader && (
                <PhaseButton
                  phase={step.phase}
                  label={PHASE_LABELS[step.phase] || step.phase}
                  isComplete={phaseComplete}
                  isAssigned={isAssigned}
                  canAssign={canAssign && !phaseComplete}
                  isWaiting={isWaiting}
                  onAssign={() => setDirective(step.phase)}
                />
              )}
              <div className="flex items-center gap-1.5 ml-1">
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
                {isCurrent && person && directive === step.phase && (
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

function PhaseButton({
  phase,
  label,
  isComplete,
  isAssigned,
  canAssign,
  isWaiting,
  onAssign,
}: {
  phase: string;
  label: string;
  isComplete: boolean;
  isAssigned: boolean;
  canAssign: boolean;
  isWaiting: boolean;
  onAssign: () => void;
}) {
  if (isComplete) {
    return (
      <div className="flex items-center gap-1.5 mt-2 mb-0.5">
        <span className="text-[7px] text-sim-green">✓</span>
        <span className="text-[7px] font-pixel text-sim-textDim uppercase tracking-[1.5px] line-through">
          {label}
        </span>
      </div>
    );
  }

  if (isAssigned) {
    return (
      <div className="flex items-center gap-1.5 mt-2 mb-0.5">
        <span className="text-[7px] text-sim-green animate-pulse">●</span>
        <span className="text-[7px] font-pixel text-sim-green uppercase tracking-[1.5px]">
          {label}
        </span>
        <span className="text-[6px] font-pixel text-sim-textDim ml-auto">
          active
        </span>
      </div>
    );
  }

  if (canAssign) {
    return (
      <button
        onClick={onAssign}
        className="flex items-center gap-1.5 mt-2 mb-0.5 w-full group"
      >
        <span className="text-[7px] text-sim-blue group-hover:text-sim-green transition-colors">▶</span>
        <span className="text-[7px] font-pixel text-sim-blue uppercase tracking-[1.5px] group-hover:text-sim-green transition-colors">
          {label}
        </span>
        <span className="text-[6px] font-pixel text-sim-textDim ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          assign
        </span>
      </button>
    );
  }

  // Locked — prerequisites not met
  return (
    <div className="flex items-center gap-1.5 mt-2 mb-0.5 opacity-40">
      <span className="text-[7px] text-sim-border">🔒</span>
      <span className="text-[7px] font-pixel text-sim-textDim uppercase tracking-[1.5px]">
        {label}
      </span>
    </div>
  );
}
