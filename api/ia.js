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
      'https://router.huggingface.co/together/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mistralai/Mistral-7B-Instruct-v0.2',
          messages: [
            {
              role: 'system',
              content: 'Você melhora textos de suporte técnico deixando eles mais profissionais e claros.'
            },
            {
              role: 'user',
              content: texto
            }
          ],
          max_tokens: 200,
          temperature: 0.4
        })
      }
    );

    const data = await resposta.json();

    console.log(data);

    if (data.error) {
      return res.status(500).json({
        erro: data.error
      });
    }

    const resultado =
      data?.choices?.[0]?.message?.content || texto;

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