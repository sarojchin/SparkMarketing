import { useState } from 'react';
import { useSimStore } from '@/hooks/useSimStore';
import {
  ATTRIBUTE_LABELS, GRADE_COLORS, getMoraleRange,
  type AttributeName,
} from '@/simulation/data/attributes';
import { TASK_DEFS } from '@/simulation/data/production';

const ATTR_ORDER: AttributeName[] = ['persistence', 'empathy', 'genius', 'speed'];

function energyColor(value: number): string {
  if (value < 20) return '#dc2626'; // red
  if (value < 40) return '#ea580c'; // orange
  if (value < 60) return '#ca8a04'; // yellow
  return '#2563eb';                  // blue
}

export function CharacterPanel() {
  const selectedEntity = useSimStore((s) => s.selectedEntity);
  const people = useSimStore((s) => s.people);
  const setSelectedEntity = useSimStore((s) => s.setSelectedEntity);
  const assignEntityTask = useSimStore((s) => s.assignEntityTask);
  const [outreachOpen, setOutreachOpen] = useState(true);

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

      {/* Morale & Energy */}
      <div className="px-2.5 py-2 border-t border-sim-border space-y-2">
        {/* Morale */}
        <div>
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

        {/* Energy */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[6px] font-pixel text-sim-textDim uppercase tracking-[1.5px]">
              Energy
            </span>
            <span className="text-[6px] font-pixel" style={{ color: energyColor(person.energy) }}>
              {Math.round(person.energy)}%
            </span>
          </div>
          <div className="w-full h-[6px] rounded-sm overflow-hidden" style={{ backgroundColor: '#e8e4dd' }}>
            <div
              className="h-full rounded-sm transition-all duration-300"
              style={{
                width: `${Math.min(100, person.energy)}%`,
                backgroundColor: energyColor(person.energy),
              }}
            />
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="px-2.5 py-2 border-t border-sim-border space-y-1">
        <div className="text-[6px] font-pixel text-sim-textDim uppercase tracking-[1.5px]">
          Tasks
        </div>

        {/* Outreach group */}
        <button
          onClick={() => setOutreachOpen(!outreachOpen)}
          className="flex items-center gap-1 w-full text-left"
        >
          <span className="text-[7px] text-sim-textDim">{outreachOpen ? '▾' : '▸'}</span>
          <span className="text-[7px] font-pixel text-sim-text">Outreach</span>
        </button>
        {outreachOpen && (
          <div className="ml-3 space-y-0.5">
            <TaskButton
              taskKey="outreach_emails"
              activeTaskKey={person.assignedTaskKey}
              entity={person.entity}
              onAssign={assignEntityTask}
            />
            <TaskButton
              taskKey="outreach_calls"
              activeTaskKey={person.assignedTaskKey}
              entity={person.entity}
              onAssign={assignEntityTask}
            />
          </div>
        )}

        {/* Content Creation */}
        <TaskButton
          taskKey="content_creation"
          activeTaskKey={person.assignedTaskKey}
          entity={person.entity}
          onAssign={assignEntityTask}
        />

        {/* Clear task */}
        {person.assignedTaskKey && (
          <button
            onClick={() => assignEntityTask(person.entity, null)}
            className="text-[6px] font-pixel text-sim-textDim hover:text-red-500 transition-colors mt-1"
          >
            ✕ Clear Task
          </button>
        )}
      </div>

      {/* Production Report */}
      <div className="px-2.5 py-2 border-t border-sim-border space-y-1">
        <div className="text-[6px] font-pixel text-sim-textDim uppercase tracking-[1.5px]">
          Production
        </div>
        <div className="space-y-0.5">
          <CounterRow icon="📞" label="Calls Made" value={person.callsMade} />
          <CounterRow icon="📧" label="Emails Sent" value={person.emailsSent} />
          <CounterRow icon="🎨" label="Campaigns" value={person.campaignsCreated} />
        </div>
      </div>
    </div>
  );
}

function TaskButton({
  taskKey,
  activeTaskKey,
  entity,
  onAssign,
}: {
  taskKey: string;
  activeTaskKey: string | null;
  entity: number;
  onAssign: (entity: number, taskKey: string | null) => void;
}) {
  const def = TASK_DEFS[taskKey];
  if (!def) return null;

  const isActive = activeTaskKey === taskKey;

  return (
    <button
      onClick={() => onAssign(entity, isActive ? null : taskKey)}
      className={`flex items-center gap-1.5 w-full text-left py-0.5 px-1 rounded transition-colors ${
        isActive
          ? 'bg-green-50 border border-green-300'
          : 'hover:bg-sim-bg border border-transparent'
      }`}
    >
      <span className="text-[8px]">{def.icon}</span>
      <span className={`text-[7px] font-pixel ${isActive ? 'text-sim-green' : 'text-sim-text'}`}>
        {def.label}
      </span>
      {isActive && (
        <span className="text-[6px] font-pixel text-sim-green ml-auto animate-pulse">
          active
        </span>
      )}
    </button>
  );
}

function CounterRow({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[7px] font-pixel text-sim-text">
        {icon} {label}
      </span>
      <span className="text-[8px] font-pixel font-bold text-sim-text">
        {value}
      </span>
    </div>
  );
}
