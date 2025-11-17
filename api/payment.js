// /api/payment.js (ES modules)
import { createHash } from 'crypto';

const TBANK_CONFIG = {
  terminal: '1763019363347DEMO',
  password: '_yu8*mk*O9Kpx^v2',
  baseUrl: 'https://rest-api-test.tinkoff.ru/v2'
};

function generateToken(data) {
  const values = {
    TerminalKey: TBANK_CONFIG.terminal,
    Password: TBANK_CONFIG.password,
    ...data
  };
  
  delete values.Token;
  const sortedKeys = Object.keys(values).sort();
  const concatenatedValues = sortedKeys.map(key => values[key]).join('');
  
  return createHash('sha256').update(concatenatedValues).digest('hex');
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://astra-rp.fun');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.json({ 
      status: 'OK', 
      service: 'Astra RP Payment API',
      timestamp: new Date().toISOString(),
      environment: 'test'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, email, username } = req.body;

    console.log('📥 Получены данные:', { amount, email, username });

    // Валидация
    if (!amount || !email || !username) {
      return res.status(400).json({
        success: false,
        error: 'Заполните все обязательные поля'
      });
    }

    const orderId = `ASTRA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const paymentData = {
      TerminalKey: TBANK_CONFIG.terminal,
      OrderId: orderId,
      Amount: Math.round(amount * 100),
      Description: `Пополнение счета ASTRA RP для ${username}`,
      CustomerKey: email,
      SuccessURL: `https://astra-rp.fun/payment-success?order=${orderId}&success=true`,
      FailURL: `https://astra-rp.fun/payment-fail?order=${orderId}&error=true`,
      DATA: JSON.stringify({ 
        Email: email, 
        Username: username,
        Product: 'Game Currency'
      })
    };

    paymentData.Token = generateToken(paymentData);

    console.log('🔄 Отправка в Т-Банк:', paymentData.OrderId);

    const tbankResponse = await fetch(`${TBANK_CONFIG.baseUrl}/Init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });

    const result = await tbankResponse.json();

    console.log('📥 Ответ Т-Банк:', result);

    if (result.Success) {
      return res.json({
        success: true,
        paymentId: result.PaymentId,
        paymentUrl: result.PaymentURL,
        orderId: orderId,
        environment: 'test'
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.Message || 'Ошибка платежа',
        details: result.Details
      });
    }

  } catch (error) {
    console.error('🔥 Ошибка:', error);
    return res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    });
  }
}