export default async function handler(req, res) {

  // Só aceita POST
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
      'https://api-inference.huggingface.co/models/gpt2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: `Melhore este texto:\n${texto}`
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

    return res.status(200).json({
      resultado: data?.[0]?.generated_text || texto
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      erro: err.message
    });

  }

}