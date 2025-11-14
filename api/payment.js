export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.json({ 
      status: 'working',
      message: 'Astra RP Payment API',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    try {
      const { amount, email, username } = req.body;
      
      // Здесь будет логика Т-Банк
      return res.json({
        success: true,
        message: 'Платеж обработан',
        orderId: `TEST_${Date.now()}`,
        paymentUrl: 'https://tbank-test.com'
      });
      
    } catch (error) {
      return res.status(500).json({ error: 'Server error' });
    }
  }
}