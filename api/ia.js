export default async function handler(req, res) {

  try {

    const { texto } = req.body;

    if (!texto) {
      return res.status(400).json({
        erro: 'Texto vazio'
      });
    }

    const resposta = await fetch(
      'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: texto
        })
      }
    );

    const data = await resposta.json();

    console.log(data);

    // Erro da HuggingFace
    if (data.error) {

      return res.status(500).json({
        erro: data.error
      });

    }

    let resultado = texto;

    // Alguns modelos retornam summary_text
    if (Array.isArray(data) && data[0]?.summary_text) {
      resultado = data[0].summary_text;
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