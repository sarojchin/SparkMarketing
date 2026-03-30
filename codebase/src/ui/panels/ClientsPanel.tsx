import { useSimStore } from '@/hooks/useSimStore';

function reputationColor(score: number): string {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#65a30d';
  if (score >= 40) return '#ca8a04';
  if (score >= 20) return '#ea580c';
  return '#dc2626';
}

function reputationLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Critical';
}

export function ClientsPanel() {
  const selectedClientEntity = useSimStore((s) => s.selectedClientEntity);
  const clients = useSimStore((s) => s.clients);
  const setSelectedClientEntity = useSimStore((s) => s.setSelectedClientEntity);

  if (selectedClientEntity === null) return null;

  const client = clients.find((c) => c.entity === selectedClientEntity);
  if (!client) return null;

  const repColor = reputationColor(client.reputation);
  const repLabel = reputationLabel(client.reputation);

  return (
    <div className="fixed left-0 z-20 w-[180px] bg-sim-surface border border-l-0 border-sim-border rounded-r shadow-sm"
      style={{ top: '110px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-sim-border">
        <div>
          <div className="text-[8px] font-pixel text-sim-text uppercase tracking-[1px]">
            {client.name}
          </div>
          <div className="text-[6px] font-pixel text-sim-textDim mt-0.5">
            {client.industry}
          </div>
        </div>
        <button
          onClick={() => setSelectedClientEntity(null)}
          className="text-[9px] font-pixel text-sim-textDim hover:text-sim-text transition-colors"
        >
          ×
        </button>
      </div>

      {/* Details */}
      <div className="px-2.5 py-2 space-y-2">
        <div className="text-[6px] font-pixel text-sim-textDim uppercase tracking-[1.5px]">
          Details
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[7px] font-pixel text-sim-text">Industry</span>
          <span className="text-[7px] font-pixel text-sim-textDim">{client.industry}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[7px] font-pixel text-sim-text">Size</span>
          <span className="text-[7px] font-pixel text-sim-text">{client.size} employees</span>
        </div>
      </div>

      {/* Reputation */}
      <div className="px-2.5 py-2 border-t border-sim-border">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[6px] font-pixel text-sim-textDim uppercase tracking-[1.5px]">
            Reputation
          </span>
          <span className="text-[6px] font-pixel" style={{ color: repColor }}>
            {repLabel}
          </span>
        </div>
        <div className="w-full h-[6px] rounded-sm overflow-hidden" style={{ backgroundColor: '#e8e4dd' }}>
          <div
            className="h-full rounded-sm transition-all duration-300"
            style={{
              width: `${Math.min(100, client.reputation)}%`,
              backgroundColor: repColor,
            }}
          />
        </div>
        <div className="text-[7px] font-pixel text-sim-text text-right mt-0.5">
          {client.reputation}/100
        </div>
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
          <InfoRow label="Budget" value="$12,000" color="#16a34a" />
          <InfoRow label="Deadline" value="14 days" />
          <InfoRow label="Status" value="In Progress" color="#ca8a04" />
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
      <span className="text-[7px] font-pixel" style={color ? { color } : undefined}>
        {value}
      </span>
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
