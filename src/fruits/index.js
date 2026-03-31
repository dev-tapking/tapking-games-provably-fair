class ShaUtils {
  static hmacSha512 = CryptoJS.HmacSHA512;
  static sha256 = CryptoJS.SHA256;
}

const FRUITS_GEM_TYPE = [
  "GEM_1",
  "GEM_2",
  "GEM_3",
  "GEM_4",
  "GEM_5",
  "GEM_6",
  "GEM_7",
];

const FRUITS_GEM_TYPE_TO_GEM_COLOR_MAP = {
  GEM_1: "#4CAF50", // green
  GEM_2: "#2196F3", // blue
  GEM_3: "#FF9800", // orange
  GEM_4: "#F44336", // red
  GEM_5: "#FFEB3B", // yellow
  GEM_6: "#E91E63", // magenta/pink
  GEM_7: "#9C27B0", // purple
};

class RoundSettler {
  static SHA512_HASH_LENGTH = 128;
  static FRUITS_COUNT = 5;
  static HEX_CHARS_PER_FRUIT = Math.floor(this.SHA512_HASH_LENGTH / this.FRUITS_COUNT); // 25

  /**
   * Algorithm:
   * 1. Split hash into FRUITS_COUNT chunks (each HEX_CHARS_PER_FRUIT characters)
   * 2. For each chunk, take first 8 hex characters
   * 3. Convert to decimal number
   * 4. Use modulo to get fruit type index
   */
  static generateFruitsFromHash(hash) {
    if (hash.length !== this.SHA512_HASH_LENGTH) {
      throw new Error(`Invalid hash size: ${hash.length}. It should be equal to ${this.SHA512_HASH_LENGTH}`);
    }

    const totalTypes = FRUITS_GEM_TYPE.length;

    return Array.from({ length: this.FRUITS_COUNT }, (_, index) => {
      const startIndex = index * this.HEX_CHARS_PER_FRUIT;
      const endIndex = (index + 1) * this.HEX_CHARS_PER_FRUIT;
      const chunk = hash.substring(startIndex, endIndex);

      // Take first 8 hex characters from chunk
      const hexSample = chunk.substring(0, 8);
      const number = parseInt(hexSample, 16);
      const fruitIndex = number % totalTypes;

      return FRUITS_GEM_TYPE[fruitIndex];
    });
  }

  static getData(serverSeed, nonce, clientSeed) {
    const message = `${clientSeed}:${nonce}`;
    const hash = ShaUtils.hmacSha512(message, serverSeed).toString();

    const fruits = this.generateFruitsFromHash(hash);

    return {
      sha256: ShaUtils.sha256(serverSeed).toString(),
      hash,
      fruits
    };
  }
}

let appState = {
  serverSeed: '',
  nonce: '',
  clientSeed: '',
  sha256: '',
  fruits: null,
  hash: ''
};

function updateResults() {
  if (!appState.serverSeed || !appState.nonce || !appState.clientSeed) {
    appState.sha256 = '';
    appState.hash = '';
    appState.fruits = null;
    renderResults();
    return;
  }

  try {
    const data = RoundSettler.getData(appState.serverSeed, appState.nonce, appState.clientSeed);
    appState.sha256 = data.sha256;
    appState.hash = data.hash;
    appState.fruits = data.fruits;
  } catch (error) {
    console.error('Error calculating results:', error);
    appState.sha256 = '';
    appState.hash = '';
    appState.fruits = null;
  }

  renderResults();
}

function createFruitElement(fruitType, index) {
  const fruitDiv = document.createElement('div');
  fruitDiv.className = 'fruit';

  const color = FRUITS_GEM_TYPE_TO_GEM_COLOR_MAP[fruitType] || 'gray';
  fruitDiv.style.backgroundColor = color;
  fruitDiv.setAttribute('data-gem-type', fruitType);
  fruitDiv.setAttribute('data-gem-color', color);

  fruitDiv.textContent = `${index + 1}. ${fruitType}`;
  return fruitDiv;
}

function createResultRow(fruits, hash) {
  const resultWrapper = document.createElement('div');
  resultWrapper.className = 'result-wrapper';

  const fruitsContainer = document.createElement('div');
  fruitsContainer.className = 'fruits-container';

  fruits.forEach((fruit, index) => {
    const fruitElement = createFruitElement(fruit, index);
    fruitsContainer.appendChild(fruitElement);
  });

  const hashDiv = document.createElement('div');
  hashDiv.className = 'hash-part';
  hashDiv.textContent = hash;

  resultWrapper.appendChild(fruitsContainer);
  resultWrapper.appendChild(hashDiv);

  return resultWrapper;
}

function renderResults() {
  const sha256Input = document.getElementById('sha256-input');
  if (sha256Input) {
    sha256Input.value = appState.sha256;
  }

  const resultsContainer = document.getElementById('results-container');

  if (appState.fruits === null) {
    resultsContainer.style.display = 'none';
    return;
  }

  resultsContainer.style.display = 'flex';
  const resultsWrapper = document.getElementById('results-wrapper');

  resultsWrapper.innerHTML = '';

  const helperText = document.createElement('div');
  helperText.className = 'helper-text';

  const step = document.createElement('div');
  step.className = 'step';
  step.innerHTML = `
    <h4>Fruits are calculated following these steps:</h4>
    <div><b>Step 1:</b> Calculate <strong>HMAC-SHA512</strong> of message "clientSeed:nonce" with key serverSeed</div>
    <div><b>Step 2:</b> Split hash into <strong>${RoundSettler.FRUITS_COUNT} chunks</strong> (each ${RoundSettler.HEX_CHARS_PER_FRUIT} hex characters)</div>
    <div><b>Step 3:</b> For each chunk, take first <strong>8 hex characters</strong></div>
    <div><b>Step 4:</b> Convert hex to decimal number</div>
    <div><b>Step 5:</b> Calculate <strong>fruitIndex = number % totalTypes</strong></div>
    <div><b>Step 6:</b> Get fruit type from <strong>FRUITS_GEM_TYPE[fruitIndex]</strong></div>
  `;

  helperText.appendChild(step);

  resultsWrapper.appendChild(helperText);

  const resultRow = createResultRow(appState.fruits, appState.hash);
  resultsWrapper.appendChild(resultRow);
}

function handleServerSeedChange(event) {
  appState.serverSeed = event.target.value;
  updateResults();
}

function handleNonceChange(event) {
  appState.nonce = event.target.value;
  updateResults();
}

function handleClientSeedChange(event) {
  appState.clientSeed = event.target.value;
  updateResults();
}

function initApp() {
  const serverSeedInput = document.getElementById('server-seed-input');
  const nonceInput = document.getElementById('nonce-input');
  const clientSeedInput = document.getElementById('client-seed-input');

  serverSeedInput.addEventListener('input', handleServerSeedChange);
  nonceInput.addEventListener('input', handleNonceChange);
  clientSeedInput.addEventListener('input', handleClientSeedChange);

  renderResults();
}

document.addEventListener('DOMContentLoaded', initApp);
