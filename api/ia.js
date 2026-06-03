// api/ia.js — Serverless function (Vercel)
// Proxy seguro para Gemini API com rate limiting e validação

const limiteRequests = new Map();
const RATE_LIMIT = 5;          // requisições por janela
const RATE_WINDOW = 60_000;    // janela de 1 minuto (ms)
const MAX_TEXTO = 3000;        // limite de caracteres do input
const MAX_TOKENS = 2000;

const SYSTEM_PROMPT = `Você é um sistema de reescrita de texto corporativo para suporte técnico fiscal.

REGRAS ABSOLUTAS:
- Responda APENAS com o texto reescrito, sem comentários, sem explicações, sem saudações
- NÃO use frases como "Com certeza", "Claro", "Segue", etc.
- NÃO use aspas ao redor do texto
- NÃO adicione títulos ou marcadores

TAREFA: Reescreva o texto abaixo de forma profissional, clara e objetiva em português brasileiro correto. Corrija gramática e pontuação. Mantenha o mesmo significado e nível de detalhe técnico.

TERMINOLOGIA OBRIGATÓRIA:
- AD = AnyDesk (software de acesso remoto)
- GA = sistema interno
- NF-e = Nota Fiscal Eletrônica
- NFC-e = Nota Fiscal do Consumidor Eletrônica
- CT-e = Conhecimento de Transporte Eletrônico
- MDF-e = Manifesto Eletrônico de Documentos Fiscais
- OS = Ordem de Serviço
- IBS = Imposto sobre Bens e Serviços
- CBS = Contribuição sobre Bens e Serviços

FORMATO: Um único parágrafo contínuo e fluido, sem quebras de linha desnecessárias.`;

export default async function handler(req, res) {
  // Só aceita POST
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'API online', versao: '2.0' });
  }

  // ── Rate limiting por IP ──────────────────────────
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'desconhecido';

  const agora = Date.now();
  const dados = limiteRequests.get(ip) || { count: 0, tempo: agora };

  if (agora - dados.tempo > RATE_WINDOW) {
    dados.count = 0;
    dados.tempo = agora;
  }

  dados.count++;
  limiteRequests.set(ip, dados);

  // Limpeza periódica do Map para evitar vazamento de memória
  if (limiteRequests.size > 500) {
    for (const [key, val] of limiteRequests) {
      if (agora - val.tempo > RATE_WINDOW) limiteRequests.delete(key);
    }
  }

  if (dados.count > RATE_LIMIT) {
    const resetEm = Math.ceil((RATE_WINDOW - (agora - dados.tempo)) / 1000);
    return res.status(429).json({
      erro: `Limite de ${RATE_LIMIT} requisições por minuto atingido.`,
      resetEm
    });
  }

  // ── Validação do body ─────────────────────────────
  const texto = req.body?.texto?.trim();

  if (!texto) {
    return res.status(400).json({ erro: 'Campo "texto" é obrigatório.' });
  }

  if (texto.length > MAX_TEXTO) {
    return res.status(400).json({
      erro: `Texto muito longo. Máximo: ${MAX_TEXTO} caracteres.`,
      recebido: texto.length
    });
  }

  // ── Chamada ao Gemini ─────────────────────────────
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY não configurada.');

    const resposta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: texto }] }],
          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: MAX_TOKENS,
            topP: 0.95,
            candidateCount: 1
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' }
          ]
        })
      }
    );

    const data = await resposta.json();

    // Erros da API do Gemini
    if (data.error) {
      console.error('[Gemini API Error]', data.error);

      // Se o modelo está sobrecarregado, devolve o texto original sem quebrar o fluxo
      if (data.error.code === 503 || data.error.code === 429) {
        return res.status(200).json({ resultado: texto, aviso: 'Serviço temporariamente indisponível. Texto original mantido.' });
      }

      return res.status(500).json({ erro: 'Erro na API de IA: ' + data.error.message });
    }

    const resultado = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!resultado) {
      return res.status(200).json({ resultado: texto, aviso: 'Resposta vazia da IA. Texto original mantido.' });
    }

    return res.status(200).json({ resultado });

  } catch (err) {
    console.error('[ia.js] Erro interno:', err);
    // Fallback seguro: devolve o texto original
    return res.status(200).json({ resultado: texto, aviso: 'Erro interno. Texto original mantido.' });
  }
}
