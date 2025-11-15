const express = require('express');
const crypto = require('crypto');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const CONFIG = {
  secretKey: '_yu8*mk*O9Kpx^v2',
  isTestMode: true
};

app.post('/', async (req, res) => {
  console.log('=== TBANK CALLBACK RECEIVED ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Query:', req.query);

  try {
    // Tbank может отправлять данные разными способами
    const callbackData = {
      ...req.body,
      ...req.query
    };

    console.log('Callback data:', callbackData);

    // В тестовом режиме логируем, но не проверяем подпись
    if (CONFIG.isTestMode) {
      console.log('🔐 Signature check skipped in test mode');
    }

    const { 
      orderNumber, // Ваш order_id
      mdOrder,     // ID заказа в системе Tbank  
      operation,
      status
    } = callbackData;

    // Обработка статусов Tbank
    if (status === '1' || operation === 'approved') {
      console.log(`✅ Payment SUCCESS for order: ${orderNumber}`);
      
      // TODO: В реальной системе здесь:
      // 1. Обновить статус заказа в БД
      // 2. Начислить игровую валюту
      // 3. Отправить уведомление
      
    } else if (status === '0' || operation === 'deposited') {
      console.log(`❌ Payment FAILED for order: ${orderNumber}`);
    } else {
      console.log(`ℹ️ Payment status unknown:`, callbackData);
    }

    // Всегда отвечаем OK Tbank'у
    res.send('OK');

  } catch (error) {
    console.error('💥 Callback processing error:', error);
    res.status(500).send('ERROR');
  }
});

// GET для проверки (Tbank иногда шлет GET запросы)
app.get('/', (req, res) => {
  console.log('GET callback received:', req.query);
  res.send('OK');
});

module.exports = app;