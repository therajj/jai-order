export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const API_URL = process.env.AI_ENDPOINT_URL;
  const API_KEY = process.env.AI_ENDPOINT_KEY || process.env.ANTHROPIC_API_KEY;
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const GOOGLE_CX = process.env.GOOGLE_CX;

  if (!API_URL || !API_KEY) return res.status(500).json({ reply: 'AI Endpoint 未設定' });

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

【飲品】
經典美式$110、香橙美式$120、原味拿鐵$130、咖啡紅茶牛奶冰磚$130、蜜香貴妃烏龍茶$99、台茶12金萱烏龍茶$99、台茶18紅玉紅茶$99、接骨木蘋果金萱茶磚$115、覆盆無花果金萱茶磚$115、水蜜桃紅茶$125、經典臺灣奶茶$125、英式伯爵奶茶$130、台茶18鮮鑽水果茶$130、蜜香貴妃烏龍牛奶冰磚$130、台茶18紅玉紅茶牛奶冰磚$130、英式伯爵茶牛奶冰磚$150

【預算】每人上限$650（含服務費）

【其他】
- 免費加大（加麵/加飯）
- 用餐時間100分鐘
- 豬肉產地：加拿大

【重要規則 - 必須遵守】
1. 當使用者提到「看」「圖片」「長怎樣」「長什麼樣」「照片」等想看餐點外觀的詞彙時，你必須在回覆最末尾加上 [IMG:JAI宅 菜名] 標記。例如：
   - 使用者：「薯條長怎樣」→ 回覆結尾加 [IMG:JAI宅 薯條]
   - 使用者：「我想看松露薯條圖片」→ 回覆結尾加 [IMG:JAI宅 松露薯條]
   - 使用者：「提拉米蘇長什麼樣」→ 回覆結尾加 [IMG:JAI宅 提拉米蘇]
2. [IMG:] 標記必須放在回覆的最後一行，獨立一行
3. 如果有人問跟菜單無關的問題，可以幽默回應但引導回點餐話題`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 300,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(200).json({ reply: `API 錯誤：${data.error.message || JSON.stringify(data.error)}` });
    }

    let reply = data.choices?.[0]?.message?.content || '欸...我當機了，再問一次？';
    reply = reply.replace(/\[IMG:.+?\]/g, '').trim();
    let imageUrl = null;

    // Detect if user wants to see an image
    const imageKeywords = ['看', '圖片', '圖', '長怎樣', '長什麼樣', '照片', '外觀', '樣子'];
    const wantsImage = imageKeywords.some(kw => message.includes(kw));

    if (wantsImage && GOOGLE_API_KEY && GOOGLE_CX) {
      // Extract food name from user message
      const foodItems = ['松露薯條','薯條','炸雞','青花椒脆皮炸雞','蜂蜜芥末炸雞','檸檬炸雞','提拉米蘇','布丁','玉米','橘醬','松露奶油','麻辣奶油','Cheese奶油','墨西哥奶油莎莎','佩里斯白醬','紐奧良雞腿','蛤蜊','烤雞腿','炸蝦','松阪豬','圓麵','扁麵','筆管麵','燉飯','拿鐵','美式','奶茶','烏龍茶','紅茶','水果茶','麵包','濃湯'];
      const matched = foodItems.find(item => message.includes(item)) || message.replace(/我想看|圖片|的|長怎樣|長什麼樣|照片/g, '').trim();
      const query = `JAI宅 ${matched}`;

      try {
        const searchRes = await fetch(
          `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(query)}&searchType=image&num=1`
        );
        const searchData = await searchRes.json();
        if (searchData.items?.[0]?.link) {
          imageUrl = searchData.items[0].link;
        }
      } catch (e) {}
    }

    return res.status(200).json({ reply, imageUrl });
  } catch (e) {
    return res.status(500).json({ reply: `連線錯誤：${e.message}` });
  }
}
