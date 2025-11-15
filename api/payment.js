// api/payment.js - УПРОЩЕННАЯ ВЕРСИЯ С ВИДЖЕТОМ
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.json({ status: 'OK', test: true });

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

    const orderId = `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('🔄 Тестовый платеж:', { orderId, amount, email, username });

    // Для демо-режима возвращаем фиктивные данные
    // В реальности здесь будет работа с API Тинькофф
    return res.json({
      success: true,
      testMode: true,
      orderId: orderId,
      message: 'ТЕСТОВЫЙ РЕЖИМ - Система готова к интеграции с реальным терминалом',
      instructions: 'Для реальных платежей нужно настроить рабочий терминал Тинькофф'
    });

  } catch (error) {
    console.error('🔥 Ошибка:', error);
    return res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    });
  }
}