export default async function handler(req, res) {
  const GAS_URL = process.env.GAS_URL;

  if (req.method === 'GET') {
    const response = await fetch(GAS_URL);
    const data = await response.json();
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
