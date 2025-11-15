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
      mode: 'TINKOFF_TEST_WIDGET',
      timestamp: new Date().toISOString(),
      message: 'API ready for Tinkoff test widget'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, email, username } = req.body;

    console.log('Received payment request:', { amount, email, username });

    // Validation
    if (!amount || !email || !username) {
      return res.status(400).json({
        success: false,
        error: 'Fill all required fields'
      });
    }

    if (amount < 10 || amount > 50000) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be from 10₽ to 50,000₽'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Enter valid email address'
      });
    }

    const orderId = 'TEST_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    console.log('Creating test payment:', { orderId, amount, email, username });

    // For TEST mode use direct widget integration
    const paymentData = {
      TerminalKey: '1763019363347DEMO',
      OrderId: orderId,
      Amount: Math.round(amount * 100),
      Description: 'Test payment ASTRA RP for ' + username,
      CustomerKey: email,
      SuccessURL: (req.headers.origin || 'https://astra-rp.fun') + '/donate?success=true&order=' + orderId,
      FailURL: (req.headers.origin || 'https://astra-rp.fun') + '/donate?error=true&order=' + orderId,
      DATA: JSON.stringify({
        Email: email,
        Username: username,
        Product: 'Game Currency',
        Test: true
      })
    };

    // In test mode return data for widget
    return res.json({
      success: true,
      paymentData: paymentData,
      orderId: orderId,
      testMode: true,
      message: 'Test payment created. Use Tinkoff widget for payment.',
      instructions: 'Test cards: 4111 1111 1111 1111 (success), 2200 0000 0000 0001 (error)'
    });

  } catch (error) {
    console.error('Server error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
}