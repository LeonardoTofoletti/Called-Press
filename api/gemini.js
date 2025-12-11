export default async function handler(req, res) {
  // Aceitar somente POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
       return res.status(400).json({ error: 'Prompt não enviado' });
    }

    // ===== SUA CHAVE DO GEMINI =====
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: 'Chave Gemini não configurada' });
    }

    // ===== CHAMADA PARA O GEMINI =====
    const respostaGemini = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + API_KEY,
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

    const dados = await respostaGemini.json();

    const textoGerado =
      dados?.candidates?.[0]?.content?.parts?.[0]?.text || null;

    if (!textoGerado) {
      return res.status(500).json({ error: "IA não retornou resultado" });
    }

    // ===== RETORNO PARA O FRONT-END =====
    return res.status(200).json({
      resultado: textoGerado
    });

  } catch (erro) {
    return res.status(500).json({ error: erro.message });
  }
}
