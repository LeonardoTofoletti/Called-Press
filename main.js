/* =============================================
   CALLED PRESS — main.js (refatorado)
   ============================================= */

// ─── TEMA ─────────────────────────────────────────
const html = document.documentElement;
const darkSwitch = document.getElementById('darkSwitch');
const iconMoon = document.getElementById('iconMoon');
const iconSun = document.getElementById('iconSun');

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  iconMoon.classList.toggle('d-none', theme === 'dark');
  iconSun.classList.toggle('d-none', theme !== 'dark');
}

let theme = localStorage.getItem('theme') || 'dark';
applyTheme(theme);

darkSwitch.addEventListener('click', () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', theme);
  applyTheme(theme);
});

// ─── TROCAR TELA ──────────────────────────────────
function mostrarTela(tipo) {
  document.querySelectorAll('.tela').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('ativo'));
  document.getElementById('tela-' + tipo).classList.add('active');
  document.getElementById('btn-' + tipo).classList.add('ativo');
}

// ─── TOAST ────────────────────────────────────────
const toastEl = document.getElementById('toast');
let toastTimer;

function showToast(msg, tipo = 'ok') {
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.style.background = tipo === 'erro' ? '#7f1d1d' : tipo === 'aviso' ? '#78350f' : '#1a1a2e';
  toastEl.style.borderColor = tipo === 'erro' ? 'rgba(239,68,68,0.4)' : tipo === 'aviso' ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)';
  toastEl.classList.add('show');
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
}

// ─── AUTO RESIZE ──────────────────────────────────
function autoResize(el) {
  if (!el) return;
  el.style.height = 'auto';
  requestAnimationFrame(() => { el.style.height = el.scrollHeight + 'px'; });
}

// ─── CACHE (histórico de digitação) ───────────────
const CACHE_PREFIX = 'cp_cache_';
const CACHE_LIMIT = 20;

function cacheGet(id) {
  try { return JSON.parse(localStorage.getItem(CACHE_PREFIX + id) || '[]'); }
  catch { return []; }
}

function cachePush(id, value) {
  if (!value || !value.trim()) return;
  let list = cacheGet(id);
  const v = value.trim();
  if (list.includes(v)) return;
  list.push(v);
  if (list.length > CACHE_LIMIT) list = list.slice(-CACHE_LIMIT);
  localStorage.setItem(CACHE_PREFIX + id, JSON.stringify(list));
}

function cacheAll() {
  return Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
}

// ─── AUTOCOMPLETE (sugestões de histórico) ─────────
function criarAutocomplete(campo) {
  if (!campo || !campo.id) return;
  const wrap = campo.closest('.textarea-wrap') || campo.parentElement;

  const dropdown = document.createElement('div');
  dropdown.className = 'cache-dropdown d-none';
  wrap.appendChild(dropdown);

  // posicionar abaixo do campo
  wrap.style.position = 'relative';

  let idx = -1;

  function mostrar(filtro) {
    const lista = cacheGet(campo.id)
      .filter(v => v.toLowerCase().includes(filtro.toLowerCase()))
      .slice(-20).reverse();
    if (!lista.length) { dropdown.classList.add('d-none'); return; }
    dropdown.innerHTML = '';
    lista.forEach((v, i) => {
      const d = document.createElement('div');
      d.textContent = v;
      d.addEventListener('mousedown', e => {
        e.preventDefault();
        campo.value = v;
        autoResize(campo);
        dropdown.classList.add('d-none');
      });
      dropdown.appendChild(d);
    });
    dropdown.classList.remove('d-none');
    idx = -1;
  }

  function destacar() {
    const items = dropdown.querySelectorAll('div');
    items.forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  campo.addEventListener('focus', () => mostrar(campo.value));
  campo.addEventListener('input', () => { mostrar(campo.value); autoResize(campo); });

  campo.addEventListener('keydown', e => {
    const items = dropdown.querySelectorAll('div');
    if (dropdown.classList.contains('d-none') || !items.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); idx = (idx + 1) % items.length; destacar(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); idx = (idx - 1 + items.length) % items.length; destacar(); }
    else if (e.key === 'Enter' && idx >= 0) {
      e.preventDefault();
      campo.value = items[idx].textContent;
      autoResize(campo);
      dropdown.classList.add('d-none');
    } else if (e.key === 'Escape') { dropdown.classList.add('d-none'); }
  });

  campo.addEventListener('blur', () => {
    setTimeout(() => dropdown.classList.add('d-none'), 150);
    cachePush(campo.id, campo.value);
  });

  document.addEventListener('click', e => {
    if (!wrap.contains(e.target)) dropdown.classList.add('d-none');
  });
}

// ─── MICROFONE ────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const CORREÇÕES = [
  // pontuação
  [/\bvírgula\b/gi, ','],
  [/\bponto e vírgula\b/gi, ';'],
  [/\bponto\b/gi, '.'],
  [/\bdois pontos\b/gi, ':'],
  [/\binterrogação\b/gi, '?'],
  [/\bexclamação\b/gi, '!'],

  // documentos fiscais — do mais específico para o mais genérico
  [/\bnota fiscal do consumidor\b/gi, 'NFC-e'],
  [/\bnota fiscal\b/gi, 'NF-e'],
  [/\bcupom fiscal\b/gi, 'NFC-e'],
  [/\bcupom\b/gi, 'NFC-e'],
  [/\bmanifesto\b/gi, 'MDF-e'],
  [/\bCTe\b/gi, 'CT-e'],
  [/\bCTÉ\b/gi, 'CT-e'],

  // lookahead: só substitui se NÃO vier "-e" logo depois (evita "NF-e-e")
  [/\bnota(?!-e)\b/gi, 'NF-e'],
  [/\bnf(?!-e)\b/gi, 'NF-e'],
  [/\bNFC(?!-e)\b/gi, 'NFC-e'],

  // sistemas e abreviações
  [/\banydesk\b/gi, 'AD'],
  [/\bnidesk\b/gi, 'AD'],
  [/\bunidesk\b/gi, 'AD'],
  [/\bunidesc\b/gi, 'AD'],
  [/\bndesk\b/gi, 'AD'],
  [/\bN10\b/gi, 'AD'],
  [/\banidesc\b/gi, 'AD'],
  [/\bgea\b/gi, 'GA'],
  [/\bgear\b/gi, 'GA'],
  [/\bjean\b/gi, 'GA'],
  [/\bG A\b/gi, 'GA'],

  // outros
  [/\bconfins\b/gi, 'cofins'],
  [/\bcli\b/gi, 'cliente'],
  [/\bobs\b/gi, 'observação'],
  [/\bnum\b/gi, 'número'],
];

function formatarFala(texto, campoVazio) {
  CORREÇÕES.forEach(([re, rep]) => { texto = texto.replace(re, rep); });
  texto = texto.replace(/\s+/g, ' ').trim();
  if (campoVazio && texto.length > 0) texto = texto.charAt(0).toUpperCase() + texto.slice(1);
  return texto;
}

function adicionarMic(campo) {
  if (!SpeechRecognition || !campo) return;

  const mic = document.createElement('button');
  mic.type = 'button';
  mic.className = 'mic-btn';
  mic.title = 'Gravar voz';
  mic.setAttribute('aria-label', 'Gravar voz');
  mic.innerHTML = '<i class="bi bi-mic"></i>';
  campo.closest('.textarea-wrap').appendChild(mic);

  const rec = new SpeechRecognition();
  rec.lang = 'pt-BR';
  rec.interimResults = false;
  rec.continuous = true;

  let gravando = false;
  let ultimo = '';

  mic.addEventListener('click', () => {
    if (!gravando) {
      rec.start();
      gravando = true;
      mic.classList.add('gravando');
      mic.innerHTML = '<i class="bi bi-mic-fill"></i>';
    } else {
      rec.stop();
      gravando = false;
      mic.classList.remove('gravando');
      mic.innerHTML = '<i class="bi bi-mic"></i>';
    }
  });

  rec.onresult = e => {
    let trecho = '';
    for (let i = e.resultIndex || 0; i < e.results.length; i++) {
      trecho += e.results[i][0].transcript;
    }
    trecho = trecho.trim();
    if (!trecho || trecho === ultimo) return;
    const vazio = !campo.value.trim();
    trecho = formatarFala(trecho, vazio);
    campo.value += (campo.value ? ' ' : '') + trecho;
    ultimo = trecho;
    autoResize(campo);
  };

  rec.onend = () => { if (gravando) rec.start(); };
}

// ─── ERROS COMUNS (custom select) ─────────────────
fetch('errosComuns.json')
  .then(r => r.json())
  .then(erros => {
    const cs = document.getElementById('customSelect');
    const selected = cs.querySelector('.selected');
    const optionsCont = cs.querySelector('.options');
    const searchInput = cs.querySelector('#searchErros');
    const optionsList = cs.querySelector('.options-list');

    let aberto = false;

    function renderOpcoes(filtro = '') {
      optionsList.innerHTML = '';
      const fl = filtro.toLowerCase();
      erros
        .filter(e => e.erro.toLowerCase().includes(fl))
        .forEach((item, idx) => {
          const d = document.createElement('div');
          d.textContent = item.erro;
          d.addEventListener('click', () => selecionar(item));
          optionsList.appendChild(d);
        });
    }

    function abrir() {
      optionsCont.classList.remove('d-none');
      selected.classList.add('open');
      selected.setAttribute('aria-expanded', 'true');
      aberto = true;
      searchInput.value = '';
      renderOpcoes();
      setTimeout(() => searchInput.focus(), 50);
    }

    function fechar() {
      optionsCont.classList.add('d-none');
      selected.classList.remove('open');
      selected.setAttribute('aria-expanded', 'false');
      aberto = false;
    }

    function selecionar(item) {
      selected.textContent = item.erro;
      selected.classList.remove('placeholder');
      fechar();

      // Preencher campos
      const set = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined) { el.value = val; autoResize(el); cachePush(id, val); }
      };

      set('errorMessage', item.mensagem);
      set('problemCause', item.causa);
      set('resolution', item.resolucao);
      set('clientFeedback', item.feedback);

      const humorEl = document.getElementById('humorSelection');
      if (humorEl && item.humor) humorEl.value = item.humor;

      const upsellEl = document.querySelector(`input[name="upsell"][value="${item.upsell}"]`);
      if (upsellEl) { upsellEl.checked = true; toggleUpsell(); }

      const capturaEl = document.querySelector(`input[name="captura"][value="${item.captura}"]`);
      if (capturaEl) capturaEl.checked = true;

      showToast('✓ Campos preenchidos automaticamente');
    }

    selected.addEventListener('click', () => aberto ? fechar() : abrir());
    selected.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aberto ? fechar() : abrir(); } });

    searchInput.addEventListener('input', () => renderOpcoes(searchInput.value));

    document.addEventListener('click', e => {
      if (aberto && !cs.contains(e.target)) fechar();
    });

    renderOpcoes();
  })
  .catch(err => console.warn('Erro ao carregar errosComuns.json:', err));

// ─── TOGGLE UPSELL ────────────────────────────────
const upsellDescWrap = document.getElementById('upsellDescWrap');

function toggleUpsell() {
  const val = document.querySelector('input[name="upsell"]:checked')?.value;
  if (upsellDescWrap) upsellDescWrap.style.display = val === 'Sim' ? 'block' : 'none';
}

document.querySelectorAll('input[name="upsell"]').forEach(r => r.addEventListener('change', toggleUpsell));

// ─── COPIAR TEXTO ─────────────────────────────────
document.getElementById('copyBtn').addEventListener('click', () => {
  // Extrai só o texto do botão ativo, ignorando o ícone <i>
  const btnAtivo = document.querySelector('.tab-btn.ativo');
  const ativo = btnAtivo
    ? Array.from(btnAtivo.childNodes)
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent.trim())
        .join('').trim()
    : '';

  let texto = '';

  const val = id => (document.getElementById(id)?.value.trim() || '');

  if (ativo === 'Problema') {
    if (val('docNumber'))    texto += `NÚMERO DO DOCUMENTO: ${val('docNumber')}\n\n`;
    if (val('errorMessage')) texto += `MENSAGEM DE ERRO: ${val('errorMessage')}\n\n`;
    if (val('problemCause')) texto += `CAUSA DO PROBLEMA / DUVIDA: ${val('problemCause')}\n\n`;
    if (val('resolution'))   texto += `RESOLUÇÃO: ${val('resolution')}\n\n`;
  } else if (ativo === 'Dúvida') {
    if (val('duvidaCliente'))    texto += `DÚVIDA DO CLIENTE: ${val('duvidaCliente')}\n\n`;
    if (val('duvidaExplicacao')) texto += `EXPLICAÇÃO: ${val('duvidaExplicacao')}\n\n`;
  } else {
    if (val('contatoRelato')) texto += `RELATO DO CONTATO: ${val('contatoRelato')}\n\n`;
  }

  if (val('clientFeedback')) texto += `FEEDBACK DO CLIENTE: ${val('clientFeedback')}\n\n`;

  const humor   = document.getElementById('humorSelection')?.value;
  const upsell  = document.querySelector('input[name="upsell"]:checked')?.value;
  const captura = document.querySelector('input[name="captura"]:checked')?.value;

  if (humor)   texto += `HUMOR DO CLIENTE: ${humor}\n\n`;
  if (upsell)  texto += `UPSELL: ${upsell}\n\n`;
  if (upsell === 'Sim' && val('upsellDesc')) texto += `DESCRIÇÃO UPSELL: ${val('upsellDesc')}\n\n`;
  if (captura) texto += `MENSAGENS OU PRINT DE ERROS: ${captura}`;

  texto = texto.trimEnd();

  navigator.clipboard.writeText(texto).then(() => {
    // Notificação canto superior direito
    const msg = document.getElementById('copyMessage');
    if (msg) {
      msg.style.opacity = '1';
      msg.style.transform = 'translateY(0)';
      setTimeout(() => {
        msg.style.opacity = '0';
        msg.style.transform = 'translateY(-8px)';
      }, 1800);
    }

    // Limpar todos os campos após copiar
    document.querySelectorAll('.field-input, .field-textarea').forEach(el => {
      el.value = '';
      autoResize(el);
      localStorage.removeItem('cp_session_' + el.id);
    });
    document.getElementById('humorSelection').value = 'Bom';
    document.getElementById('upsellNo').checked = true;
    document.getElementById('capturaNo').checked = true;
    toggleUpsell();

    // Resetar custom select de erros
    const sel = document.querySelector('#customSelect .selected');
    if (sel) { sel.textContent = 'Selecione um erro para autopreenchimento...'; sel.classList.add('placeholder'); }

    // Resetar chamados salvos
    selectedSalvos.textContent = 'Selecione um chamado salvo...';
    selectedSalvos.classList.add('placeholder');

  }).catch(() => {
    showToast('Erro ao copiar. Tente novamente.', 'erro');
  });
});

// ─── LIMPAR CAMPOS ────────────────────────────────
document.getElementById('limparCampos').addEventListener('click', () => {
  document.querySelectorAll('.field-input, .field-textarea').forEach(el => { el.value = ''; autoResize(el); });
  document.getElementById('humorSelection').value = 'Bom';
  document.getElementById('upsellNo').checked = true;
  document.getElementById('capturaNo').checked = true;
  toggleUpsell();

  // resetar custom select de erros
  const sel = document.querySelector('#customSelect .selected');
  if (sel) { sel.textContent = 'Selecione um erro para autopreenchimento...'; sel.classList.add('placeholder'); }

  // Resetar chamados salvos
  selectedSalvos.textContent = 'Selecione um chamado salvo...';
  selectedSalvos.classList.add('placeholder');

  showToast('🧹 Campos limpos');
});

// ─── LIMPAR CACHE ─────────────────────────────────
document.getElementById('limparHistorico').addEventListener('click', () => {
  cacheAll().forEach(k => localStorage.removeItem(k));
  showToast('🗑️ Cache apagado com sucesso');
});

// ─── BOTÃO IA ─────────────────────────────────────
let emProcessoIA = false;
const btnIA = document.getElementById('btnIA');
const iaModal = new bootstrap.Modal(document.getElementById('iaModal'));

const camposIA = ['problemCause', 'resolution', 'duvidaCliente', 'duvidaExplicacao', 'contatoRelato'];

btnIA.addEventListener('click', async () => {
  if (emProcessoIA) return;

  const alvo = camposIA
    .map(id => document.getElementById(id))
    .filter(el => el && el.value.trim() && !el.closest('.tela') || (el && el.value.trim() && el.closest('.tela.active')));

  // pega só os campos da tela ativa + clientFeedback
  const telaAtiva = document.querySelector('.tela.active');
  const paraProcessar = [
    ...Array.from(telaAtiva?.querySelectorAll('.field-textarea') || []),
    document.getElementById('clientFeedback')
  ].filter(el => el && el.value.trim());

  if (!paraProcessar.length) {
    showToast('Preencha pelo menos um campo para usar a IA.', 'aviso');
    return;
  }

  emProcessoIA = true;
  btnIA.disabled = true;
  iaModal.show();

  try {
    for (const campo of paraProcessar) {
      const original = campo.value.trim();
      try {
        const res = await fetch('/api/ia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texto: original, tipo: 'melhorar' })
        });
        if (!res.ok) throw new Error('Erro HTTP ' + res.status);
        const data = await res.json();
        if (data.resultado) {
          campo.value = data.resultado;
          autoResize(campo);
          cachePush(campo.id, data.resultado);
        }
      } catch (err) {
        console.warn('Erro na IA para campo', campo.id, err);
      }
    }
    showToast('✨ Texto melhorado com IA!');
  } finally {
    iaModal.hide();
    btnIA.disabled = false;
    emProcessoIA = false;
  }
});

// ─── INICIALIZAÇÃO ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  toggleUpsell();

  // Auto-resize + cache + mic em todos os textareas
  document.querySelectorAll('.field-textarea').forEach(el => {
    autoResize(el);
    criarAutocomplete(el);
    adicionarMic(el);
  });

  // Cache em inputs de texto
  document.querySelectorAll('.field-input').forEach(el => {
  if (el.id !== 'nomeChamado') {
    criarAutocomplete(el);
  }
  });

  // Restaurar valores do cache na última sessão
  const CAMPOS_PERSISTIR = ['docNumber', 'errorMessage', 'problemCause', 'resolution',
    'clientFeedback', 'duvidaCliente', 'duvidaExplicacao', 'contatoRelato', 'upsellDesc'];

  CAMPOS_PERSISTIR.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const saved = localStorage.getItem('cp_session_' + id);
    if (saved) { el.value = saved; autoResize(el); }

    el.addEventListener('input', () => {
      localStorage.setItem('cp_session_' + id, el.value);
    });
  });
});
// ─── CHAMADOS SALVOS (LOCALSTORAGE) ─────────────────
const btnSalvar = document.getElementById('btnSalvarChamado');
const selectSalvos = document.getElementById('selectChamadosSalvos');
const selectedSalvos = selectSalvos.querySelector('.selected');
const optionsContSalvos = selectSalvos.querySelector('.options');
const searchSalvos = selectSalvos.querySelector('#searchSalvos');
const listSalvos = selectSalvos.querySelector('#listaChamadosSalvos');

let salvosAberto = false;

// Funções de banco de dados (LocalStorage)
function getChamadosSalvos() {
  return JSON.parse(localStorage.getItem('cp_chamados_salvos') || '[]');
}

function setChamadosSalvos(lista) {
  localStorage.setItem('cp_chamados_salvos', JSON.stringify(lista));
}

// Renderiza a lista no dropdown
let chamadoParaExcluir = null;

const modalExcluirChamado = new bootstrap.Modal(
  document.getElementById('excluirChamadoModal')
);
function renderChamadosSalvos(filtro = '') {
  listSalvos.innerHTML = '';
  const lista = getChamadosSalvos();
  const fl = filtro.toLowerCase();

  if (lista.length === 0) {
    listSalvos.innerHTML = '<div style="color:var(--text-placeholder); cursor:default; text-align:center;">Nenhum chamado salvo.</div>';
    return;
  }

  lista.filter(c => c.nome.toLowerCase().includes(fl)).forEach((item) => {
    const d = document.createElement('div');
    d.className = 'd-flex justify-content-between align-items-center';
    
    // Nome do chamado (clicável para carregar)
    const span = document.createElement('span');
    span.textContent = item.nome;
    span.style.flex = '1';
    span.addEventListener('click', () => carregarChamadoSalvo(item));

    // Ícone de lixeira (clicável para excluir)
    const delBtn = document.createElement('i');
    delBtn.className = 'bi bi-trash3 text-danger ms-2';
    delBtn.style.cursor = 'pointer';
    delBtn.title = 'Excluir modelo';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();

      chamadoParaExcluir = item.id;

      document.getElementById('nomeModeloExcluir').textContent =
        `"${item.nome}"`;

      modalExcluirChamado.show();
    });

    d.appendChild(span);
    d.appendChild(delBtn);
    listSalvos.appendChild(d);
  });
}

// Preenche os campos com os dados salvos
function carregarChamadoSalvo(item) {
  selectedSalvos.textContent = item.nome;
  selectedSalvos.classList.remove('placeholder');
  fecharSalvos();

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) { el.value = val; autoResize(el); cachePush(id, val); }
  };

  // Restaura todos os campos salvos
  Object.keys(item.dados).forEach(key => {
    if (key === 'humor') {
      const h = document.getElementById('humorSelection');
      if (h) h.value = item.dados[key];
    } else if (key === 'upsell') {
      const u = document.querySelector(`input[name="upsell"][value="${item.dados[key]}"]`);
      if (u) { u.checked = true; toggleUpsell(); }
    } else if (key === 'captura') {
      const c = document.querySelector(`input[name="captura"][value="${item.dados[key]}"]`);
      if (c) c.checked = true;
    } else {
      set(key, item.dados[key]);
    }
  });

  showToast('✓ Modelo carregado com sucesso');
}

// Lógica de abrir/fechar o dropdown
function abrirSalvos() {
  optionsContSalvos.classList.remove('d-none');
  selectedSalvos.classList.add('open');
  salvosAberto = true;
  searchSalvos.value = '';
  renderChamadosSalvos();
  setTimeout(() => searchSalvos.focus(), 50);
}

function fecharSalvos() {
  optionsContSalvos.classList.add('d-none');
  selectedSalvos.classList.remove('open');
  salvosAberto = false;
}

selectedSalvos.addEventListener('click', () => salvosAberto ? fecharSalvos() : abrirSalvos());
searchSalvos.addEventListener('input', () => renderChamadosSalvos(searchSalvos.value));
document.addEventListener('click', e => {
  if (salvosAberto && !selectSalvos.contains(e.target)) fecharSalvos();
});

// Abre o modal
btnSalvar.addEventListener('click', () => {
  document.getElementById('nomeChamado').value = '';

  new bootstrap.Modal(
    document.getElementById('salvarChamadoModal')
  ).show();
});

// Salva quando clicar no botão do modal
document.getElementById('confirmarSalvarChamado').addEventListener('click', () => {

  const nome = document.getElementById('nomeChamado').value.trim();

  if (!nome) {
    showToast('Digite um nome para o modelo', 'aviso');
    return;
  }

  const val = id => document.getElementById(id)?.value.trim() || '';
  const upsell = document.querySelector('input[name="upsell"]:checked')?.value;
  const captura = document.querySelector('input[name="captura"]:checked')?.value;

  const dados = {
    docNumber: val('docNumber'),
    errorMessage: val('errorMessage'),
    problemCause: val('problemCause'),
    resolution: val('resolution'),
    duvidaCliente: val('duvidaCliente'),
    duvidaExplicacao: val('duvidaExplicacao'),
    contatoRelato: val('contatoRelato'),
    clientFeedback: val('clientFeedback'),
    upsellDesc: val('upsellDesc'),
    humor: document.getElementById('humorSelection')?.value,
    upsell,
    captura
  };

  const novo = {
    id: Date.now(),
    nome,
    dados
  };

  const lista = getChamadosSalvos();
  lista.push(novo);
  setChamadosSalvos(lista);

  renderChamadosSalvos();

  bootstrap.Modal
    .getInstance(document.getElementById('salvarChamadoModal'))
    .hide();

  showToast('⭐ Chamado salvo com sucesso!');
});
document.getElementById('confirmarExcluirChamado')
.addEventListener('click', () => {

  let listaAtual = getChamadosSalvos();

  setChamadosSalvos(
    listaAtual.filter(c => c.id !== chamadoParaExcluir)
  );

  const listaAtualizada = getChamadosSalvos();
  renderChamadosSalvos(searchSalvos.value);

  // Se o modelo excluído era o que estava selecionado, ou lista ficou vazia, reseta o select
  if (listaAtualizada.length === 0 || selectedSalvos.textContent.trim() === document.getElementById('nomeModeloExcluir').textContent.replace(/"/g, '').trim()) {
    selectedSalvos.textContent = 'Selecione um chamado salvo...';
    selectedSalvos.classList.add('placeholder');
  }

  modalExcluirChamado.hide();

  showToast('🗑️ Modelo excluído!', 'aviso');
});