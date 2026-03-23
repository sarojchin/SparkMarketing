import { useSimStore } from '@/hooks/useSimStore';

interface TooltipProps {
  x: number;
  y: number;
}

const STATE_COLORS: Record<string, string> = {
  working: 'text-sim-green',
  idle: 'text-sim-yellow',
  walking: 'text-sim-blue',
  coffee: 'text-sim-purple',
  meeting: 'text-sim-pink',
  chatting: 'text-sim-yellow',
};

export function Tooltip({ x, y }: TooltipProps) {
  const { hoveredEntity, people } = useSimStore((s) => ({
    hoveredEntity: s.hoveredEntity,
    people: s.people,
  }));

  if (hoveredEntity === null) return null;

  const person = people.find((p) => p.entity === hoveredEntity);
  if (!person) return null;

  return (
    <div
      className="fixed z-50 pointer-events-none bg-sim-surface border border-sim-border px-2.5 py-1.5 font-pixel"
      style={{
        left: x + 12,
        top: y - 10,
        maxWidth: 160,
      }}
    >
      <div className="text-[8px] text-sim-green">{person.name}</div>
      <div className="text-[7px] text-sim-textDim">{person.role}</div>
      <div className={`text-[7px] mt-0.5 ${STATE_COLORS[person.state] || 'text-sim-textDim'}`}>
        {person.state}
      </div>
    </div>
  );
}
