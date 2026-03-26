import { useSimStore } from '@/hooks/useSimStore';

const TYPE_CLASSES: Record<string, string> = {
  action: 'text-sim-green',
  event:  'text-sim-blue',
  chat:   'text-sim-yellow',
  system: 'text-sim-textDim',
  quote:  'text-sim-purple italic',
};

export function LogPanel() {
  const log = useSimStore((s) => s.log);

  return (
    <div className="p-3 flex-1 overflow-y-auto">
      <div className="text-[8px] uppercase tracking-[2px] text-sim-textDim font-pixel mb-2">
        Activity
      </div>
      <div className="space-y-0.5">
        {log.map((entry, i) => (
          <div key={`${entry.tick}-${i}`} className="flex gap-2 text-[7px] font-pixel leading-relaxed">
            <span className="text-sim-textDim flex-shrink-0 w-8">
              {entry.time}
            </span>
            <span className={TYPE_CLASSES[entry.type] || 'text-sim-textDim'}>
              {entry.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
