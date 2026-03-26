import { useSimStore } from '@/hooks/useSimStore';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(9 + h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function InfoPanel() {
  const { people, simMinutes, simDay, speed, campaignsShipped, grossIncome, bank } = useSimStore((s) => ({
    people: s.people,
    simMinutes: s.simMinutes,
    simDay: s.simDay,
    speed: s.speed,
    campaignsShipped: s.campaignsShipped,
    grossIncome: s.grossIncome,
    bank: s.bank,
  }));

  const working = people.filter((p) => p.state === 'working').length;
  const day = DAYS[simDay % 5] || 'Monday';
  const currentPhase = people[0]?.phase || '—';

  return (
    <div className="p-3">
      <div className="text-[8px] uppercase tracking-[2px] text-sim-textDim font-pixel mb-2">
        Agency
      </div>
      <div className="space-y-1">
        {[
          ['Phase', currentPhase],
          ['Step', people[0] ? `${people[0].currentStep + 1}/${people[0].totalSteps}` : '—'],
          ['Day', day],
          ['Time', formatTime(simMinutes)],
          ['Speed', `${speed}x`],
          ['Campaigns', String(campaignsShipped)],
          ['Bank', `$${bank.toLocaleString()}`],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-[8px] font-pixel">
            <span className="text-sim-textDim">{label}</span>
            <span className={label === 'Bank' ? 'text-sim-green' : 'text-sim-text'}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
