export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(200).json({
      status: 'API online'
    });
  }

  try {

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
              parts: [
                {
                  text:
`Você é um assistente de suporte técnico.

Reescreva o texto abaixo de forma:
- profissional
- clara
- objetiva
- corrigindo português

Texto:
${texto}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 200
          }
        })
      }
    );

    const data = await resposta.json();

    console.log(data);

    // erro da API
    if (data.error) {
      return res.status(500).json({
        erro: data.error.message
      });
    }

    const resultado =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || texto;

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