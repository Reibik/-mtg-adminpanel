import { useState, useEffect } from 'react';
import { changelogApi } from '../../api/client';
import { useAuthStore } from '../../store/auth';
import { X, Sparkles } from 'lucide-react';

export default function ChangelogModal() {
  const [entries, setEntries] = useState([]);
  const [open, setOpen] = useState(false);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    changelogApi.unseen().then(({ data }) => {
      if (data.length > 0) {
        setEntries(data);
        setOpen(true);
      }
    }).catch(() => {});
  }, [isAuthenticated]);

  const handleClose = () => {
    entries.forEach(e => {
      changelogApi.markSeen(e.version).catch(() => {});
    });
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-surface border border-white/10 rounded-2xl shadow-2xl max-w-md w-full animate-slide-up" onClick={e => e.stopPropagation()}>
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-primary to-accent rounded-t-2xl px-6 py-5 text-center">
          <Sparkles className="mx-auto mb-2" size={28} />
          <h2 className="text-xl font-bold text-white">Что нового?</h2>
        </div>

        <div className="px-6 py-5 max-h-[50vh] overflow-y-auto space-y-6">
          {entries.map(entry => (
            <div key={entry.version}>
              <div className="flex items-center gap-2 mb-3">
                <span className="badge-info text-sm font-mono">v{entry.version}</span>
                <span className="text-sm font-semibold text-gray-200">{entry.title}</span>
              </div>
              <ul className="space-y-1.5">
                {(entry.changes || []).map((change, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-primary mt-1">•</span>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-white/5">
          <button onClick={handleClose} className="btn-primary w-full">
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
}
