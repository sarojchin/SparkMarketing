import { useSimStore } from '@/hooks/useSimStore';
import {
  ATTRIBUTE_LABELS, GRADE_COLORS, getMoraleRange,
  type AttributeName,
} from '@/simulation/data/attributes';

const ATTR_ORDER: AttributeName[] = ['persistence', 'empathy', 'genius', 'speed'];

export function CharacterPanel() {
  const selectedEntity = useSimStore((s) => s.selectedEntity);
  const people = useSimStore((s) => s.people);
  const setSelectedEntity = useSimStore((s) => s.setSelectedEntity);

  if (selectedEntity === null) return null;

  const person = people.find((p) => p.entity === selectedEntity);
  if (!person) return null;

  const moraleRange = getMoraleRange(person.morale);

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 z-20 w-[180px] bg-sim-surface border border-l-0 border-sim-border rounded-r shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-sim-border">
        <div>
          <div className="text-[8px] font-pixel text-sim-text uppercase tracking-[1px]">
            {person.name}
          </div>
          <div className="text-[6px] font-pixel text-sim-textDim mt-0.5">
            {person.role}
          </div>
        </div>
        <button
          onClick={() => setSelectedEntity(null)}
          className="text-[9px] font-pixel text-sim-textDim hover:text-sim-text transition-colors"
        >
          ×
        </button>
      </div>

      {/* Attributes */}
      <div className="px-2.5 py-2 space-y-1.5">
        <div className="text-[6px] font-pixel text-sim-textDim uppercase tracking-[1.5px]">
          Attributes
        </div>
        {ATTR_ORDER.map((attr) => {
          const grade = person.attributes[attr];
          const color = GRADE_COLORS[grade];
          return (
            <div key={attr} className="flex items-center justify-between">
              <span className="text-[7px] font-pixel text-sim-text">
                {ATTRIBUTE_LABELS[attr]}
              </span>
              <span
                className="text-[8px] font-pixel font-bold px-1.5 py-0.5 rounded min-w-[24px] text-center"
                style={{
                  color,
                  backgroundColor: `${color}15`,
                  border: `1px solid ${color}30`,
                }}
              >
                {grade}
              </span>
            </div>
          );
        })}
      </div>

      {/* Morale */}
      <div className="px-2.5 py-2 border-t border-sim-border">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[6px] font-pixel text-sim-textDim uppercase tracking-[1.5px]">
            Morale
          </span>
          <span
            className="text-[6px] font-pixel"
            style={{ color: moraleRange.color }}
          >
            {moraleRange.label}
          </span>
        </div>
        {/* Bar */}
        <div className="w-full h-[6px] rounded-sm overflow-hidden" style={{ backgroundColor: '#e8e4dd' }}>
          <div
            className="h-full rounded-sm transition-all duration-300"
            style={{
              width: `${Math.min(100, person.morale)}%`,
              backgroundColor: moraleRange.color,
            }}
          />
        </div>
        <div className="text-[7px] font-pixel text-sim-text text-right mt-0.5">
          {Math.round(person.morale)}
        </div>
      </div>
    </div>
  );
}
