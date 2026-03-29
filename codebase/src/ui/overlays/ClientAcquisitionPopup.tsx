import { useSimStore } from '@/hooks/useSimStore';

export function ClientAcquisitionPopup() {
  const { acquiredClient, dismissClientAcquired } = useSimStore((s) => ({
    acquiredClient: s.acquiredClient,
    dismissClientAcquired: s.dismissClientAcquired,
  }));

  if (!acquiredClient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="bg-sim-surface border-2 border-sim-green p-6 w-[320px]"
        style={{ boxShadow: '0 0 32px rgba(22,163,74,0.25)' }}
      >
        <div className="text-[8px] font-pixel text-sim-green uppercase tracking-[3px] mb-4">
          Client Acquired!
        </div>

        <div className="text-[14px] font-pixel text-sim-text mb-1">
          {acquiredClient.name}
        </div>

        <div className="space-y-1 mt-3 mb-5">
          {([
            ['Industry', acquiredClient.industry],
            ['Size', `${acquiredClient.size} employees`],
            ['Project', acquiredClient.project],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} className="flex gap-2 text-[8px] font-pixel">
              <span className="text-sim-textDim w-14 flex-shrink-0">{label}</span>
              <span className="text-sim-text">{value}</span>
            </div>
          ))}
        </div>

        <button
          onClick={dismissClientAcquired}
          className="w-full py-1.5 text-[8px] font-pixel border border-sim-green text-sim-green hover:bg-sim-green hover:text-black transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
}
