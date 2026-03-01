// ===============================
// グローバル変数
// ===============================
let uiText = {};
let msgText = {};
let eraList = [];

const owned = {
  素材: new Set(),
  技術: new Set(),
  道具: new Set()
};

const completed = new Set();

let dataList = [];
let recipes = [];
let gazoMap = {};

let popupQueue = [];
let popupActive = false;

let currentEraIndex = 0;

// ★ 図鑑用：現在の時代（null なら currentEraIndex を使う）
let viewEra = null;

// ★ 図鑑用：分類タブ（料理 / 素材 / 技術 / 道具）
let zukanTab = "料理";


// ===============================
// coloredName（★必須）
// ===============================
function coloredName(name, type) {
  const classMap = {
    "素材": "text-material",
    "技術": "text-tech",
    "道具": "text-tool",
    "料理": "text-cook",
    "時代": "text-era"
  };
  const cls = classMap[type] || "";
  return `<span class="${cls}">${name}</span>`;
}


// ===============================
// log（★必須）
// ===============================
function log(text) {
  const box = document.getElementById("log");
  box.innerHTML = text + "<br>" + box.innerHTML;
}


// ===============================
// index → 時代名
// ===============================
function eraNameByIndex(i) {
  return eraList[i]?.時代名 ?? "？？？";
}


// ===============================
// 時代ポップアップ
// ===============================
function showEraPopup(era) {
  const popup = document.getElementById("era-popup");
  const img = document.getElementById("era-popup-img");
  const title = document.getElementById("era-popup-title");
  const year = document.getElementById("era-popup-year");
  const desc = document.getElementById("era-popup-desc");
  const food = document.getElementById("era-popup-food");

  // いったん非表示のまま中身をセット
  popup.style.display = "none";

  img.src = "./data/" + era.ポップアップ画像;
  title.textContent = era.時代タイトル;
  year.textContent = `${era.開始年}〜${era.終了年}`;
  desc.textContent = era.時代説明;
  food.textContent = era.食文化影響;

  // 画像の読み込み完了後に表示（チラ見え防止）
  img.onload = () => {
    popup.style.display = "flex";
  };

  document.getElementById("era-popup-close").onclick = () => {
    popup.style.display = "none";
  };
}
// 背景クリックでも閉じる
document.getElementById("era-popup").onclick = () => {
  document.getElementById("era-popup").style.display = "none";
};


// ===============================
// CSV 読み込み
// ===============================
async function loadCSV() {
  try {
    const sozaiText = await fetch("./data/sozai.csv").then(r => r.text());
    const ryouriText = await fetch("./data/ryouri.csv").then(r => r.text());
    const gazoText = await fetch("./data/gazo.csv").then(r => r.text());

    dataList = parseCSV(sozaiText);
    recipes = parseCSV(ryouriText);

    parseCSV(gazoText).forEach(row => {
      gazoMap[row["料理名"]] = row["画像ファイル名"];
    });

    uiText = parseKeyValueCSV(await fetch("./data/ui.csv").then(r => r.text()));
    msgText = parseKeyValueCSV(await fetch("./data/message.csv").then(r => r.text()));
    eraList = parseEraCSV(await fetch("./data/era.csv").then(r => r.text()));

  } catch (e) {
    console.warn("CSV 読み込み失敗（file:// のため）");

    eraList = [{
      時代名: "縄文",
      開始年: "???",
      終了年: "???",
      ポップアップ画像: "",
      時代タイトル: "縄文時代",
      時代説明: "",
      食文化影響: ""
    }];

    uiText = {
      btn_material: "素材探索",
      btn_tech: "技術研究",
      btn_tool: "道具開発",
      btn_cook: "料理を作る！",
      btn_zukan: "図鑑へ",
      btn_next: "次の時代へ"
    };

    msgText = {};
    dataList = [];
    recipes = [];
    gazoMap = {};
  }

  applyUIText();
  renderHome();
  buildEraTabs();
  renderZukan();
}


// ===============================
// CSV パーサー
// ===============================
function parseCSV(text){
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(",");

  return lines.slice(1).map(line => {
    const cols = line.split(",");
    const obj = {};
    header.forEach((h,i)=> obj[h] = cols[i] ?? "");
    return obj;
  });
}

function parseKeyValueCSV(text){
  const lines = text.trim().split(/\r?\n/);
  const map = {};
  lines.slice(1).forEach(line => {
    const [key, text] = line.split(",");
    map[key] = text;
  });
  return map;
}

function parseEraCSV(text){
  const lines = text.trim().split(/\r?\n/);
  return lines.slice(1).map(line => {
    const cols = line.split(",");
    return {
      id: cols[0],
      時代名: cols[1],
      開始年: cols[2],
      終了年: cols[3],
      ポップアップ画像: cols[4],
      時代タイトル: cols[5],
      時代説明: cols[6],
      食文化影響: cols[7]
    };
  });
}


// ===============================
// UI テキスト適用
// ===============================
function applyUIText() {
  document.getElementById("btn-material").textContent = uiText["btn_material"];
  document.getElementById("btn-tech").textContent = uiText["btn_tech"];
  document.getElementById("btn-tool").textContent = uiText["btn_tool"];
  document.getElementById("btn-cook").textContent = uiText["btn_cook"];
  document.getElementById("btn-go-zukan").textContent = uiText["btn_zukan"];
  document.getElementById("btn-next-era").textContent = uiText["btn_next"];
}


// ===============================
// ホーム画面描画
// ===============================
function renderHome(){
  const era = eraList[currentEraIndex];

  document.getElementById("era").innerHTML =
    `${era.時代名}時代<br>（${era.開始年}〜${era.終了年}）`;

  const imageMap = {
    "縄文": "./data/01jomon.png",
    "弥生": "./data/02yayoi.png",
    "古墳・奈良": "./data/03kofunnara.png",
    "平安・鎌倉": "./data/04heiankamakura.png",
    "室町・戦国": "./data/05muromachisengoku.png",
    "江戸": "./data/06edo.png",
    "明治・大正": "./data/07meijitaisyo.png",
    "昭和・平成": "./data/08syowaheisei.png"
  };
  document.getElementById("era-image").src = imageMap[era.時代名];

  const cookBtn = document.getElementById("btn-cook");
  cookBtn.disabled = !canCookAnyRecipe();
  cookBtn.classList.toggle("enabled", canCookAnyRecipe());

  const nextBtn = document.getElementById("btn-next-era");
  nextBtn.disabled = !isEraCleared();
  nextBtn.classList.toggle("enabled", isEraCleared());
}


// ===============================
// 図鑑：時代タブ（旧仕様・安定版）
// ===============================
function buildEraTabs(){
  const tabs = document.getElementById("era-tabs");
  tabs.innerHTML = "";

  eraList.forEach((e,i)=>{
    const div = document.createElement("div");
    div.textContent = e.時代名;

    const active = viewEra ? (viewEra === e.時代名) : (currentEraIndex === i);
    div.className = "era-tab" + (active ? " active" : "");

    div.onclick = () => {
      viewEra = (e.時代名 === eraNameByIndex(currentEraIndex)) ? null : e.時代名;
      buildEraTabs();
      renderZukan();
    };

    tabs.appendChild(div);
  });
}


// ===============================
// 図鑑：一覧（旧仕様・安定版）
// ===============================
function renderZukan(){
  const eraName = viewEra || eraNameByIndex(currentEraIndex);
  const box = document.getElementById("zukan-info-box");
  box.innerHTML = "";

  // ★ 料理タブ（押せる）
  if (zukanTab === "料理") {
    const eraRecipes = recipes.filter(r => r.時代 === eraName);
    eraRecipes.forEach(r => {
      const opened = completed.has(r.料理);
      const div = document.createElement("div");

      div.className = "zukan-item" + (opened ? " cookable" : " disabled");
      div.textContent = opened ? r.料理 : "？？？";

      if (opened) {
        div.onclick = () => showPopupForRecipe(r);
      }

      box.appendChild(div);
    });
    return;
  }

  // ★ 素材・技術・道具（押せない）
  const eraItems = dataList.filter(d => d.分類 === zukanTab && d.時代 === eraName);
  const ownedSet = owned[zukanTab];

  eraItems.forEach(d => {
    const opened = ownedSet.has(d.id);
    const div = document.createElement("div");

    div.className = "zukan-item disabled";
    div.textContent = opened ? d.name : "？？？";

    box.appendChild(div);
  });
}


// ===============================
// 起動
// ===============================
loadCSV();