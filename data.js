// --- BỘ DỮ LIỆU TỪ VỰNG MẪU (HSK 1 - HSK 6) ---
const defaultHSKDataset = [
  { id: 101, zh: "你好", pinyin: "nǐ hǎo", vi: "Xin chào", en: "Hello", de: "Hallo", hsk: "HSK1" },
  { id: 102, zh: "谢谢", pinyin: "xièxie", vi: "Cảm ơn", en: "Thank you", de: "Danke", hsk: "HSK1" },
  { id: 103, zh: "再见", pinyin: "zàijiàn", vi: "Tạm biệt", en: "Goodbye", de: "Auf Wiedersehen", hsk: "HSK1" },
  { id: 201, zh: "机场", pinyin: "jīchǎng", vi: "Sân bay", en: "Airport", de: "Flughafen", hsk: "HSK2" },
  { id: 301, zh: "照顾", pinyin: "zhàogù", vi: "Chăm sóc", en: "Take care of", de: "Kümmern", hsk: "HSK3" },
  { id: 401, zh: "经济", pinyin: "jīngjì", vi: "Kinh tế", en: "Economy", de: "Wirtschaft", hsk: "HSK4" },
  { id: 501, zh: "积极", pinyin: "jījí", vi: "Tích cực", en: "Active", de: "Aktiv", hsk: "HSK5" },
  { id: 601, zh: "抽象", pinyin: "chōuxiàng", vi: "Trừu tượng", en: "Abstract", de: "Abstrakt", hsk: "HSK6" }
];

// --- QUẢN LÝ TRẠNG THÁI & LOCALSTORAGE ---
let vocabList = JSON.parse(localStorage.getItem('polylang_vocab'));
if (!vocabList || vocabList.length === 0) {
  vocabList = defaultHSKDataset;
  localStorage.setItem('polylang_vocab', JSON.stringify(vocabList));
}

let selectedHSK = ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'];
let currentCard = null;

document.addEventListener('DOMContentLoaded', () => {
  renderTable();
  loadSavedBackground();
});

// --- QUẢN LÝ ẢNH NỀN TOÀN CỤC ---
function setPresetBackground(url) {
  applyBackground(`url('${url}')`);
  localStorage.setItem('polylang_bg', `url('${url}')`);
  alert("Đã cập nhật ảnh nền thành công!");
}

function changeBackgroundFromFile(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const bgStyle = `url('${e.target.result}')`;
      applyBackground(bgStyle);
      localStorage.setItem('polylang_bg', bgStyle);
      alert("Đã tải và cập nhật ảnh nền từ máy thành công!");
    };
    reader.readAsDataURL(file);
  }
}

function applyBackground(bgValue) {
  const body = document.getElementById('app-body');
  body.style.backgroundImage = bgValue;
}

function resetBackground() {
  const body = document.getElementById('app-body');
  body.style.backgroundImage = 'none';
  localStorage.removeItem('polylang_bg');
  alert("Đã đặt lại nền mặc định!");
}

function loadSavedBackground() {
  const savedBg = localStorage.getItem('polylang_bg');
  if (savedBg) {
    applyBackground(savedBg);
  }
}

// --- QUẢN LÝ API KEY GROQ (Lưu an toàn ở trình duyệt) ---
function setGroqKey() {
  const currentKey = localStorage.getItem('polylang_groq_key') || '';
  const newKey = prompt("Nhập Groq API Key của bạn (Lấy miễn phí tại console.groq.com):", currentKey);
  if (newKey !== null) {
    localStorage.setItem('polylang_groq_key', newKey.trim());
    if (newKey.trim()) {
      alert("Đã lưu Groq API Key thành công trên trình duyệt của bạn!");
    } else {
      alert("Đã xóa API Key!");
    }
  }
}

// --- CHUYỂN TAB (3 Tabs) ---
function switchTab(tab) {
  const btnInput = document.getElementById('btn-tab-input');
  const btnQuiz = document.getElementById('btn-tab-quiz');
  const btnBg = document.getElementById('btn-tab-background');

  const tabInput = document.getElementById('tab-input');
  const tabQuiz = document.getElementById('tab-quiz');
  const tabBg = document.getElementById('tab-background');

  const inactiveClass = "py-4 px-2 text-slate-500 hover:text-indigo-600 transition-colors text-xs md:text-base font-semibold";
  const activeClass = "py-4 px-2 tab-active transition-colors text-xs md:text-base font-semibold";

  btnInput.className = inactiveClass;
  btnQuiz.className = inactiveClass;
  btnBg.className = inactiveClass;

  tabInput.classList.add('hidden');
  tabQuiz.classList.add('hidden');
  tabBg.classList.add('hidden');

  if (tab === 'input') {
    btnInput.className = activeClass;
    tabInput.classList.remove('hidden');
  } else if (tab === 'quiz') {
    btnQuiz.className = activeClass;
    tabQuiz.classList.remove('hidden');
    startQuiz();
  } else if (tab === 'background') {
    btnBg.className = activeClass;
    tabBg.classList.remove('hidden');
  }
}

// --- GỌI GROQ API TỰ ĐỘNG ĐIỀN DỮ LIỆU ---
async function translateWithGroq() {
  const textVi = document.getElementById('vi').value.trim();
  if (!textVi) {
    alert("Vui lòng nhập từ tiếng Việt trước khi gọi AI!");
    document.getElementById('vi').focus();
    return;
  }

  // Lấy API Key từ localStorage của trình duyệt
  let apiKey = localStorage.getItem('polylang_groq_key');
  if (!apiKey) {
    apiKey = prompt("Chưa tìm thấy Groq API Key! Vui lòng nhập API Key của bạn (Lấy miễn phí tại console.groq.com):");
    if (!apiKey) return;
    localStorage.setItem('polylang_groq_key', apiKey.trim());
  }

  const promptText = `Dịch từ tiếng Việt sau sang định dạng JSON thuần túy:
- zh: Chữ Hán giản thể
- pinyin: Phiên âm Pinyin đầy đủ dấu
- en: Tiếng Anh chuẩn
- de: Tiếng Đức chuẩn
- hsk: Gợi ý cấp độ HSK phù hợp nhất (chỉ trả về dạng "HSK1", "HSK2", "HSK3", "HSK4", "HSK5" hoặc "HSK6")

Từ tiếng Việt cần dịch là: "${textVi}"`;

  const aiBtn = document.getElementById('btn-ai-translate');
  const oldHTML = aiBtn.innerHTML;

  try {
    aiBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> AI đang dịch...`;
    aiBtn.disabled = true;
    
    // Gọi Groq API với model chuẩn llama-3.1-8b-instant siêu nhanh và ổn định
    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: promptText }],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    if(data.error) throw new Error(data.error.message);

    let rawResponse = data.choices[0].message.content;
    const result = JSON.parse(rawResponse);

    document.getElementById('zh').value = result.zh || '';
    document.getElementById('pinyin').value = result.pinyin || '';
    document.getElementById('en').value = result.en || '';
    document.getElementById('de').value = result.de || '';
    document.getElementById('hsk').value = result.hsk || 'HSK1';

  } catch (err) {
    alert("Lỗi gọi Groq API: " + err.message + "\n(Hãy kiểm tra lại Key hoặc bấm vào biểu tượng chìa khóa trên thanh menu để cập nhật key mới).");
  } finally {
    aiBtn.innerHTML = oldHTML;
    aiBtn.disabled = false;
  }
}

// --- QUẢN LÝ DỮ LIỆU & BẢNG ---
function addVocabulary(e) {
  e.preventDefault();
  const newItem = {
    id: Date.now(),
    vi: document.getElementById('vi').value.trim(),
    zh: document.getElementById