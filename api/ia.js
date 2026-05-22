export default async function handler(req, res) {

  try {

    // TESTE SIMPLES
    return res.status(200).json({
      resultado: 'IA funcionando corretamente'
    });

  } catch (err) {

    return res.status(500).json({
      erro: err.message
    });

  }

}