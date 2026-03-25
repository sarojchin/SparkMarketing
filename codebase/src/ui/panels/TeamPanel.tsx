import { useSimStore } from '@/hooks/useSimStore';

const STATE_STYLES: Record<string, { label: string; class: string }> = {
  working:  { label: 'working',  class: 'text-sim-green' },
  idle:     { label: 'idle',     class: 'text-sim-yellow' },
  walking:  { label: 'walking',  class: 'text-sim-blue' },
  coffee:   { label: 'coffee',   class: 'text-sim-purple' },
  meeting:  { label: 'meeting',  class: 'text-sim-pink' },
  chatting: { label: 'chatting', class: 'text-sim-yellow' },
  thinking: { label: 'thinking', class: 'text-sim-blue' },
};

export function TeamPanel() {
  const people = useSimStore((s) => s.people);

  return (
    <div className="p-3">
      <div className="text-[8px] uppercase tracking-[2px] text-sim-textDim font-pixel mb-2">
        Team
      </div>
      <div className="space-y-1.5">
        {people.map((person) => {
          const style = STATE_STYLES[person.state] || STATE_STYLES.idle;
          return (
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
                  {person.taskName || person.role}
                </div>
                {person.taskName && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="flex-1 h-[3px] bg-sim-border rounded-sm overflow-hidden">
                      <div
                        className="h-full rounded-sm transition-all duration-300"
                        style={{
                          width: `${Math.round(person.taskProgress * 100)}%`,
                          backgroundColor: person.taskComplete ? '#16a34a' : person.color,
                        }}
                      />
                    </div>
                    <span className="text-[6px] font-pixel text-sim-textDim w-5 text-right">
                      {person.taskComplete ? '✓' : `${Math.round(person.taskProgress * 100)}%`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
