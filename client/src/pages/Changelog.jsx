import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { changelogApi } from '../api/client';
import { useAuthStore } from '../store/auth';
import { Tag, ArrowLeft, Clock, CheckCircle } from 'lucide-react';
import Spinner from '../components/ui/Spinner';

export default function Changelog() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAuth = useAuthStore(s => s.isAuthenticated);

  useEffect(() => {
    changelogApi.list()
      .then(res => setEntries(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Link to={isAuth ? '/dashboard' : '/'} className="p-2 rounded-xl bg-surface-light hover:bg-surface-lighter transition">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag size={22} className="text-primary" /> История обновлений
          </h1>
          <p className="text-gray-400 text-sm">Что нового в ST VILLAGE PROXY</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">Нет записей об обновлениях</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-surface-lighter" />

          <div className="space-y-8">
            {entries.map((entry, i) => {
              const changes = Array.isArray(entry.changes) ? entry.changes : [];
              return (
                <div key={entry.id} className="relative pl-14">
                  <div className={`absolute left-3 top-1 w-5 h-5 rounded-full border-2 ${i === 0 ? 'bg-primary border-primary' : 'bg-surface border-surface-lighter'}`} />

                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary text-sm font-mono">v{entry.version}</span>
                        <span className="text-sm font-semibold text-gray-200">{entry.title}</span>
                      </div>
                      {entry.released_at && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock size={12} /> {new Date(entry.released_at).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </div>
                    <ul className="space-y-2">
                      {changes.map((change, j) => (
                        <li key={j} className="flex items-start gap-3 text-sm">
                          <CheckCircle size={14} className="shrink-0 mt-0.5 text-success" />
                          <span className="text-gray-300">{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
