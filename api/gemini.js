export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // aceita tanto `prompt` quanto `texto`
    const { prompt, texto } = req.body;
    const content = (typeof prompt !== 'undefined' && prompt !== null) ? prompt : texto;

    if (!content || String(content).trim().length === 0) {
      return res.status(400).json({ error: 'Prompt/texto não enviado' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: 'Chave Gemini não configurada' });
    }

    // Chamada ao endpoint (usando key na query tal como seu exemplo original)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const body = {
      contents: [
        {
          parts: [{ text: String(content) }]
        }
      ]
    };

    const respostaGemini = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const dados = await respostaGemini.json();

    // Se a API externa responder com erro, repassa detalhe útil
    if (!respostaGemini.ok) {
      return res.status(502).json({
        error: 'Erro na API do Gemini',
        status: respostaGemini.status,
        details: dados
      });
    }

    // tenta extrair texto gerado (estrutura comum)
    const textoGerado = dados?.candidates?.[0]?.content?.parts?.[0]?.text || null;

    if (!textoGerado) {
      return res.status(500).json({
        error: 'IA não retornou resultado',
        details: dados
      });
    }

    // Retorna em ambos os nomes para compatibilidade front-end
    return res.status(200).json({
      resultado: textoGerado,
      result: textoGerado
    });

  } catch (erro) {
    console.error('API /api/gemini erro:', erro);
    return res.status(500).json({ error: erro?.message || String(erro) });
  }
}
