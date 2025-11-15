import { createHash } from 'crypto';

// Конфигурация для Т-Банка (демо-режим)
const TBANK_CONFIG = {
  terminal: '1763019363347DEMO',
  secretKey: '_yu8*mk*09Kpx^v2',
  baseUrl: 'https://securepay.tinkoff.ru/v2'
};

// Генерация токена по спецификации Т-Банка
function generateToken(data) {
  // Создаем объект для токена (все поля кроме Token)
  const tokenData = { ...data };
  delete tokenData.Token;
  
  // Добавляем пароль
  tokenData.Password = TBANK_CONFIG.secretKey;
  
  // Сортируем ключи в алфавитном порядке
  const sortedKeys = Object.keys(tokenData).sort();
  
  // Конкатенируем значения
  let concatenatedString = '';
  sortedKeys.forEach(key => {
    const value = tokenData[key];
    // Для объекта DATA конвертируем в строку
    if (key === 'DATA' && typeof value === 'object') {
      concatenatedString += JSON.stringify(value);
    } else {
      concatenatedString += value;
    }
  });
  
  console.log('String for token:', concatenatedString);
  
  // Создаем SHA-256 хеш
  return createHash('sha256').update(concatenatedString).digest('hex');
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
      service: 'T-Bank Payment API',
      terminal: TBANK_CONFIG.terminal,
      mode: 'DEMO'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, email, username } = req.body;

    console.log('🔄 Создание платежа:', { amount, email, username });

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

    const orderId = `ASTRA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Данные для платежа с ПРАВИЛЬНЫМ форматом DATA
    const paymentData = {
      TerminalKey: TBANK_CONFIG.terminal,
      Amount: Math.round(amount * 100), // в копейках
      OrderId: orderId,
      Description: `Пополнение счета ASTRA RP - ${username}`,
      CustomerKey: email,
      // СТАНДАРТНЫЕ СТРАНИЦЫ ТИНЬКОФФ
      SuccessURL: 'https://securepay.tinkoff.ru/html/payForm/success.html',
      FailURL: 'https://securepay.tinkoff.ru/html/payForm/fail.html',
      PayType: 'O', // O - одностадийная оплата
      Language: 'ru',
      // DATA как ОБЪЕКТ, а не строка
      DATA: {
        Email: email,
        Username: username,
        Product: 'Game Currency',
        OrderId: orderId
      }
    };

    // Генерируем токен
    paymentData.Token = generateToken(paymentData);

    console.log('📤 Отправка в Т-Банк:', JSON.stringify(paymentData, null, 2));

    // Отправляем запрос в Т-Банк
    const response = await fetch(`${TBANK_CONFIG.baseUrl}/Init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    console.log('📥 Ответ Т-Банка:', JSON.stringify(result, null, 2));

    // Обработка ответа
    if (result.Success) {
      console.log('✅ Платеж создан:', {
        paymentId: result.PaymentId,
        paymentUrl: result.PaymentURL
      });
      
      return res.json({
        success: true,
        paymentId: result.PaymentId,
        paymentUrl: result.PaymentURL,
        orderId: orderId,
        status: 'CREATED'
      });
      
    } else {
      console.error('❌ Ошибка Т-Банка:', {
        errorCode: result.ErrorCode,
        message: result.Message,
        details: result.Details
      });
      
      return res.status(400).json({
        success: false,
        error: result.Message || 'Ошибка создания платежа',
        errorCode: result.ErrorCode,
        details: result.Details
      });
    }

  } catch (error) {
    console.error('🔥 Ошибка сервера:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера',
      message: error.message
    });
  }
}