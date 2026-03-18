import { useEffect, useState } from 'react';
import { announcementsApi } from '../../api/client';
import { Info, AlertTriangle, CheckCircle, X, Megaphone } from 'lucide-react';

const typeConfig = {
  info: { icon: Info, bg: 'bg-primary/10 border-primary/30', text: 'text-primary-light' },
  warning: { icon: AlertTriangle, bg: 'bg-warning/10 border-warning/30', text: 'text-warning' },
  success: { icon: CheckCircle, bg: 'bg-success/10 border-success/30', text: 'text-success' },
  danger: { icon: Megaphone, bg: 'bg-danger/10 border-danger/30', text: 'text-danger' },
};

export default function AnnouncementsBanner() {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dismissed_announcements') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    announcementsApi.list()
      .then(res => setAnnouncements(res.data || []))
      .catch(() => {});
  }, []);

  const dismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem('dismissed_announcements', JSON.stringify(next));
  };

  const visible = announcements.filter(a => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {visible.map(a => {
        const cfg = typeConfig[a.type] || typeConfig.info;
        const Icon = cfg.icon;
        return (
          <div key={a.id} className={`rounded-xl border px-4 py-3 flex items-start gap-3 animate-fade-in ${cfg.bg}`}>
            <Icon size={18} className={`shrink-0 mt-0.5 ${cfg.text}`} />
            <div className="flex-1 min-w-0">
              {a.title && <p className={`text-sm font-semibold ${cfg.text}`}>{a.title}</p>}
              <p className="text-sm text-gray-300">{a.message}</p>
            </div>
            <button onClick={() => dismiss(a.id)} className="shrink-0 p-1 text-gray-500 hover:text-gray-300 transition rounded-lg hover:bg-white/5">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
