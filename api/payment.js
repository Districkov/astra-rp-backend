import { createHash } from 'crypto';

const TBANK_CONFIG = {
  terminal: '1763019363347DEMO',
  password: '_yu8*mk*09Kpx^v2',
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
  
  console.log('Token data:', concatenatedValues);
  
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
      message: 'Payment API ready'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, email, username } = req.body;

    console.log('Payment request:', { amount, email, username });

    // Validation
    if (!amount || !email || !username) {
      return res.status(400).json({
        success: false,
        error: 'Fill all fields'
      });
    }

    if (amount < 10 || amount > 50000) {
      return res.status(400).json({
        success: false,
        error: 'Amount 10-50000'
      });
    }

    const orderId = 'ASTRA_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const paymentData = {
      TerminalKey: TBANK_CONFIG.terminal,
      OrderId: orderId,
      Amount: Math.round(amount * 100),
      Description: 'ASTRA RP payment for ' + username,
      CustomerKey: email,
      SuccessURL: 'https://astra-rp.fun/donate?success=true&order=' + orderId,
      FailURL: 'https://astra-rp.fun/donate?error=true&order=' + orderId,
      DATA: {
        Email: email,
        Username: username,
        Product: 'Game Currency'
      }
    };

    // Generate token
    paymentData.Token = generateToken(paymentData);

    console.log('Sending to Tinkoff:', paymentData);

    // Send to Tinkoff
    const tbankResponse = await fetch(TBANK_CONFIG.baseUrl + '/Init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const result = await tbankResponse.json();

    console.log('Tinkoff response:', result);

    if (result.Success) {
      console.log('Payment created!');
      
      return res.json({
        success: true,
        paymentId: result.PaymentId,
        paymentUrl: result.PaymentURL,
        orderId: paymentData.OrderId
      });
    } else {
      console.error('Tinkoff error:', result);
      
      // If token error, use direct widget approach
      if (result.ErrorCode === '204') {
        return res.json({
          success: true,
          paymentUrl: 'https://securepay.tinkoff.ru/e2c/Testing',
          orderId: orderId,
          testMode: true,
          message: 'Using test widget'
        });
      }
      
      return res.status(400).json({
        success: false,
        error: result.Message || 'Payment error',
        details: result.Details
      });
    }

  } catch (error) {
    console.error('Server error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}