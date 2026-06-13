// Vercel Serverless Function — POST /api/recipe
// Receives { text, image: { media_type, data } } from the browser,
// calls Claude with your secret API key, returns parsed recipe JSON.
//
// The API key lives ONLY here (as an environment variable on Vercel),
// never in the browser. This is what keeps it safe.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server missing ANTHROPIC_API_KEY" });
  }

  try {
    const { text, image } = req.body || {};
    if (!text && !image) {
      return res.status(400).json({ error: "请提供照片或食材文字" });
    }

    const sourceLine =
      image && text
        ? "看照片里的食材，并参考用户补充的文字，一起考虑。"
        : image
        ? "看这张食材照片，列出你认得的食材。"
        : `用户家里现有这些食材：${text}。`;

    const prompt = `你是一位注重健康养生的中餐家厨。${sourceLine}
然后用这些食材设计 1-2 道菜。
要求：必须是中式家常菜、温热的菜（不要凉拌或生食）、清淡少油少盐、少米饭碳水、多深绿色蔬菜和深海鱼、尽量有滋阴养肾润燥的搭配。
只返回 JSON，不要任何额外文字或 markdown：
{"ingredients":["食材1","食材2"],"dishes":[{"name":"菜名","ing":["用料"],"steps":["步骤1","步骤2"],"why":"为什么健康"}]}`;

    const content = [];
    if (image && image.data) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: image.media_type, data: image.data },
      });
    }
    content.push({ type: "text", text: prompt });

    const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content }],
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return res.status(502).json({ error: `Claude API ${apiRes.status}`, detail: errText.slice(0, 200) });
    }

    const data = await apiRes.json();
    const out = (data.content || [])
      .filter((i) => i && i.type === "text")
      .map((i) => i.text)
      .join("")
      .trim();

    // Extract JSON even if wrapped in prose/markdown
    let clean = out.replace(/```json/gi, "").replace(/```/g, "").trim();
    const a = clean.indexOf("{");
    const z = clean.lastIndexOf("}");
    if (a === -1 || z === -1 || z < a) {
      return res.status(502).json({ error: "无法解析菜谱", detail: out.slice(0, 200) });
    }
    clean = clean.slice(a, z + 1);

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      return res.status(502).json({ error: "菜谱格式错误", detail: clean.slice(0, 200) });
    }

    const dishes = Array.isArray(parsed.dishes) ? parsed.dishes : [];
    if (!dishes.length) {
      return res.status(502).json({ error: "没有生成菜谱，请再试一次" });
    }

    return res.status(200).json({
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
      dishes: dishes.map((d) => ({
        name: d.name || "推荐菜",
        ing: Array.isArray(d.ing) ? d.ing : [],
        steps: Array.isArray(d.steps) ? d.steps : [],
        why: d.why || "",
      })),
    });
  } catch (e) {
    return res.status(500).json({ error: "服务器出错", detail: String(e && e.message ? e.message : e) });
  }
}
