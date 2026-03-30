import { useSimStore } from '@/hooks/useSimStore';

export function InfoPanel() {
  const bank = useSimStore((s) => s.bank);

  return (
    <div className="p-3">
      <div className="text-[8px] uppercase tracking-[2px] text-sim-textDim font-pixel mb-2">
        Agency
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-[8px] font-pixel">
          <span className="text-sim-textDim">Bank</span>
          <span className="text-sim-green">${bank.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
