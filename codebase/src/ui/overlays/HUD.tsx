import { useSimStore } from '@/hooks/useSimStore';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SPEEDS = [1, 3, 8] as const;

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(9 + h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function HUD() {
  const { simMinutes, simDay, speed, setSpeed, grossIncome, bank, totalCallsMade, totalEmailsSent } = useSimStore((s) => ({
    simMinutes: s.simMinutes,
    simDay: s.simDay,
    speed: s.speed,
    setSpeed: s.setSpeed,
    grossIncome: s.grossIncome,
    bank: s.bank,
    totalCallsMade: s.totalCallsMade,
    totalEmailsSent: s.totalEmailsSent,
  }));

  const day = DAYS[simDay % 5] || 'Monday';

  return (
    <>
      {/* Top left — title */}
      <div className="fixed top-3 left-3.5 z-10 pointer-events-none">
        <div className="text-[10px] font-pixel text-sim-green tracking-[2px]"
          style={{ textShadow: '0 1px 2px rgba(22,163,74,0.2)' }}>
          SPARK AGENCY
        </div>
        <div className="text-[7px] font-pixel text-sim-textDim tracking-[1px] mt-0.5">
          Marketing &amp; Creative · Est. 2024
        </div>
      </div>

      {/* Top right — finances + clock + speed */}
      <div className="fixed top-3 right-3.5 z-10 text-right">
        <div className="text-[9px] font-pixel text-sim-green tracking-[1px]">
          ${bank.toLocaleString()}
        </div>
        <div className="text-[7px] font-pixel text-sim-textDim mt-0.5">
          Gross: ${grossIncome.toLocaleString()} · 📞 {totalCallsMade} · 📧 {totalEmailsSent} · {formatTime(simMinutes)} · {day}
        </div>
        <div className="flex gap-0.5 mt-1.5 justify-end">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-1.5 py-0.5 text-[7px] font-pixel border transition-colors
                ${speed === s
                  ? 'text-sim-green border-sim-green'
                  : 'text-sim-textDim border-sim-border hover:border-sim-textDim'
                }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
