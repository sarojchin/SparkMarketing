import { useState } from 'react';
import type { LogEntry } from '@/engine/types';

interface LogPopupProps {
  entries: LogEntry[];
  isOpen: boolean;
  onClose: () => void;
}

export function LogPopup({ entries, isOpen, onClose }: LogPopupProps) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = entries.filter(
    (entry) =>
      entry.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type: LogEntry['type']): string => {
    const colors: Record<LogEntry['type'], string> = {
      action: 'text-sim-blue',
      event: 'text-sim-textDim',
      chat: 'text-sim-yellow',
      system: 'text-sim-text',
      decision: 'text-sim-purple',
      success: 'text-sim-green',
      warning: 'text-sim-yellow',
      error: 'text-sim-pink',
      info: 'text-sim-text',
    };
    return colors[type] || 'text-sim-text';
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-sim-surface border-2 border-sim-border max-w-2xl w-[90%] max-h-[80vh] flex flex-col rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-sim-bg border-b border-sim-border p-4 flex justify-between items-center">
          <h2 className="text-sim-green font-pixel text-sm">ACTIVITY LOG</h2>
          <button
            onClick={onClose}
            className="text-sim-textDim hover:text-sim-green font-pixel text-sm"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="bg-sim-surface border-b border-sim-border p-3">
          <input
            type="text"
            placeholder="Search log..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-sim-bg border border-sim-border text-sim-text text-[8px] font-pixel px-2 py-1 placeholder-sim-textDim focus:outline-none focus:border-sim-green"
          />
        </div>

        {/* Log entries */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {filtered.length === 0 ? (
            <div className="text-sim-textDim text-[8px] font-pixel">
              No entries found
            </div>
          ) : (
            filtered.map((entry) => (
              <div
                key={entry.id}
                className={`text-[8px] font-pixel ${getTypeColor(entry.type)}`}
              >
                <span className="text-sim-textDim">[{entry.time}]</span>{' '}
                <span className="text-sim-textDim">({entry.type})</span> {entry.message}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-sim-bg border-t border-sim-border p-3 text-[7px] text-sim-textDim font-pixel">
          Showing {filtered.length} of {entries.length} entries
        </div>
      </div>
    </div>
  );
}
