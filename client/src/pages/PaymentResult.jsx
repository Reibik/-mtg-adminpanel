import { useEffect, useState } from 'react';
import { Link, useSearchParams, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { paymentsApi, ordersApi } from '../api/client';
import { CheckCircle, XCircle, Clock, Wifi, CreditCard, ArrowRight, RefreshCw, Zap, RotateCcw } from 'lucide-react';
import Spinner from '../components/ui/Spinner';

function PageWrapper({ children }) {
  return (
    <div className="min-h-screen bg-surface-dark flex flex-col items-center justify-center p-4">
      <Link to="/dashboard" className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
          <Zap size={18} className="text-white" />
        </div>
        <span className="text-lg font-bold gradient-text">ST VILLAGE PROXY</span>
      </Link>
      {children}
    </div>
  );
}

export default function PaymentResult() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const isTopup = searchParams.get('topup') === '1';
  const topupAmount = searchParams.get('amount');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isTopup) {
    return (
      <PageWrapper>
        <div className="card w-full max-w-md text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-success" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">Баланс пополнен!</h1>
            <p className="text-gray-400">
              {topupAmount ? `+${topupAmount} ₽ зачислено на ваш баланс` : 'Средства зачислены на ваш баланс'}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link to="/dashboard" className="btn-primary flex items-center justify-center gap-2">
              <ArrowRight size={16} /> Перейти в дашборд
            </Link>
            <Link to="/plans" className="btn-secondary flex items-center justify-center gap-2">
              <CreditCard size={16} /> Выбрать тариф
            </Link>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return <PaymentResultInner orderId={orderId} />;
}

function PaymentResultInner({ orderId }) {
  const [status, setStatus] = useState('checking');
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [checking, setChecking] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const checkPayment = async () => {
    try {
      const { data: payments } = await paymentsApi.list();
      const pay = payments.find(p => String(p.order_id) === String(orderId));
      if (!pay) { setStatus('failed'); return; }
      setPayment(pay);

      if (pay.status === 'succeeded') {
        setStatus('succeeded');
        const { data: ord } = await ordersApi.get(orderId);
        setOrder(ord);
      } else if (pay.status === 'cancelled' || pay.status === 'canceled') {
        setStatus('failed');
      } else {
        const { data: result } = await paymentsApi.check(pay.id);
        if (result.status === 'succeeded') {
          setStatus('succeeded');
          const { data: ord } = await ordersApi.get(orderId);
          setOrder(ord);
        } else if (result.status === 'cancelled') {
          setStatus('failed');
        } else {
          setStatus('pending');
        }
      }
    } catch {
      setStatus('failed');
    }
  };

  useEffect(() => {
    if (orderId) checkPayment();
    else setStatus('failed');
  }, [orderId]);

  // Auto-poll when pending
  useEffect(() => {
    if (status !== 'pending') return;
    const interval = setInterval(() => { checkPayment(); }, 5000);
    return () => clearInterval(interval);
  }, [status, orderId]);

  const handleRetryCheck = async () => {
    setChecking(true);
    await checkPayment();
    setChecking(false);
  };

  if (status === 'checking') {
    return (
      <PageWrapper>
        <div className="card text-center max-w-md w-full py-12">
          <Spinner size="lg" />
          <p className="text-lg font-semibold mt-4">Проверяем оплату...</p>
          <p className="text-sm text-gray-400 mt-1">Пожалуйста, подождите</p>
        </div>
      </PageWrapper>
    );
  }

  if (status === 'succeeded') {
    return (
      <PageWrapper>
        <div className="card text-center max-w-md w-full py-10 space-y-6">
          <div className="w-20 h-20 mx-auto bg-success/20 rounded-full flex items-center justify-center animate-pulse-glow">
            <CheckCircle size={40} className="text-success" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-success">Оплата прошла успешно!</h1>
            <p className="text-gray-400 mt-2">Ваш прокси активирован и готов к использованию</p>
          </div>

          {payment && (
            <div className="bg-surface-dark rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Сумма</span><span className="font-semibold text-success">{Number(payment.amount).toLocaleString()} ₽</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Заказ</span><span className="font-mono">#{orderId}</span></div>
              {payment.description && <div className="flex justify-between"><span className="text-gray-400">Тариф</span><span>{payment.description}</span></div>}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link to={`/proxies/${orderId}`} className="btn-primary w-full">
              <Wifi size={16} /> Перейти к прокси
            </Link>
            <Link to="/dashboard" className="btn-secondary w-full">
              Дашборд
            </Link>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (status === 'pending') {
    return (
      <PageWrapper>
        <div className="card text-center max-w-md w-full py-10 space-y-6">
          <div className="w-20 h-20 mx-auto bg-warning/20 rounded-full flex items-center justify-center">
            <Clock size={40} className="text-warning" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-warning">Ожидаем подтверждение</h1>
            <p className="text-gray-400 mt-2">Платёж обрабатывается. Обычно это занимает несколько минут.</p>
          </div>

          {payment && (
            <div className="bg-surface-dark rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Сумма</span><span className="font-semibold">{Number(payment.amount).toLocaleString()} ₽</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Заказ</span><span className="font-mono">#{orderId}</span></div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button onClick={handleRetryCheck} disabled={checking} className="btn-primary w-full">
              {checking ? <Spinner size="sm" /> : <><RefreshCw size={16} /> Проверить снова</>}
            </button>
            <Link to="/payments" className="btn-secondary w-full">
              <CreditCard size={16} /> Мои платежи
            </Link>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const handleRetryPayment = async () => {
    if (!payment) return;
    setRetrying(true);
    try {
      const { data } = await paymentsApi.retry(payment.id);
      if (data.confirmation_url) {
        window.location.href = data.confirmation_url;
      }
    } catch (err) {
      console.error('Retry error:', err);
    }
    setRetrying(false);
  };

  return (
    <PageWrapper>
      <div className="card text-center max-w-md w-full py-10 space-y-6">
        <div className="w-20 h-20 mx-auto bg-danger/20 rounded-full flex items-center justify-center">
          <XCircle size={40} className="text-danger" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-danger">Ошибка оплаты</h1>
          <p className="text-gray-400 mt-2">Платёж не был завершён или отменён. Попробуйте снова.</p>
        </div>

        <div className="flex flex-col gap-3">
          {payment && (
            <button onClick={handleRetryPayment} disabled={retrying} className="btn-primary w-full">
              {retrying ? <Spinner size="sm" /> : <><RotateCcw size={16} /> Повторить оплату</>}
            </button>
          )}
          <Link to="/plans" className="btn-secondary w-full">
            <ArrowRight size={16} /> Выбрать другой тариф
          </Link>
          <Link to="/payments" className="btn-secondary w-full">
            <CreditCard size={16} /> Мои платежи
          </Link>
          <Link to="/dashboard" className="btn-secondary w-full">
            Дашборд
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}
