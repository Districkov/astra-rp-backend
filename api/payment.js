export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check endpoint
  if (req.method === 'GET') {
    return res.json({ 
      status: 'OK', 
      service: 'Astra RP Payment API',
      mode: 'DEMO_SIMULATION',
      timestamp: new Date().toISOString(),
      message: 'API готов к демо-режиму'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, email, username } = req.body;

    console.log('📨 Получен запрос на платеж:', { amount, email, username });

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

    const orderId = `DEMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('🔄 Демо-платеж создан:', { orderId, amount, email, username });

    // В ДЕМО-РЕЖИМЕ возвращаем фиктивные данные
    // В реальности здесь будет работа с API Тинькофф
    return res.json({
      success: true,
      paymentId: `demo_${orderId}`,
      paymentUrl: `https://securepay.tinkoff.ru/e2c/Testing?order=${orderId}`,
      orderId: orderId,
      testMode: true,
      message: 'ДЕМО-РЕЖИМ: Система готова к интеграции с реальным терминалом Тинькофф',
      instructions: 'Для реальных платежей нужно настроить рабочий терминал в Тинькофф Кассе'
    });

  } catch (error) {
    console.error('🔥 Серверная ошибка:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера: ' + error.message
    });
  }
}