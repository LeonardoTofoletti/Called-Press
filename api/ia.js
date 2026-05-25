const limiteRequests = new Map();
export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(200).json({
      status: 'API online'
    });
  }

  try {
          const ip =
      req.headers['x-forwarded-for'] ||
      req.socket?.remoteAddress ||
      'desconhecido';

    const agora = Date.now();

    const dados = limiteRequests.get(ip) || {
      count: 0,
      tempo: agora
    };

    // reset após 1 minuto
    if (agora - dados.tempo > 60000) {
      dados.count = 0;
      dados.tempo = agora;
    }

    dados.count++;

    limiteRequests.set(ip, dados);

    console.log('IP:', ip, 'Requests:', dados.count);
    // limite de 2 requisições por minuto
    if (dados.count > 2) {
      return res.status(429).json({
        erro: 'Limite de 2 requisições por minuto atingido.'
      });
    }
    const texto = req.body?.texto;

    if (!texto) {
      return res.status(400).json({
        erro: 'Texto vazio'
      });
    }

    const resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `
Você é um sistema de reescrita de texto.

REGRAS OBRIGATÓRIAS:
- NÃO converse
- NÃO explique nada
- NÃO cumprimente o usuário
- NÃO use frases como "Com certeza", "Claro", etc
- NÃO adicione comentários
- NÃO use aspas
- Responda APENAS com o texto reescrito

TAREFA:
Reescreva o texto abaixo de forma profissional, clara e objetiva, corrigindo o português.

IMPORTANTE:
Responda em um único parágrafo contínuo, sem cortes.

OBS: 
- A abreviação AD é de Anydesk
- OS é ordem de serviço
TEXTO:
${texto}
`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 800,
            topP: 1
          }
        })
      }
    );

    const data = await resposta.json();

    console.log('Gemini:', data);

    if (data.error) {

      if (data.error.code === 503) {
        return res.status(200).json({
          resultado: texto
        });
      }

      return res.status(500).json({
        erro: data.error.message
      });
    }

    const resultado =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || texto;

    return res.status(200).json({
      resultado
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      erro: err.message
    });

  }

}