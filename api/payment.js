import { createHash } from 'crypto';

const TBANK_CONFIG = {
  terminal: '1763019363416', // РАБОЧИЙ терминал
  password: '4NvQuyKHGqYGLr0h', // РАБОЧИЙ пароль
  baseUrl: 'https://securepay.tinkoff.ru/v2'
};

function generateToken(data) {
  const values = {
    TerminalKey: TBANK_CONFIG.terminal,
    Password: TBANK_CONFIG.password,
    Amount: data.Amount,
    OrderId: data.OrderId,
    Description: data.Description,
    CustomerKey: data.CustomerKey,
    SuccessURL: data.SuccessURL,
    FailURL: data.FailURL
  };
  
  // DATA добавляем только если есть и не пустой
  if (data.DATA && Object.keys(data.DATA).length > 0) {
    values.DATA = JSON.stringify(data.DATA);
  }
  
  const sortedKeys = Object.keys(values).sort();
  const concatenatedValues = sortedKeys.map(key => values[key]).join('');
  
  console.log('🔑 Данные для токена:', concatenatedValues);
  
  return createHash('sha256').update(concatenatedValues).digest('hex');
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
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
      message: 'API is working!'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, email, username } = req.body;

    if (!amount || !email || !username) {
      return res.status(400).json({
        success: false,
        error: 'Заполните все обязательные поля'
      });
    }

    if (amount < 10 || amount > 50000) {
      return res.status(400).json({
        success: false,
        error: 'Сумма должна быть от 10₽ до 50,000₽'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Введите корректный email адрес'
      });
    }

    const orderId = `ASTRA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const paymentData = {
      TerminalKey: TBANK_CONFIG.terminal,
      OrderId: orderId,
      Amount: Math.round(amount * 100),
      Description: `Пополнение игрового счета ASTRA RP для ${username}`,
      CustomerKey: email,
      SuccessURL: `https://astra-rp.fun/payment-success.html?order=${orderId}&success=true`,
      FailURL: `https://astra-rp.fun/payment-fail.html?order=${orderId}&error=true`,
      DATA: {
        Email: email,
        Username: username,
        Product: 'Game Currency'
      }
    };

    // Генерируем токен
    paymentData.Token = generateToken(paymentData);

    console.log('🔄 Инициализация платежа (РАБОЧИЙ терминал)');
    console.log('📤 Данные для Т-Банк:', JSON.stringify(paymentData, null, 2));

    const tbankResponse = await fetch(`${TBANK_CONFIG.baseUrl}/Init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const result = await tbankResponse.json();

    console.log('📥 Ответ от Т-Банк:', JSON.stringify(result, null, 2));

    if (result.Success) {
      console.log('✅ Платеж инициализирован!');
      
      return res.json({
        success: true,
        paymentId: result.PaymentId,
        paymentUrl: result.PaymentURL,
        orderId: paymentData.OrderId
      });
    } else {
      console.error('❌ Ошибка Т-Банк:', result);
      
      return res.status(400).json({
        success: false,
        error: result.Message || 'Ошибка инициализации платежа',
        details: result.Details,
        errorCode: result.ErrorCode
      });
    }

  } catch (error) {
    console.error('🔥 Серверная ошибка:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    });
  }
}