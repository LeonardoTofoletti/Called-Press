export default async function handler(req, res) {

  try {

    const { texto } = req.body;

    if (!texto) {
      return res.status(400).json({
        erro: 'Texto vazio'
      });
    }

    const resposta = await fetch(
      'https://api-inference.huggingface.co/models/google/flan-t5-base',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs:
            `Melhore esse texto de suporte técnico deixando mais profissional:\n\n${texto}`
        })
      }
    );

    const data = await resposta.json();

    console.log(data);

    // Modelo carregando
    if (data.error?.includes('loading')) {

      return res.status(200).json({
        resultado: texto
      });

    }

    // Outro erro
    if (data.error) {

      return res.status(500).json({
        erro: data.error
      });

    }

    let resultado = texto;

    if (Array.isArray(data) && data[0]?.generated_text) {
      resultado = data[0].generated_text;
    }

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