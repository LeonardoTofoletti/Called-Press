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
      'https://router.huggingface.co/hf-inference/models/HuggingFaceH4/zephyr-7b-beta',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: `<|system|>
Você melhora textos de suporte técnico deixando mais profissional.</s>
<|user|>
${texto}</s>
<|assistant|>`
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

    let resultado = texto;

    if (Array.isArray(data) && data[0]?.generated_text) {

      resultado = data[0].generated_text
        .replace(/<\|assistant\|>/g, '')
        .trim();

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