import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { proxiesApi, ordersApi } from '../api/client';
import { Wifi, WifiOff, Globe, Clock, Users, ArrowRight } from 'lucide-react';
import Spinner from '../components/ui/Spinner';

export default function Proxies() {
  const [proxies, setProxies] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      proxiesApi.list().catch(() => ({ data: [] })),
      ordersApi.list().catch(() => ({ data: [] })),
    ]).then(([p, o]) => {
      setProxies(p.data || []);
      setOrders(o.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  // merge orders with proxy data (preserve order id/status)
  const combined = orders.map(o => {
    const p = proxies.find(px => px.order_id === o.id);
    if (!p) return o;
    return {
      ...o,
      node_host: p.node_host || o.node_host,
      node_name: p.node_name || o.node_name,
      node_flag: p.node_flag || o.node_flag,
      port: p.port,
      secret: p.secret,
      proxy_status: p.proxy_status,
      link: p.link,
      max_devices: p.max_devices || o.max_devices,
      traffic_rx_snap: p.traffic_rx_snap,
      traffic_tx_snap: p.traffic_tx_snap,
    };
  });

  const active = combined.filter(o => o.status === 'active');
  const other = combined.filter(o => o.status !== 'active');

  const ProxyCard = ({ item }) => {
    const isActive = item.status === 'active';
    const expires = item.expires_at ? new Date(item.expires_at) : null;
    const daysLeft = expires ? Math.ceil((expires - Date.now()) / 86400000) : 0;

    return (
      <Link to={`/proxies/${item.id}`}
        className="card-hover group block">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{item.node_flag || <Globe size={18} />}</span>
            <span className="font-semibold">{item.plan_name || `Заказ #${item.id}`}</span>
          </div>
          {isActive
            ? <span className="badge-success flex items-center gap-1"><Wifi size={10} /> Активен</span>
            : <span className="badge-danger flex items-center gap-1"><WifiOff size={10} /> {item.status === 'expired' ? 'Истёк' : item.status}</span>
          }
        </div>

        {isActive && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Users size={14} />
              <span>{item.max_devices || 0} устр. макс.</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Clock size={14} />
              <span className={daysLeft <= 3 ? 'text-warning' : ''}>
                {daysLeft > 0 ? `${daysLeft} дн.` : 'Истекает'}
              </span>
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-end text-xs text-primary opacity-0 group-hover:opacity-100 transition">
          Подробнее <ArrowRight size={12} className="ml-1" />
        </div>
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Мои прокси</h1>
        <Link to="/plans" className="btn-primary text-sm">Купить ещё</Link>
      </div>

      {combined.length === 0 && (
        <div className="card text-center py-12">
          <Wifi size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-lg font-semibold mb-2">Нет активных прокси</p>
          <p className="text-gray-400 text-sm mb-6">Приобретите тариф для начала работы</p>
          <Link to="/plans" className="btn-primary">Выбрать тариф</Link>
        </div>
      )}

      {active.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Активные</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map(item => <ProxyCard key={item.id} item={item} />)}
          </div>
        </div>
      )}

      {other.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Прошлые</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {other.map(item => <ProxyCard key={item.id} item={item} />)}
          </div>
        </div>
      )}
    </div>
  );
}
