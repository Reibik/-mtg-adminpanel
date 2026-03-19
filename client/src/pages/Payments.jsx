import { useEffect, useState } from 'react';
import { paymentsApi } from '../api/client';
import { CreditCard, CheckCircle, XCircle, Clock, Filter, RefreshCw, RotateCcw } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';

const statusMap = {
  succeeded: { label: 'Оплачено', cls: 'badge-success', icon: CheckCircle },
  canceled: { label: 'Отменён', cls: 'badge-danger', icon: XCircle },
  cancelled: { label: 'Отменён', cls: 'badge-danger', icon: XCircle },
  pending: { label: 'В ожидании', cls: 'badge-warning', icon: Clock },
};

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [checking, setChecking] = useState(null);
  const [retrying, setRetrying] = useState(null);
  const toast = useToast();

  const loadPayments = () => {
    paymentsApi.list().then(({ data }) => setPayments(data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPayments(); }, []);

  const handleCheck = async (paymentId) => {
    setChecking(paymentId);
    try {
      const { data } = await paymentsApi.check(paymentId);
      if (data.changed) {
        loadPayments();
        toast.success('Статус обновлён');
      } else {
        toast.info('Статус не изменился');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка проверки');
    }
    setChecking(null);
  };

  const handleRetry = async (paymentId) => {
    setRetrying(paymentId);
    try {
      const { data } = await paymentsApi.retry(paymentId);
      if (data.confirmation_url) {
        window.location.href = data.confirmation_url;
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка повтора оплаты');
    }
    setRetrying(null);
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const filtered = filter === 'all' ? payments : payments.filter(p =>
    filter === 'canceled' ? (p.status === 'canceled' || p.status === 'cancelled') : p.status === filter
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Платежи</h1>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          {['all', 'succeeded', 'pending', 'canceled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1 rounded-lg transition ${filter === f ? 'bg-primary text-white' : 'bg-surface-light text-gray-400 hover:bg-surface-lighter'}`}>
              {f === 'all' ? 'Все' : statusMap[f]?.label || f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <CreditCard size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-lg font-semibold">Нет платежей</p>
          <p className="text-gray-400 text-sm">Здесь будет история ваших платежей</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card overflow-x-auto hidden lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-700/50">
                  <th className="pb-3 pr-4">Дата</th>
                  <th className="pb-3 pr-4">Сумма</th>
                  <th className="pb-3 pr-4">Статус</th>
                  <th className="pb-3 pr-4">Метод</th>
                  <th className="pb-3 pr-4">Описание</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {filtered.map(p => {
                  const st = statusMap[p.status] || statusMap.pending;
                  const Icon = st.icon;
                  return (
                    <tr key={p.id} className="hover:bg-surface-light/50 transition">
                      <td className="py-3 pr-4 whitespace-nowrap text-gray-300">
                        {new Date(p.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 pr-4 font-semibold whitespace-nowrap">{Number(p.amount).toLocaleString()} ₽</td>
                      <td className="py-3 pr-4">
                        <span className={`${st.cls} inline-flex items-center gap-1`}>
                          <Icon size={10} /> {st.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-400">{p.method || 'YooKassa'}</td>
                      <td className="py-3 pr-4 text-gray-400 truncate max-w-[200px]">{p.description || '—'}</td>
                      <td className="py-3 text-right">
                        {p.status === 'pending' && (
                          <button onClick={() => handleCheck(p.id)} disabled={checking === p.id}
                            className="text-xs px-3 py-1 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition inline-flex items-center gap-1 disabled:opacity-50">
                            <RefreshCw size={12} className={checking === p.id ? 'animate-spin' : ''} />
                            Проверить
                          </button>
                        )}
                        {(p.status === 'canceled' || p.status === 'cancelled') && (
                          <button onClick={() => handleRetry(p.id)} disabled={retrying === p.id}
                            className="text-xs px-3 py-1 rounded-lg bg-warning/20 text-warning hover:bg-warning/30 transition inline-flex items-center gap-1 disabled:opacity-50">
                            <RotateCcw size={12} className={retrying === p.id ? 'animate-spin' : ''} />
                            Повторить
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 lg:hidden">
            {filtered.map(p => {
              const st = statusMap[p.status] || statusMap.pending;
              const Icon = st.icon;
              return (
                <div key={p.id} className="card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{Number(p.amount).toLocaleString()} ₽</span>
                    <span className={`${st.cls} inline-flex items-center gap-1`}>
                      <Icon size={10} /> {st.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Дата</span>
                      <span className="text-gray-300">{new Date(p.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    {p.description && (
                      <div className="flex justify-between">
                        <span>Тариф</span>
                        <span className="text-gray-300 truncate ml-4">{p.description}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Метод</span>
                      <span className="text-gray-300">{p.method || 'YooKassa'}</span>
                    </div>
                  </div>
                  {p.status === 'pending' && (
                    <button onClick={() => handleCheck(p.id)} disabled={checking === p.id}
                      className="text-xs px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition inline-flex items-center gap-1 disabled:opacity-50 w-full justify-center">
                      <RefreshCw size={12} className={checking === p.id ? 'animate-spin' : ''} />
                      Проверить статус
                    </button>
                  )}
                  {(p.status === 'canceled' || p.status === 'cancelled') && (
                    <button onClick={() => handleRetry(p.id)} disabled={retrying === p.id}
                      className="text-xs px-3 py-1.5 rounded-lg bg-warning/20 text-warning hover:bg-warning/30 transition inline-flex items-center gap-1 disabled:opacity-50 w-full justify-center">
                      <RotateCcw size={12} className={retrying === p.id ? 'animate-spin' : ''} />
                      Повторить оплату
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
