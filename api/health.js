export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://astra-rp.fun');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  res.json({ 
    status: 'OK', 
    service: 'Astra RP Payment API',
    timestamp: new Date().toISOString()
  });
}