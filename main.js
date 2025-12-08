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
  document.body.classList.toggle('light-mode', theme !== 'dark'); // garante que light-mode exista
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
let VERSAO_ATUALIZACAO = '27-10-2025'; // atualize sempre que tiver novidade

const jaViu = localStorage.getItem(ATUALIZACAO_KEY);
if (jaViu !== VERSAO_ATUALIZACAO) {
  btnAtualizacoes.classList.add('btn-piscar');
}

btnAtualizacoes.addEventListener('click', () => {
  localStorage.setItem(ATUALIZACAO_KEY, VERSAO_ATUALIZACAO);
  btnAtualizacoes.classList.remove('btn-piscar');
});

// ---- Verifica automaticamente nova versão do site ----
fetch('/version.json')
  .then(res => res.json())
  .then(data => {
    if (data.versao !== VERSAO_ATUALIZACAO) {
      VERSAO_ATUALIZACAO = data.versao;
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
    if (problemCause.value) texto += `CAUSA DO PROBLEMA / DUVIDA: ${problemCause.value}\n\n`;
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

// ---- Formatação de texto reconhecido ----
function formatarTextoReconhecido(texto, campoVazio) {
  texto = texto
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
    .replace(/\bmanifesto\b/gi, 'MDF-e')
    .replace(/\bcupom fiscal\b/gi, 'NFC-e')
    .replace(/\bdanfe\b/gi, 'danfe')
    .replace(/\bicms\b/gi, 'icms')
    .replace(/\bpis\b/gi, 'pis')
    .replace(/\bconfins\b/gi, 'cofins')
    .replace(/\s+/g, ' ')
    .trim();

  // Primeira letra maiúscula se o campo estiver vazio
  if (campoVazio && texto.length > 0) {
    texto = texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  return texto;
}


// ---- Microfone (Web Speech API) ----
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
    let ultimoTexto = '';

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

    // --- CORREÇÃO: Evita repetição de texto ---
    recognition.onresult = (event) => {
      const startIndex = event.resultIndex || 0;
      let novoTrecho = '';

      for (let i = startIndex; i < event.results.length; i++) {
        novoTrecho += event.results[i][0].transcript;
      }

      novoTrecho = novoTrecho.trim();
      if (!novoTrecho) return;

      if (novoTrecho === ultimoTexto) return;

      const campoVazio = campo.value.trim().length === 0;
      novoTrecho = formatarTextoReconhecido(novoTrecho, campoVazio);

      campo.value += (campo.value ? ' ' : '') + novoTrecho;
      ultimoTexto = novoTrecho;
      autoResize(campo);
    };

    recognition.onend = () => {
      if (gravando) recognition.start();
    };
  });
} else {
  console.warn("Reconhecimento de voz não suportado neste navegador.");
}

fetch('errosComuns.json')
  .then(res => res.json())
  .then(erros => {
    const customSelect = document.getElementById('customSelect');
    const selected = customSelect.querySelector('.selected');
    const optionsContainer = customSelect.querySelector('.options');

    // Preenche as opções
    erros.forEach((item, index) => {
      const div = document.createElement('div');
      div.textContent = item.erro;
      div.dataset.index = index;
      optionsContainer.appendChild(div);

      div.addEventListener('click', () => {
        selected.textContent = item.erro;
        optionsContainer.classList.add('d-none');

        // Preenche os campos automaticamente
        document.getElementById('errorMessage').value = item.mensagem || '';
        document.getElementById('problemCause').value = item.causa || '';
        document.getElementById('resolution').value = item.resolucao || '';
        document.getElementById('clientFeedback').value = item.feedback || '';
        document.getElementById('humorSelection').value = item.humor || 'Bom';
        document.querySelector(`input[name="upsell"][value="${item.upsell}"]`).checked = true;
        document.querySelector(`input[name="captura"][value="${item.captura}"]`).checked = true;

        // 🔽 Adiciona automaticamente os valores preenchidos no cache
        ['errorMessage', 'problemCause', 'resolution', 'clientFeedback'].forEach(id => {
          const campo = document.getElementById(id);
          if (campo && campo.value.trim().length > 0) {
            const key = `cache_${campo.id}`;
            let values = JSON.parse(localStorage.getItem(key) || "[]");
            if (!values.includes(campo.value.trim())) {
              values.push(campo.value.trim());
              if (values.length > 20) values = values.slice(-20); // limite
              localStorage.setItem(key, JSON.stringify(values));
            }
          }
        });

        ['errorMessage','problemCause','resolution','clientFeedback'].forEach(id => {
          const el = document.getElementById(id);
          if (el) autoResize(el);
        });
      });
    });

    // Toggle dropdown
    selected.addEventListener('click', () => {
      optionsContainer.classList.toggle('d-none');
    });

    // Fechar dropdown se clicar fora
    document.addEventListener('click', (e) => {
      if (!customSelect.contains(e.target)) {
        optionsContainer.classList.add('d-none');
      }
    });
  })
.catch(err => console.error('Erro ao carregar erros comuns:', err));




document.addEventListener("DOMContentLoaded", () => {
  const campos = document.querySelectorAll("textarea, input[type='text']");

  campos.forEach(campo => {
    const key = `cache_${campo.id}`;
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    campo.parentNode.insertBefore(wrapper, campo);
    wrapper.appendChild(campo);

    const list = document.createElement("div");
    list.style.position = "absolute";
    list.style.top = "100%";
    list.style.left = "0";
    list.style.right = "0";
    list.style.borderRadius = "6px";
    list.style.zIndex = "1000";
    list.style.display = "none";
    list.style.maxHeight = "140px";
    list.style.overflowY = "auto";
    list.style.fontSize = "14px";
    list.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
    list.style.backdropFilter = "blur(4px)";
    wrapper.appendChild(list);

    // Detecta tema atual
    function applyListTheme() {
      const isDark = document.body.classList.contains("dark") || localStorage.getItem("theme") === "dark";
      if (isDark) {
        list.style.background = "#2c2c2c";
        list.style.color = "#fff";
        list.style.border = "1px solid #555";
        list.style.boxShadow = "0 2px 8px rgba(0,0,0,0.6)";
      } else {
        list.style.background = "#f5f9ff";
        list.style.color = "#0a0a0a";
        list.style.border = "1px solid #ccd9ff";
        list.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
      }
    }

    applyListTheme();
    const bodyObserverForList = new MutationObserver(() => applyListTheme());
    bodyObserverForList.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // --- Lógica de sugestões ---
    let currentIndex = -1; // índice da sugestão ativa

    function mostrarSugestoes(filtro = "") {
      const values = JSON.parse(localStorage.getItem(key) || "[]");
      list.innerHTML = "";

      const filtradas = values
        .filter(v => v.toLowerCase().includes(filtro.toLowerCase()))
        .slice(-20)
        .reverse();

      if (filtradas.length === 0) {
        list.style.display = "none";
        return;
      }

      filtradas.forEach((value, i) => {
        const item = document.createElement("div");
        item.textContent = value;
        item.style.padding = "6px 10px";
        item.style.cursor = "pointer";
        item.style.transition = "background 0.2s";

        item.addEventListener("mouseenter", () => {
          item.style.background = localStorage.getItem("theme") === "dark" ? "#333" : "#e6efff";
        });
        item.addEventListener("mouseleave", () => {
          if (i !== currentIndex) item.style.background = "transparent";
        });

        item.addEventListener("click", () => {
          campo.value = value;
          list.style.display = "none";
        });

        list.appendChild(item);
      });

      list.style.display = "block";
      currentIndex = -1;
    }

    campo.addEventListener("focus", () => mostrarSugestoes(campo.value));

    campo.addEventListener("input", () => {
      mostrarSugestoes(campo.value);
    });

    // --- Navegação com setas e Enter ---
    campo.addEventListener("keydown", e => {
      const items = Array.from(list.children);
      if (list.style.display === "none" || items.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        currentIndex = (currentIndex + 1) % items.length;
        atualizarDestaque(items);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        atualizarDestaque(items);
      } else if (e.key === "Enter") {
        if (currentIndex >= 0 && currentIndex < items.length) {
          e.preventDefault();
          campo.value = items[currentIndex].textContent;
          list.style.display = "none";
        }
      }
    });

    function atualizarDestaque(items) {
      items.forEach((item, i) => {
        const isDark = document.body.classList.contains("dark") || localStorage.getItem("theme") === "dark";
        if (i === currentIndex) {
          item.style.background = isDark ? "#444" : "#cfe0ff";
        } else {
          item.style.background = "transparent";
        }
      });
    }

    document.addEventListener("click", e => {
      if (!wrapper.contains(e.target)) list.style.display = "none";
    });

    campo.addEventListener("blur", () => {
      const value = campo.value.trim();
      if (value.length > 0) {
        let values = JSON.parse(localStorage.getItem(key) || "[]");
        if (!values.includes(value)) {
          values.push(value);
          if (values.length > 20) values = values.slice(-20);
          localStorage.setItem(key, JSON.stringify(values));
        }
      }
    });
  });

  // --- Toast ---
  function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  }

  // --- Botão limpar histórico ---
  const limparBtn = document.getElementById("limparHistorico");
  if (limparBtn) {
    limparBtn.addEventListener("click", () => {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith("cache_")) localStorage.removeItem(key);
      });
      showToast("🧹 Cache apagado!");
    });
  }
});

document.getElementById("btnCorrigirTudo").addEventListener("click", async () => {
    const campos = {
        docNumber: document.getElementById("docNumber")?.value || "",
        errorMessage: document.getElementById("errorMessage")?.value || "",
        problemCause: document.getElementById("problemCause")?.value || "",
        resolution: document.getElementById("resolution")?.value || "",
        duvidaCliente: document.getElementById("duvidaCliente")?.value || "",
        duvidaExplicacao: document.getElementById("duvidaExplicacao")?.value || "",
        contatoRelato: document.getElementById("contatoRelato")?.value || "",
        clientFeedback: document.getElementById("clientFeedback")?.value || "",
        upsellDesc: document.getElementById("upsellDesc")?.value || ""
    };

    // Monta o prompt para correção de TODOS os campos
    const prompt = `
Você é um corretor de texto profissional. Corrija ortografia, clareza e pontuação.
Não altere o significado e devolva em JSON limpo.

Texto para correção:
${JSON.stringify(campos, null, 2)}
    `;

    try {
        const resposta = await fetch("/api/gemini", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt })
        });

        const data = await resposta.json();

        // Extrai o texto corrigido da resposta do Gemini
        const output = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Tenta converter de volta para JSON
        let corrigido;
        try {
            corrigido = JSON.parse(output);
        } catch {
            alert("A IA retornou um formato inesperado. Tente novamente.");
            console.error("Retorno da IA:", output);
            return;
        }

        // Aplica os textos nos campos
        Object.entries(corrigido).forEach(([id, valor]) => {
            const campo = document.getElementById(id);
            if (campo) campo.value = valor;
        });

        // Feedback ao usuário
        alert("Textos corrigidos com sucesso!");

    } catch (erro) {
        console.error("Erro:", erro);
        alert("Falha ao corrigir textos.");
    }
});

