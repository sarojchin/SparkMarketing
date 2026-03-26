import { useSimStore } from '@/hooks/useSimStore';

export function TeamPanel() {
  const people = useSimStore((s) => s.people);

  return (
    <div className="p-3">
      <div className="text-[8px] uppercase tracking-[2px] text-sim-textDim font-pixel mb-2">
        Team
      </div>
      <div className="space-y-1.5">
        {people.map((person) => (
          <div key={person.entity} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-sm flex-shrink-0"
              style={{ backgroundColor: person.color }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-[8px] text-sim-text font-pixel truncate">
                {person.name}
              </div>
              <div className="text-[7px] text-sim-textDim font-pixel truncate">
                {person.stepName || person.role}
              </div>
              {person.stepName && (
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="flex-1 h-[3px] bg-sim-border rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-all duration-300"
                      style={{
                        width: `${Math.round(person.stepProgress * 100)}%`,
                        backgroundColor: person.color,
                      }}
                    />
                  </div>
                  <span className="text-[6px] font-pixel text-sim-textDim w-5 text-right">
                    {Math.round(person.stepProgress * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
