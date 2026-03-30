import { useSimStore } from '@/hooks/useSimStore';

export function ClientPanel() {
  const clients = useSimStore((s) => s.clients);
  const selectedClientEntity = useSimStore((s) => s.selectedClientEntity);
  const setSelectedClientEntity = useSimStore((s) => s.setSelectedClientEntity);

  return (
    <div className="p-3 h-full overflow-y-auto">
      <div className="text-[8px] uppercase tracking-[2px] text-sim-textDim font-pixel mb-2">
        Clients
      </div>
      {clients.length === 0 ? (
        <div className="text-[7px] text-sim-textDim font-pixel">None</div>
      ) : (
        <div className="space-y-1.5">
          {clients.map((client) => {
            const isSelected = selectedClientEntity === client.entity;
            return (
              <button
                key={client.entity}
                onClick={() => setSelectedClientEntity(isSelected ? null : client.entity)}
                className={`min-w-0 w-full text-left px-1 py-0.5 rounded transition-colors ${
                  isSelected
                    ? 'bg-green-50 border border-green-300'
                    : 'hover:bg-sim-bg border border-transparent'
                }`}
              >
                <div className="text-[8px] text-sim-text font-pixel truncate">{client.name}</div>
                <div className="flex justify-between items-center gap-1">
                  <span className="text-[7px] text-sim-textDim font-pixel truncate">{client.industry}</span>
                  <span className="text-[7px] text-sim-green font-pixel flex-shrink-0">{client.reputation}★</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
