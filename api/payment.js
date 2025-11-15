import { createHash } from 'crypto';

const TBANK_CONFIG = {
  terminal: '1763019363347DEMO', // ТЕСТОВЫЙ терминал
  password: '_yu8*mk*09Kpx^v2', // ТЕСТОВЫЙ пароль
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
    FailURL: data.FailURL,
    DATA: JSON.stringify(data.DATA)
  };
  
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

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check endpoint
  if (req.method === 'GET') {
    return res.json({ 
      status: 'OK', 
      service: 'Astra RP Payment API',
      terminal: 'TEST',
      timestamp: new Date().toISOString(),
      message: 'API готов к тестовым платежам'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, email, username } = req.body;

    // Валидация
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

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Введите корректный email адрес'
      });
    }

    const orderId = `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const paymentData = {
      TerminalKey: TBANK_CONFIG.terminal,
      OrderId: orderId,
      Amount: Math.round(amount * 100), // в копейках
      Description: `ТЕСТ: Пополнение игрового счета ASTRA RP для ${username}`,
      CustomerKey: email,
      SuccessURL: `https://astra-rp.fun/donate?success=true&order=${orderId}`,
      FailURL: `https://astra-rp.fun/donate?error=true&order=${orderId}`,
      DATA: {
        Email: email,
        Username: username,
        Product: 'Game Currency',
        Test: true
      }
    };

    // Генерируем токен
    paymentData.Token = generateToken(paymentData);

    console.log('🔄 ТЕСТОВАЯ Инициализация платежа:', {
      orderId: paymentData.OrderId,
      amount: paymentData.Amount,
      email: paymentData.CustomerKey,
      username: username
    });

    console.log('📤 Данные для Т-Банк (ТЕСТ):', JSON.stringify(paymentData, null, 2));

    // Отправляем запрос в Т-Банк
    const tbankResponse = await fetch(`${TBANK_CONFIG.baseUrl}/Init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const result = await tbankResponse.json();

    console.log('📥 Ответ от Т-Банк (ТЕСТ):', JSON.stringify(result, null, 2));

    if (result.Success) {
      console.log('✅ ТЕСТОВЫЙ Платеж инициализирован:', {
        paymentId: result.PaymentId,
        paymentUrl: result.PaymentURL,
        orderId: paymentData.OrderId
      });
      
      return res.json({
        success: true,
        paymentId: result.PaymentId,
        paymentUrl: result.PaymentURL,
        orderId: paymentData.OrderId,
        testMode: true,
        message: 'ТЕСТОВЫЙ РЕЖИМ - используйте тестовые карты'
      });
    } else {
      console.error('❌ Ошибка Т-Банк (ТЕСТ):', {
        error: result.ErrorCode,
        message: result.Message,
        details: result.Details
      });
      
      return res.status(400).json({
        success: false,
        error: result.Message || 'Ошибка инициализации тестового платежа',
        details: result.Details,
        errorCode: result.ErrorCode,
        testMode: true
      });
    }

  } catch (error) {
    console.error('🔥 Серверная ошибка (ТЕСТ):', {
      message: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера в тестовом режиме',
      testMode: true
    });
  }
}