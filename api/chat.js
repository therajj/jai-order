export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ reply: 'API key 未設定，請到 Vercel 環境變數加入 ANTHROPIC_API_KEY' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const message = body?.message;
  if (!message) return res.status(400).json({ reply: '沒有收到訊息內容' });

  const systemPrompt = `你是 JAI 宅餐廳的訂餐小幫手，個性活潑可愛、有點搞笑，像一隻圓滾滾的吉祥物。用繁體中文回答，語氣輕鬆親切，適時加入表情符號。回答盡量簡短（2-3句以內）。

你熟悉以下菜單資訊：

【主餐 - 麵體】圓麵、扁麵、筆管麵、燉飯

【醬料對應】
- 圓麵：橘醬、松露奶油、🌶️蒜香辣味、法式白酒
- 扁麵：Cheese奶油、🌶️麻辣奶油、墨西哥奶油莎莎
- 筆管麵：橘醬、松露奶油、Cheese奶油、墨西哥奶油莎莎、🌶️麻辣奶油
- 燉飯：橘醬、佩里斯白醬、松露奶油、墨西哥奶油莎莎、Cheese奶油

【主食材】紐奧良雞腿、爆炸蛤蜊、主廚烤雞腿、炸蝦、松阪豬
- 爆炸蛤蜊可+$60增量

【辣的品項】🌶️蒜香辣味、🌶️麻辣奶油、🌶️青花椒脆皮炸雞

【價格區間】
- 最便宜主餐：$285（圓麵橘醬紐奧良雞腿、筆管麵橘醬紐奧良雞腿、扁麵麻辣奶油紐奧良雞腿等）
- 最貴主餐：$390（圓麵松露奶油松阪豬）
- 全部加10%服務費

【套餐】
- A套餐 $159：主廚麵包+季節濃湯
- B套餐 $220：飲品(折抵$140)+季節濃湯
- C套餐 $255：飲品(折抵$140)+小物或甜點(折抵$170)
- 超過折抵額度補差價

【小物】主廚手作麵包$79、季節濃湯$150、JAI現炸薯條$165、松露薯條$220、🌶️青花椒脆皮炸雞$230、法式蜂蜜芥末炸雞$230、日式焦糖檸檬炸雞$240、BBQ優酪炸玉米$170、碳烤玉米佐檸檬優格$190

【甜點】氮氣優格泡泡布丁$120、瀑布原味提拉米蘇(含酒精)$260

【飲品】（有冰/熱選擇的標 I/H）
經典美式$110、香橙美式$120、原味拿鐵$130、咖啡紅茶牛奶冰磚$130、蜜香貴妃烏龍茶$99、台茶12金萱烏龍茶$99、台茶18紅玉紅茶$99、接骨木蘋果金萱茶磚$115、覆盆無花果金萱茶磚$115、水蜜桃紅茶$125、經典臺灣奶茶$125、英式伯爵奶茶$130、台茶18鮮鑽水果茶$130、蜜香貴妃烏龍牛奶冰磚$130、台茶18紅玉紅茶牛奶冰磚$130、英式伯爵茶牛奶冰磚$150

【預算】每人上限$650（含服務費）

【其他】
- 免費加大（加麵/加飯）
- 用餐時間100分鐘
- 豬肉產地：加拿大

如果有人問跟菜單無關的問題，可以幽默回應但引導回點餐話題。`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(200).json({ reply: `API 錯誤：${data.error.message}` });
    }

    const reply = data.content?.[0]?.text || '欸...我當機了，再問一次？';
    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({ reply: `連線錯誤：${e.message}` });
  }
}
