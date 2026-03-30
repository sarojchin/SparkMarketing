import { useSimStore } from '@/hooks/useSimStore';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SPEEDS = [1, 3, 8] as const;

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(9 + h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function HUD() {
  const { simMinutes, simDay, speed, setSpeed, activeClientCount, clients, selectedClientEntity, setSelectedClientEntity } = useSimStore((s) => ({
    simMinutes: s.simMinutes,
    simDay: s.simDay,
    speed: s.speed,
    setSpeed: s.setSpeed,
    activeClientCount: s.activeClientCount,
    clients: s.clients,
    selectedClientEntity: s.selectedClientEntity,
    setSelectedClientEntity: s.setSelectedClientEntity,
  }));

  const day = DAYS[simDay % 5] || 'Monday';

  return (
    <>
      {/* Top left — title + clients */}
      <div className="fixed top-3 left-3.5 z-10">
        <div className="pointer-events-none">
          <div className="text-[10px] font-pixel text-sim-green tracking-[2px]"
            style={{ textShadow: '0 1px 2px rgba(22,163,74,0.2)' }}>
            SPARK AGENCY
          </div>
          <div className="text-[7px] font-pixel text-sim-textDim tracking-[1px] mt-0.5">
            Marketing &amp; Creative · Est. 2024
          </div>
        </div>

        {/* Clients section — clickable */}
        <div className="mt-1.5">
          <div className="text-[7px] font-pixel text-sim-textDim tracking-[1px] pointer-events-none mb-0.5">
            CLIENTS ({activeClientCount})
          </div>
          {clients.length === 0 ? (
            <div className="text-[7px] font-pixel text-sim-textDim italic pointer-events-none">
              None
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {clients.map((client) => {
                const isSelected = selectedClientEntity === client.entity;
                return (
                  <button
                    key={client.entity}
                    onClick={() => setSelectedClientEntity(isSelected ? null : client.entity)}
                    className={`text-left text-[7px] font-pixel px-1.5 py-0.5 rounded transition-colors
                      ${isSelected
                        ? 'text-sim-green border border-sim-green bg-green-50/10'
                        : 'text-sim-text border border-sim-border hover:border-sim-textDim hover:text-sim-green'
                      }`}
                  >
                    {client.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top right — clock + speed */}
      <div className="fixed top-3 right-3.5 z-10 text-right">
        <div className="text-[13px] font-pixel text-sim-text"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
          {formatTime(simMinutes)} · {day}
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
