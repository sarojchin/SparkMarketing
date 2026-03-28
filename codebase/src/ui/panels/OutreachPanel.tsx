import { useSimStore } from '@/hooks/useSimStore';

export function OutreachPanel() {
  const totalCallsMade = useSimStore((s) => s.totalCallsMade);
  const totalEmailsSent = useSimStore((s) => s.totalEmailsSent);

  return (
    <div className="p-3">
      <div className="text-[8px] uppercase tracking-[2px] text-sim-textDim font-pixel mb-2">
        Outreach
      </div>
      <div className="space-y-1">
        {[
          ['📞 Calls', String(totalCallsMade)],
          ['📧 Emails', String(totalEmailsSent)],
          ['Total', String(totalCallsMade + totalEmailsSent)],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-[8px] font-pixel">
            <span className="text-sim-textDim">{label}</span>
            <span className="text-sim-text">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
