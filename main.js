// ---- Mudar de tela ----
function mostrarTela(tipo) {
  document.querySelectorAll('.tela').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tipo-chamado button').forEach(b => b.classList.remove('ativo'));
  document.getElementById('tela-' + tipo).classList.add('active');
  document.getElementById('btn-' + tipo).classList.add('ativo');
}

// ---- Dark Mode ----
const darkSwitch = document.getElementById('darkSwitch');
const iconMoon = document.getElementById('iconMoon');
const iconSun = document.getElementById('iconSun');

function applyTheme(theme) {
  document.body.classList.toggle('dark', theme === 'dark');
  iconMoon.classList.toggle('d-none', theme === 'dark');
  iconSun.classList.toggle('d-none', theme !== 'dark');
}

let theme = localStorage.getItem('theme') || 'light';
applyTheme(theme);

darkSwitch.addEventListener('click', () => {
  theme = theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', theme);
  applyTheme(theme);
  
});

// ---- Botão de Novas Atualizações piscando ----
const btnAtualizacoes = document.getElementById('novasAtualizacoes');
const ATUALIZACAO_KEY = 'jaViuAtualizacao';
const VERSAO_ATUALIZACAO = '23-10-2025'; // atualize sempre que tiver novidade

// Se o usuário não viu essa versão, o botão pisca
const jaViu = localStorage.getItem(ATUALIZACAO_KEY);
if (jaViu !== VERSAO_ATUALIZACAO) {
  btnAtualizacoes.classList.add('btn-piscar');
}

// Ao clicar no botão, considera que viu a atualização
btnAtualizacoes.addEventListener('click', () => {
  localStorage.setItem(ATUALIZACAO_KEY, VERSAO_ATUALIZACAO);
  btnAtualizacoes.classList.remove('btn-piscar');
});

// ---- Verifica automaticamente nova versão do site ----
fetch('/version.json')
  .then(res => res.json())
  .then(data => {
    if (data.versao !== VERSAO_ATUALIZACAO) {
      // Atualiza variável e faz o botão piscar
      VERSAO_ATUALIZACAO = data.versao;
      checkBtnAtualizacoes();
    }
  })
  .catch(err => console.warn('Não foi possível verificar a versão do site:', err));

// ---- Copiar textos ----
document.getElementById('copyBtn').addEventListener('click', () => {
  const ativo = document.querySelector('.tipo-chamado button.ativo').textContent;
  let texto = `TIPO DE CHAMADO: ${ativo}\n\n`;

  if (ativo === 'Problema') {
    if (docNumber.value) texto += `NÚMERO DO DOCUMENTO: ${docNumber.value}\n\n`;
    if (errorMessage.value) texto += `MENSAGEM DE ERRO: ${errorMessage.value}\n\n`;
    if (problemCause.value) texto += `CAUSA DO PROBLEMA: ${problemCause.value}\n\n`;
    if (resolution.value) texto += `RESOLUÇÃO: ${resolution.value}\n\n`;
  } else if (ativo === 'Dúvida') {
    if (duvidaCliente.value) texto += `DÚVIDA DO CLIENTE: ${duvidaCliente.value}\n\n`;
    if (duvidaExplicacao.value) texto += `EXPLICAÇÃO: ${duvidaExplicacao.value}\n\n`;
  } else {
    if (contatoRelato.value) texto += `RELATO DO CONTATO: ${contatoRelato.value}\n\n`;
  }

  if (clientFeedback.value) texto += `FEEDBACK DO CLIENTE: ${clientFeedback.value}\n\n`;
  if (humorSelection.value) texto += `HUMOR DO CLIENTE: ${humorSelection.value}\n\n`;

  const upsell = document.querySelector('input[name="upsell"]:checked')?.value;
  const captura = document.querySelector('input[name="captura"]:checked')?.value;

  if (upsell) texto += `UPSELL: ${upsell}\n\n`;
  if (upsellDesc.value) texto += `DESCRIÇÃO UPSELL: ${upsellDesc.value}\n\n`;
  if (captura) texto += `MENSAGENS OU PRINT DE ERROS: ${captura}`;

  navigator.clipboard.writeText(texto).then(() => {
    const msg = document.getElementById('copyMessage');
    msg.style.opacity = '1';
    setTimeout(() => { msg.style.opacity = '0'; }, 1500);

    // Limpar campos
    document.querySelectorAll('input[type="text"], textarea').forEach(el => el.value = '');
  });
});

// ---- Auto Resize ----
const autoResize = (el) => {
  el.style.height = 'auto';
  el.style.height = (el.scrollHeight) + 'px';
};

const camposAutoResize = ['resolution', 'upsellDesc', 'duvidaExplicacao', 'contatoRelato'];
camposAutoResize.forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', () => autoResize(el));
    autoResize(el);
  }
});

// ---- Função de formatação de texto reconhecido ----
function formatarTextoReconhecido(texto) {
  return texto
    .replace(/\bvírgula\b/gi, ',')
    .replace(/\bponto e vírgula\b/gi, ';')
    .replace(/\bponto\b/gi, '.')
    .replace(/\bdois pontos\b/gi, ':')
    .replace(/\binterrogação\b/gi, '?')
    .replace(/\bexclamação\b/gi, '!')
    .replace(/\bnf\b/gi, 'nota fiscal')
    .replace(/\bcli\b/gi, 'cliente')
    .replace(/\bobs\b/gi, 'observação')
    .replace(/\bnum\b/gi, 'número')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, c => c.toUpperCase());
}

// ---- Microfone Web Speech API ----
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  document.querySelectorAll('#problemCause, #resolution, #clientFeedback, #duvidaCliente, #duvidaExplicacao, #contatoRelato').forEach(campo => {
    const micBtn = document.createElement('button');
    micBtn.type = 'button';
    micBtn.innerHTML = '<i class="bi bi-mic"></i>';
    micBtn.className = 'btn btn-outline-secondary btn-sm mic-btn';
    micBtn.style.position = 'absolute';
    micBtn.style.right = '10px';
    micBtn.style.top = '50%';
    micBtn.style.transform = 'translateY(-50%)';
    micBtn.style.borderRadius = '50%';
    micBtn.style.width = '34px';
    micBtn.style.height = '34px';
    micBtn.style.display = 'flex';
    micBtn.style.justifyContent = 'center';
    micBtn.style.alignItems = 'center';
    micBtn.style.padding = '0';

    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    campo.parentNode.insertBefore(wrapper, campo);
    wrapper.appendChild(campo);
    wrapper.appendChild(micBtn);

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.continuous = true;

    let gravando = false;

    micBtn.addEventListener('click', () => {
      if (!gravando) {
        recognition.start();
        gravando = true;
        micBtn.innerHTML = '<i class="bi bi-mic-fill text-danger"></i>';
        micBtn.style.animation = 'pulse 1s infinite';
      } else {
        recognition.stop();
        gravando = false;
        micBtn.innerHTML = '<i class="bi bi-mic"></i>';
        micBtn.style.animation = 'none';
      }
    });

    recognition.onresult = (event) => {
      let transcript = Array.from(event.results).map(r => r[0].transcript).join(' ');
      transcript = formatarTextoReconhecido(transcript);
      campo.value += (campo.value ? ' ' : '') + transcript;
      autoResize(campo);
    };

    recognition.onend = () => {
      if (gravando) recognition.start();
    };
  });
} else {
  console.warn("Reconhecimento de voz não suportado neste navegador.");
}

// ---- Copiar texto de erro IE ----
document.getElementById('copyErroIE').addEventListener('click', () => {
  const textoIE = `TIPO DE CHAMADO: Problema

MENSAGEM DE ERRO: IE INVALIDO

CAUSA DO PROBLEMA: O PROBLEMA É CAUSADO POR CONTA QUE ESTÁ FALTANDO O IE DO CLIENTE NO CADASTRO DO CLIENTE OU O CLIENTE TEM IE DESABILITADO

RESOLUÇÃO: COLOCAR O IE DO CLIENTE NO CADASTRO E AJUSTAR SE ELE É CONTRIBUINTE OU NÃO CONTRIBUINTE

FEEDBACK DO CLIENTE: AGRADECIDO

HUMOR DO CLIENTE: Bom

UPSELL: Não

MENSAGENS OU PRINT DE ERROS: Não`;

  navigator.clipboard.writeText(textoIE).then(() => {
    const msg = document.getElementById('copyMessage');
    msg.style.opacity = '1';
    setTimeout(() => { msg.style.opacity = '0'; }, 1500);
  });
});




