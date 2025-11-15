const express = require('express');
const crypto = require('crypto');
const fetch = require('node-fetch');

const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});

// Тестовые данные Tbank DEMO
const CONFIG = {
  merchantId: '1763019363347DEMO',
  secretKey: '_yu8*mk*O9Kpx^v2',
  baseUrl: 'https://eacq.tbank.com',
  frontendUrl: process.env.FRONTEND_URL || 'https://your-frontend.vercel.app',
  isTestMode: true
};

// Функция для генерации подписи по спецификации Tbank
function generateSignature(params, secretKey) {
  // Сортируем параметры по имени в алфавитном порядке
  const sortedKeys = Object.keys(params).sort();
  
  // Формируем строку для подписи
  const signString = sortedKeys
    .filter(key => params[key] !== '' && params[key] !== null && params[key] !== undefined)
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  // Добавляем секретный ключ и создаем MD5 хеш
  const fullString = signString + secretKey;
  
  return crypto
    .createHash('md5')
    .update(fullString)
    .digest('hex')
    .toUpperCase();
}

function generateOrderId() {
  return `ASTRA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Главный endpoint для создания платежа
app.post('/', async (req, res) => {
  console.log('=== PAYMENT REQUEST RECEIVED ===');
  console.log('Request body:', req.body);
  
  try {
    const { amount, email, username } = req.body;

    // Валидация
    if (!amount || !email || !username) {
      return res.status(400).json({
        success: false,
        error: 'Необходимы все поля: amount, email, username'
      });
    }

    if (amount < 10 || amount > 50000) {
      return res.status(400).json({
        success: false,
        error: 'Сумма должна быть от 10 до 50000 рублей'
      });
    }

    const orderId = generateOrderId();
    const amountInKopecks = Math.round(amount * 100);

    // Параметры для Tbank API
    const tbankParams = {
      merchant: CONFIG.merchantId,
      order_id: orderId,
      amount: amountInKopecks.toString(),
      currency: '643', // RUB
      description: `Пополнение счета ASTRA RP - ${username}`,
      language: 'ru',
      client_email: email,
      server_url: `https://astra-rp-backend.vercel.app/api/payment-callback`,
      success_url: `${CONFIG.frontendUrl}/donate?success=true&order=${orderId}`,
      fail_url: `${CONFIG.frontendUrl}/donate?error=true&order=${orderId}`,
      custom_1: username,
      custom_2: 'ASTRA_RP_DONATE',
      test_mode: '1' // Включаем тестовый режим
    };

    // Генерация подписи
    tbankParams.sign = generateSignature(tbankParams, CONFIG.secretKey);

    console.log('=== TBANK REQUEST PARAMS ===');
    console.log('Params:', { ...tbankParams, sign: '***HIDDEN***' });
    console.log('Full URL:', `${CONFIG.baseUrl}/payment/rest/register.do`);

    // Отправка запроса в Tbank
    const response = await fetch(`${CONFIG.baseUrl}/payment/rest/register.do`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tbankParams).toString()
    });

    const responseText = await response.text();
    console.log('=== TBANK RAW RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers.raw());
    console.log('Body:', responseText);

    let tbankData;
    try {
      tbankData = JSON.parse(responseText);
    } catch (e) {
      console.error('JSON parse error:', e);
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    console.log('=== TBANK PARSED RESPONSE ===');
    console.log('Data:', tbankData);

    // Анализ ответа
    if (tbankData.errorCode === '0' && tbankData.formUrl) {
      console.log('✅ Payment created successfully');
      res.json({
        success: true,
        paymentUrl: tbankData.formUrl,
        orderId: tbankData.orderId,
        tbankOrderId: tbankData.orderId,
        message: 'Платежная форма создана'
      });
    } else {
      const errorMsg = tbankData.errorMessage || `Error code: ${tbankData.errorCode}`;
      console.error('❌ Tbank error:', errorMsg);
      res.status(400).json({
        success: false,
        error: errorMsg,
        errorCode: tbankData.errorCode,
        details: tbankData
      });
    }

  } catch (error) {
    console.error('💥 Payment processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      stack: CONFIG.isTestMode ? error.stack : undefined
    });
  }
});

// Health check с информацией о конфигурации
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    service: 'ASTRA RP Payment API',
    mode: CONFIG.isTestMode ? 'TEST' : 'PRODUCTION',
    merchant: CONFIG.merchantId,
    timestamp: new Date().toISOString(),
    endpoints: {
      payment: 'POST /api/payment',
      callback: 'POST /api/payment-callback',
      health: 'GET /api/payment'
    }
  });
});

// Обработка OPTIONS для CORS
app.options('/', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

module.exports = app;