"use strict";

const COUNT = 256;
const PIP_COUNT = 9;
const ROLL_DURATION = 720;
const ROLL_STEP = 90;

const elements = {
  generateBtn: document.getElementById("generate-btn"),
  copyBtn: document.getElementById("copy-btn"),
  clearBtn: document.getElementById("clear-btn"),
  status: document.getElementById("status"),
  numbersGrid: document.getElementById("numbers-grid"),
};

let sequence = [];
let rollInterval = null;
let settleTimer = null;
let rollToken = 0;

/** Gera um único valor inteiro entre 1 e 6, inclusive. */
function generateNumber() {
  return Math.floor(Math.random() * 6) + 1;
}

/** Gera exatamente COUNT valores aleatórios. */
function generateSequence() {
  return Array.from({ length: COUNT }, generateNumber);
}

/** Cria um elemento com classe e texto opcionais. */
function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

/** Define o lado visível de um dado. */
function setDieValue(die, value) {
  die.dataset.value = String(value);
  die.setAttribute("aria-label", `Dado ${die.dataset.position}: ${value}`);
}

/** Cria um dado com os nove pontos posicionados em grelha 3x3. */
function createDie(value, index) {
  const die = createElement("span", "die");
  die.dataset.position = String(index + 1);
  setDieValue(die, value);

  for (let i = 0; i < PIP_COUNT; i += 1) {
    die.appendChild(createElement("i", "pip"));
  }

  return die;
}

/** Apresenta os dados na grelha e devolve os elementos criados. */
function renderDice(numbers) {
  if (!numbers.length) {
    elements.numbersGrid.replaceChildren(
      createElement("p", "empty-message", "Clique em «Rolar 256 Dados» para começar.")
    );
    return [];
  }

  const fragment = document.createDocumentFragment();
  const dice = numbers.map((value, index) => {
    const die = createDie(value, index);
    fragment.appendChild(die);
    return die;
  });

  elements.numbersGrid.replaceChildren(fragment);
  return dice;
}

/** Atualiza o estado dos botões conforme a rolagem. */
function updateButtons(hasDice, rolling) {
  elements.generateBtn.disabled = rolling;
  elements.copyBtn.disabled = rolling || !hasDice;
  elements.clearBtn.disabled = rolling || !hasDice;
}

/** Define a mensagem de estado com a respetiva categoria visual. */
function setStatus(message, type = "") {
  elements.status.textContent = message;
  elements.status.className = `status${type ? ` ${type}` : ""}`;
}

/** Cancela qualquer rolagem em curso. */
function stopRoll() {
  rollToken += 1;
  if (rollInterval !== null) clearInterval(rollInterval);
  if (settleTimer !== null) clearTimeout(settleTimer);
  rollInterval = null;
  settleTimer = null;
}

/** Rola os dados e revela o resultado final de cada um. */
function startRoll(finalNumbers) {
  stopRoll();
  const token = rollToken;
  sequence = finalNumbers.slice();

  const dice = renderDice(sequence);
  dice.forEach((die) => { die.className = "die rolling"; });
  updateButtons(true, true);
  setStatus("A rolar os dados…");

  rollInterval = setInterval(() => {
    if (token !== rollToken) return;
    dice.forEach((die) => setDieValue(die, generateNumber()));
  }, ROLL_STEP);

  settleTimer = setTimeout(() => {
    if (token !== rollToken) return;
    stopRoll();
    dice.forEach((die, index) => {
      die.className = "die";
      setDieValue(die, finalNumbers[index]);
    });
    updateButtons(true, false);
    setStatus(`${COUNT} dados gerados.`, "success");
  }, ROLL_DURATION);
}

/** Cópia alternativa para contextos onde a Clipboard API não está disponível. */
function legacyCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Não foi possível copiar.");
}

/** Copia os valores finais para a área de transferência com fallback. */
async function copySequence() {
  if (!sequence.length) return;

  const text = sequence.join(", ");

  try {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        setStatus("Valores copiados para a área de transferência.", "success");
        return;
      } catch (error) {
        // Tenta o método alternativo abaixo.
      }
    }
    legacyCopy(text);
    setStatus("Valores copiados para a área de transferência.", "success");
  } catch (error) {
    setStatus("Não foi possível copiar automaticamente. Selecione os valores manualmente.", "error");
  }
}

elements.generateBtn.addEventListener("click", () => {
  startRoll(generateSequence());
});

elements.copyBtn.addEventListener("click", copySequence);

elements.clearBtn.addEventListener("click", () => {
  stopRoll();
  sequence = [];
  renderDice(sequence);
  updateButtons(false, false);
  setStatus("Dados removidos. Pronto para uma nova rolagem.");
});

renderDice(sequence);
updateButtons(false, false);
