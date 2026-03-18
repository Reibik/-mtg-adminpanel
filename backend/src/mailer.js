const nodemailer = require('nodemailer');

const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@example.com';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.warn('⚠️ SMTP not configured — emails will not be sent');
    return null;
  }
  transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: (process.env.SMTP_PORT || '587') === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

// ── Email templates ───────────────────────────────────────

function baseLayout(content) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#0f0f23;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
  .wrapper{max-width:560px;margin:0 auto;padding:40px 20px}
  .card{background:#1a1a3e;border-radius:16px;padding:32px;border:1px solid rgba(124,111,247,.2)}
  .logo{text-align:center;font-size:24px;font-weight:700;color:#7c6ff7;margin-bottom:24px}
  .btn{display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#7c6ff7,#38bdf8);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:16px}
  .footer{text-align:center;color:#64748b;font-size:12px;margin-top:24px}
  h2{color:#f1f5f9;margin:0 0 16px}
  p{line-height:1.6;margin:8px 0}
</style>
</head><body><div class="wrapper"><div class="card">
  <div class="logo">⚡ ST VILLAGE PROXY</div>
  ${content}
</div><div class="footer">ST VILLAGE PROXY &copy; ${new Date().getFullYear()}</div></div></body></html>`;
}

// ── Send functions ────────────────────────────────────────

async function sendMail(to, subject, html) {
  const t = getTransporter();
  if (!t) {
    console.log(`📧 [MOCK] To: ${to} Subject: ${subject}`);
    return;
  }
  await t.sendMail({ from: SMTP_FROM, to, subject, html });
}

async function sendVerificationEmail(email, token) {
  const url = `${SITE_URL}/verify-email?token=${token}`;
  await sendMail(email, 'Подтвердите ваш Email — ST VILLAGE PROXY', baseLayout(`
    <h2>Подтверждение Email</h2>
    <p>Спасибо за регистрацию! Для активации аккаунта подтвердите ваш email:</p>
    <p style="text-align:center;margin:24px 0"><a href="${url}" class="btn">Подтвердить Email</a></p>
    <p style="color:#94a3b8;font-size:13px">Если кнопка не работает, скопируйте ссылку:<br>${url}</p>
    <p style="color:#64748b;font-size:12px">Ссылка действительна 24 часа.</p>
  `));
}

async function sendLinkEmailVerification(email, token) {
  const url = `${SITE_URL}/verify-link-email?token=${token}`;
  await sendMail(email, 'Привязка Email — ST VILLAGE PROXY', baseLayout(`
    <h2>Привязка Email</h2>
    <p>Вы запросили привязку этого email к вашему аккаунту. Подтвердите:</p>
    <p style="text-align:center;margin:24px 0"><a href="${url}" class="btn">Привязать Email</a></p>
    <p style="color:#94a3b8;font-size:13px">Если вы не запрашивали привязку — проигнорируйте это письмо.</p>
    <p style="color:#64748b;font-size:12px">Ссылка действительна 24 часа.</p>
  `));
}

async function sendPasswordResetEmail(email, token) {
  const url = `${SITE_URL}/reset-password?token=${token}`;
  await sendMail(email, 'Сброс пароля — ST VILLAGE PROXY', baseLayout(`
    <h2>Сброс пароля</h2>
    <p>Вы запросили сброс пароля. Нажмите на кнопку ниже:</p>
    <p style="text-align:center;margin:24px 0"><a href="${url}" class="btn">Сбросить пароль</a></p>
    <p style="color:#94a3b8;font-size:13px">Если вы не запрашивали сброс — проигнорируйте это письмо.</p>
    <p style="color:#64748b;font-size:12px">Ссылка действительна 1 час.</p>
  `));
}

async function sendPaymentReceiptEmail(email, { amount, currency, description, orderId }) {
  await sendMail(email, `Чек об оплате #${orderId} — ST VILLAGE PROXY`, baseLayout(`
    <h2>Оплата подтверждена ✓</h2>
    <p>Ваш платёж успешно обработан:</p>
    <table style="width:100%;margin:16px 0;border-collapse:collapse">
      <tr><td style="padding:8px 0;color:#94a3b8">Заказ</td><td style="text-align:right">#${orderId}</td></tr>
      <tr><td style="padding:8px 0;color:#94a3b8">Сумма</td><td style="text-align:right;font-weight:600;color:#34d399">${amount} ${currency}</td></tr>
      <tr><td style="padding:8px 0;color:#94a3b8">Описание</td><td style="text-align:right">${description || 'Прокси'}</td></tr>
    </table>
    <p style="text-align:center;margin:24px 0"><a href="${SITE_URL}/dashboard" class="btn">Личный кабинет</a></p>
  `));
}

async function sendSubscriptionExpiringEmail(email, { daysLeft, orderName }) {
  await sendMail(email, 'Подписка скоро истекает — ST VILLAGE PROXY', baseLayout(`
    <h2>Подписка истекает через ${daysLeft} дн.</h2>
    <p>Ваш прокси <strong>${orderName}</strong> перестанет работать через ${daysLeft} дней.</p>
    <p>Продлите подписку, чтобы не потерять доступ:</p>
    <p style="text-align:center;margin:24px 0"><a href="${SITE_URL}/dashboard" class="btn">Продлить</a></p>
  `));
}

module.exports = {
  sendVerificationEmail,
  sendLinkEmailVerification,
  sendPasswordResetEmail,
  sendPaymentReceiptEmail,
  sendSubscriptionExpiringEmail,
};
