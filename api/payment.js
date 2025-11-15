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
      mode: 'TEST_WIDGET',
      timestamp: new Date().toISOString(),
      message: 'API готов к работе с виджетом Тинькофф'
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

    const orderId = `ASTRA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('🔄 Подготовка данных для виджета Тинькофф:', {
      orderId,
      amount, 
      email,
      username
    });

    // Возвращаем данные для виджета Тинькофф
    return res.json({
      success: true,
      widgetConfig: {
        terminalKey: '1763019363347DEMO', // Демо-терминал
        orderId: orderId,
        amount: Math.round(amount * 100), // в копейках
        description: `Пополнение игрового счета ASTRA RP для ${username}`,
        customerKey: email,
        successURL: `https://astra-rp.fun/donate?success=true&order=${orderId}`,
        failURL: `https://astra-rp.fun/donate?error=true&order=${orderId}`,
        data: {
          Email: email,
          Username: username,
          Product: 'Game Currency'
        }
      },
      orderId: orderId,
      testMode: true,
      message: 'Готово к открытию виджета Тинькофф'
    });

  } catch (error) {
    console.error('🔥 Серверная ошибка:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    });
  }
}