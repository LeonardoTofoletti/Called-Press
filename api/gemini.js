export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Envie um prompt" });
  }

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    // Repassar erro da API corretamente
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Retornar somente o texto gerado (fica mais fácil no front)
    const output = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return res.status(200).json({ result: output });
  } catch (error) {
    console.error("Erro:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
}
