export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.json({ 
      status: 'working',
      message: '✅ Astra RP API работает!',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    try {
      const { amount, email, username } = req.body;
      
      // Тестовый ответ (пока без Т-Банк)
      return res.json({
        success: true,
        message: 'Платеж обработан',
        orderId: `ASTRA_${Date.now()}`,
        paymentUrl: 'https://example.com',
        test: true
      });
      
    } catch (error) {
      return res.status(500).json({ 
        success: false,
        error: 'Server error' 
      });
    }
  }

  return res.status(404).json({ error: 'Not found' });
}