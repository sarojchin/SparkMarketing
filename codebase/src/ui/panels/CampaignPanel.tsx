import { useSimStore } from '@/hooks/useSimStore';

export function CampaignPanel() {
  const people = useSimStore((s) => s.people);

  // Find whoever is working on content creation
  const creator = people.find((p) => p.assignedTaskKey === 'content_creation');

  return (
    <div className="p-3">
      <div className="text-[8px] uppercase tracking-[2px] text-sim-textDim font-pixel mb-2">
        Campaign
      </div>
      {creator ? (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[8px] font-pixel">
            <span className="text-sim-textDim">Status</span>
            <span className="text-sim-green">In Progress</span>
          </div>
          <div className="flex justify-between text-[8px] font-pixel">
            <span className="text-sim-textDim">By</span>
            <span className="text-sim-text">{creator.name}</span>
          </div>
          <div>
            <div className="flex justify-between text-[7px] font-pixel mb-0.5">
              <span className="text-sim-textDim">Progress</span>
              <span className="text-sim-text">{Math.round(creator.taskProgress * 100)}%</span>
            </div>
            <div className="w-full h-[6px] rounded-sm overflow-hidden" style={{ backgroundColor: '#e8e4dd' }}>
              <div
                className="h-full rounded-sm transition-all duration-300"
                style={{
                  width: `${Math.min(100, creator.taskProgress * 100)}%`,
                  backgroundColor: '#2563eb',
                }}
              />
            </div>
          </div>
          <div className="flex justify-between text-[8px] font-pixel">
            <span className="text-sim-textDim">Completed</span>
            <span className="text-sim-text">{creator.campaignsCreated}</span>
          </div>
        </div>
      ) : (
        <div className="text-[8px] font-pixel text-sim-textDim">None</div>
      )}
    </div>
  );
}
