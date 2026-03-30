import { useSimStore } from '@/hooks/useSimStore';

export function ClientDetailPanel() {
  const selectedClient = useSimStore((s) => s.selectedClient);
  const clients = useSimStore((s) => s.clients);
  const setSelectedClient = useSimStore((s) => s.setSelectedClient);

  if (selectedClient === null) return null;

  const client = clients.find((c) => c.entity === selectedClient);
  if (!client) return null;

  return (
    <div className="fixed right-[200px] top-1/2 -translate-y-1/2 z-20 w-[200px] bg-sim-surface border border-r-0 border-sim-border rounded-l shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-sim-border">
        <div className="min-w-0 flex-1">
          <div className="text-[8px] font-pixel text-sim-text uppercase tracking-[1px] truncate">
            {client.name}
          </div>
          <div className="text-[6px] font-pixel text-sim-textDim mt-0.5">
            {client.industry}
          </div>
        </div>
        <button
          onClick={() => setSelectedClient(null)}
          className="text-[9px] font-pixel text-sim-textDim hover:text-sim-text transition-colors ml-1 flex-shrink-0"
        >
          ×
        </button>
      </div>

      {/* Client Info */}
      <div className="px-2.5 py-2 space-y-1.5">
        <div className="text-[6px] font-pixel text-sim-textDim uppercase tracking-[1.5px]">
          Details
        </div>
        <InfoRow label="Industry" value={client.industry} />
        <InfoRow label="Size" value={`${client.size} employees`} />
        <InfoRow label="Reputation" value={`${client.reputation} / 100`} color="text-sim-green" />
      </div>

      {/* Project Details */}
      <div className="px-2.5 py-2 border-t border-sim-border space-y-1.5">
        <div className="text-[6px] font-pixel text-sim-textDim uppercase tracking-[1.5px]">
          Project
        </div>
        <div className="text-[7px] font-pixel text-sim-text leading-relaxed">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua.
        </div>
        <div className="space-y-1 mt-1">
          <InfoRow label="Budget" value="$12,000" color="text-sim-green" />
          <InfoRow label="Deadline" value="14 days" />
          <InfoRow label="Status" value="In Progress" color="text-yellow-600" />
        </div>
      </div>

      {/* Deliverables */}
      <div className="px-2.5 py-2 border-t border-sim-border space-y-1.5">
        <div className="text-[6px] font-pixel text-sim-textDim uppercase tracking-[1.5px]">
          Deliverables
        </div>
        <div className="space-y-0.5">
          <DeliverableRow label="Brand Strategy Doc" done />
          <DeliverableRow label="Social Media Campaign" done={false} />
          <DeliverableRow label="Email Sequence" done={false} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[7px] font-pixel text-sim-textDim">{label}</span>
      <span className={`text-[7px] font-pixel ${color ?? 'text-sim-text'}`}>{value}</span>
    </div>
  );
}

function DeliverableRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-[7px] ${done ? 'text-sim-green' : 'text-sim-textDim'}`}>
        {done ? '✓' : '○'}
      </span>
      <span className={`text-[7px] font-pixel ${done ? 'text-sim-text' : 'text-sim-textDim'}`}>
        {label}
      </span>
    </div>
  );
}
