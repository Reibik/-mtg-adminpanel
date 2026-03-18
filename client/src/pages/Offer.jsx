import { Link } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';

export default function Offer() {
  return (
    <div className="min-h-screen bg-surface-dark">
      <header className="sticky top-0 z-50 bg-surface-dark/80 backdrop-blur border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-gray-400 hover:text-white transition"><ArrowLeft size={20} /></Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold gradient-text">ST VILLAGE PROXY</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Публичная оферта</h1>
        <div className="prose prose-invert prose-sm space-y-6 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Общие положения</h2>
            <p>Настоящий документ является официальной публичной офертой сервиса ST VILLAGE PROXY (далее — «Сервис») и определяет условия предоставления услуг прокси-серверов для приложения Telegram.</p>
            <p>Оплата услуг Сервиса означает полное и безоговорочное принятие условий настоящей оферты.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Предмет оферты</h2>
            <p>Сервис предоставляет Пользователю доступ к MTProto прокси-серверам для использования с приложением Telegram. Параметры доступа (скорость, количество устройств, трафик) определяются выбранным тарифным планом.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Права и обязанности сторон</h2>
            <p><strong className="text-white">Сервис обязуется:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Обеспечивать работоспособность прокси-серверов 24/7</li>
              <li>Уведомлять Пользователя о плановых технических работах</li>
              <li>Обеспечивать конфиденциальность персональных данных</li>
            </ul>
            <p className="mt-3"><strong className="text-white">Пользователь обязуется:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Использовать Сервис только в законных целях</li>
              <li>Не передавать данные доступа третьим лицам сверх лимита устройств</li>
              <li>Своевременно оплачивать выбранный тарифный план</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Оплата и возврат</h2>
            <p>Оплата производится через платёжный сервис ЮКасса. Возврат средств возможен в течение 24 часов с момента оплаты при условии, что услуга не была использована.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Ограничение ответственности</h2>
            <p>Сервис не несёт ответственности за временную недоступность, вызванную обстоятельствами непреодолимой силы, техническими работами провайдеров или действиями третьих лиц.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Срок действия</h2>
            <p>Настоящая оферта действует с момента публикации на сайте и до её отзыва Сервисом. Сервис оставляет за собой право изменять условия оферты с уведомлением Пользователей.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
