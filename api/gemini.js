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

    // ===== LOG DA RESPOSTA BRUTA =====
    const textoBruto = await respostaGemini.text();
    console.log("RESPOSTA GEMINI BRUTA:", textoBruto);

    // ===== TENTAR PARSEAR JSON =====
    let dados;
    try {
      dados = JSON.parse(textoBruto);
    } catch (err) {
      console.error("Erro ao parsear JSON do Gemini:", err);
      return res.status(500).json({ error: "Não foi possível interpretar a resposta da IA", raw: textoBruto });
    }

    // ===== PEGAR TEXTO GERADO =====
    const textoGerado = dados?.candidates?.[0]?.content?.parts?.[0]?.text || null;

    if (!textoGerado) {
      return res.status(500).json({ error: "IA não retornou resultado", raw: textoBruto });
    }

    // ===== RETORNO PARA O FRONT-END =====
    return res.status(200).json({
      result: textoGerado
    });

  } catch (erro) {
    console.error("Erro no handler do Gemini:", erro);
    return res.status(500).json({ error: erro.message });
  }
}
