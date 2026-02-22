// ===============================
// 日本語専用：UIテキスト
// ===============================
let uiText = {};
let msgText = {};
let eraList = [];

// ===============================
// 所持データ
// ===============================
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
let viewEra = null;
let zukanTab = "素材";

// ===============================
// CSV 読み込み
// ===============================
async function loadCSV() {
  const sozaiText = await fetch("./data/sozai.csv").then(r => r.text());
  const ryouriText = await fetch("./data/ryouri.csv").then(r => r.text());
  const gazoText = await fetch("./data/gazo.csv").then(r => r.text());

  dataList = parseCSV(sozaiText);
  recipes = parseCSV(ryouriText);

  parseCSV(gazoText).forEach(row => {
    gazoMap[row["料理名"]] = row["画像ファイル名"];
  });

  // 日本語 UI
  uiText = parseKeyValueCSV(await fetch("./data/ui.csv").then(r => r.text()));
  msgText = parseKeyValueCSV(await fetch("./data/message.csv").then(r => r.text()));
  eraList = parseEraCSV(await fetch("./data/era.csv").then(r => r.text()));

  applyUIText();
  renderHome();
  buildEraTabs();
  renderZukan();

  // ★ 最初の時代ポップアップ
  showEraPopup(eraList[currentEraIndex]);
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

// key,text 用
function parseKeyValueCSV(text){
  const lines = text.trim().split(/\r?\n/);
  const map = {};
  lines.slice(1).forEach(line => {
    const [key, text] = line.split(",");
    map[key] = text;
  });
  return map;
}

// 拡張版 era.csv 用
function parseEraCSV(text){
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(",");

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
  document.getElementById("btn-go-home").textContent = uiText["btn_home"];
  document.getElementById("btn-next-era").textContent = uiText["btn_next"];
}

// ===============================
// 時代名
// ===============================
function eraNameByIndex(i) {
  return eraList[i]?.時代名 ?? "？？？";
}

// ===============================
// ログ
// ===============================
function log(msg){
  const el = document.getElementById("log");
  el.innerHTML = msg + "<br>" + el.innerHTML;
}

// ===============================
// 必要ID
// ===============================
function needID(str) {
  if (!str) return [];
  return str.split("・").filter(x => x);
}

// ===============================
// 時代クリア判定
// ===============================
function isEraCleared() {
  const era = eraNameByIndex(currentEraIndex);

  const items = dataList.filter(d => d.時代 === era);

  const needM = items.filter(d => d.分類 === "素材").map(d => d.id);
  const needT = items.filter(d => d.分類 === "技術").map(d => d.id);
  const needD = items.filter(d => d.分類 === "道具").map(d => d.id);

  const eraRecipes = recipes.filter(r => r.時代 === era).map(r => r.料理);

  return (
    needM.every(x => owned.素材.has(x)) &&
    needT.every(x => owned.技術.has(x)) &&
    needD.every(x => owned.道具.has(x)) &&
    eraRecipes.every(x => completed.has(x))
  );
}

// ===============================
// 料理作成可能判定
// ===============================
function canCookAnyRecipe(){
  const era = eraNameByIndex(currentEraIndex);

  return recipes
    .filter(r => r.時代 === era && !completed.has(r.料理))
    .some(r => {
      const needM = needID(r.素材ID);
      const needT = needID(r.技術ID);
      const needD = needID(r.道具ID);

      return (
        needM.every(x => owned.素材.has(x)) &&
        needT.every(x => owned.技術.has(x)) &&
        needD.every(x => owned.道具.has(x))
      );
    });
}

// ===============================
// ホーム画面
// ===============================
function renderHome(){
  const era = eraList[currentEraIndex];

  // ★ 時代名＋西暦を改行して表示
  document.getElementById("era").innerHTML =
    `${era.時代名}時代<br>（${era.開始年}〜${era.終了年}）`;

  const imageMap = {
    "縄文": "./data/01jomon.png",
    "弥生": "./data/02yayoi.png",
    "古墳・奈良": "./data/03kofunnara.png",
    "平安・鎌倉": "./data/04heiankamakura.png",
    "室町戦国": "./data/05muromachiadutimomoyama.png",
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
// 図鑑：時代タブ
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
// 図鑑：一覧
// ===============================
function renderZukan(){
  const eraName = viewEra || eraNameByIndex(currentEraIndex);
  const box = document.getElementById("zukan-info-box");
  box.innerHTML = "";

  if (zukanTab === "料理") {
    const eraRecipes = recipes.filter(r => r.時代 === eraName);
    eraRecipes.forEach(r => {
      const opened = completed.has(r.料理);
      const div = document.createElement("div");

      div.textContent = opened ? r.料理 : "？？？";

      if (opened) {
        div.style.cursor = "pointer";
        div.onclick = () => {
          showPopupForRecipe(r);
        };
      }

      box.appendChild(div);
    });
    return;
  }

  const eraItems = dataList.filter(d => d.分類 === zukanTab && d.時代 === eraName);
  const ownedSet = owned[zukanTab];

  eraItems.forEach(d => {
    const opened = ownedSet.has(d.id);
    const div = document.createElement("div");
    div.textContent = opened ? d.name : "？？？";
    box.appendChild(div);
  });
}

// ===============================
// 図鑑：分類タブ
// ===============================
document.querySelectorAll("#zukan-screen .info-tab").forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll("#zukan-screen .info-tab")
      .forEach(t => t.classList.remove("active"));

    tab.classList.add("active");
    zukanTab = tab.dataset.type;
    renderZukan();
  };
});

// ===============================
// 行動ボタン
// ===============================
document.getElementById("btn-material").onclick = () => {
  const era = eraNameByIndex(currentEraIndex);
  const candidates = dataList.filter(d =>
    d.分類 === "素材" &&
    d.時代 === era &&
    !owned.素材.has(d.id)
  );

  if (candidates.length === 0) {
    log(msgText["no_more_material"]);
    return;
  }

  const item = candidates[Math.floor(Math.random() * candidates.length)];
  owned.素材.add(item.id);

  log(`${msgText["found_material"]}<span class="item-name">${item.name}</span><br>${item.メッセージ}`);
  renderHome();
  renderZukan();
};

document.getElementById("btn-tech").onclick = () => {
  const era = eraNameByIndex(currentEraIndex);
  const candidates = dataList.filter(d =>
    d.分類 === "技術" &&
    d.時代 === era &&
    !owned.技術.has(d.id)
  );

  if (candidates.length === 0) {
    log(msgText["no_more_tech"]);
    return;
  }

  const item = candidates[Math.floor(Math.random() * candidates.length)];
  owned.技術.add(item.id);

  log(`${msgText["learn_tech"]}<span class="item-name">${item.name}</span><br>${item.メッセージ}`);
  renderHome();
  renderZukan();
};

document.getElementById("btn-tool").onclick = () => {
  const era = eraNameByIndex(currentEraIndex);
  const candidates = dataList.filter(d =>
    d.分類 === "道具" &&
    d.時代 === era &&
    !owned.道具.has(d.id)
  );

  if (candidates.length === 0) {
    log(msgText["no_more_tool"]);
    return;
  }

  const item = candidates[Math.floor(Math.random() * candidates.length)];
  owned.道具.add(item.id);

  log(`${msgText["develop_tool"]}<span class="item-name">${item.name}</span><br>${item.メッセージ}`);
  renderHome();
  renderZukan();
};

// ===============================
// 料理作成
// ===============================
document.getElementById("btn-cook").onclick = () => {
  const era = eraNameByIndex(currentEraIndex);

  const available = recipes.filter(r => {
    const needM = needID(r.素材ID);
    const needT = needID(r.技術ID);
    const needD = needID(r.道具ID);

    return (
      r.時代 === era &&
      !completed.has(r.料理) &&
      needM.every(x => owned.素材.has(x)) &&
      needT.every(x => owned.技術.has(x)) &&
      needD.every(x => owned.道具.has(x))
    );
  });

  if (available.length === 0) {
    log(msgText["no_more_recipe"]);
    return;
  }

  available.forEach(r => {
    completed.add(r.料理);

    log(`${msgText["complete_recipe"]}<span class="recipe-name">${r.料理}</span><br> → ${r.メッセージ}`);

    popupQueue.push(r);
  });

  renderHome();
  renderZukan();

  showNextPopup();
};

// ===============================
// ポップアップ（キュー処理）
// ===============================
function showNextPopup() {
  if (popupActive) return;
  if (popupQueue.length === 0) return;

  popupActive = true;
  const r = popupQueue.shift();
  showPopupForRecipe(r);
}

// ===============================
// 料理ポップアップ
// ===============================
function showPopupForRecipe(r) {
  popupActive = true;

  const popup = document.getElementById("popup");
  const img = document.getElementById("popup-img");
  const title = document.getElementById("popup-title");
  const detail = document.getElementById("popup-detail");

  img.src = "./data/" + gazoMap[r.料理];
  title.textContent = r.料理;

  const needM = needID(r.素材ID).map(id => getNameById(id)).join("・") || "なし";
  const needT = needID(r.技術ID).map(id => getNameById(id)).join("・") || "なし";
  const needD = needID(r.道具ID).map(id => getNameById(id)).join("・") || "なし";

  detail.innerHTML =
    `素材：${needM}<br>` +
    `技術：${needT}<br>` +
    `道具：${needD}<br><br>` +
    `${r.メッセージ}`;

  popup.style.display = "flex";
}

function getNameById(id) {
  const item = dataList.find(d => d.id === id);
  return item ? item.name : id;
}

// ===============================
// 料理ポップアップ閉じる
// ===============================
document.getElementById("popup").onclick = () => {
  document.getElementById("popup").style.display = "none";
  popupActive = false;

  if (popupQueue.length > 0) {
    showNextPopup();
  }
};

// ===============================
// 次の時代へ
// ===============================
document.getElementById("btn-next-era").onclick = () => {
  if (currentEraIndex < eraList.length - 1) {
    currentEraIndex++;
    viewEra = null;

    log(`${msgText["era_advance"]}${eraNameByIndex(currentEraIndex)}`);

    renderHome();
    buildEraTabs();
    renderZukan();

    // ★ 時代ポップアップ表示
    showEraPopup(eraList[currentEraIndex]);

  } else {
    log("これ以上の時代はありません。");
  }
};

// ===============================
// 時代ポップアップ
// ===============================
function showEraPopup(era) {
  const box = document.getElementById("era-popup");

  document.getElementById("era-popup-img").src = "./data/" + era.ポップアップ画像;
  document.getElementById("era-popup-title").textContent = era.時代タイトル;

  // ★ 西暦表示
  document.getElementById("era-popup-year").textContent =
    `（${era.開始年}〜${era.終了年}）`;

  document.getElementById("era-popup-desc").textContent = era.時代説明;
  document.getElementById("era-popup-food").textContent = era.食文化影響;

  box.style.display = "flex";
}

document.getElementById("era-popup").onclick = () => {
  document.getElementById("era-popup").style.display = "none";
};

// ===============================
// 画面切り替え
// ===============================
document.getElementById("btn-go-zukan").onclick = () => {
  document.getElementById("home-screen").classList.add("hidden");
  document.getElementById("zukan-screen").classList.remove("hidden");
  buildEraTabs();
  renderZukan();
};

document.getElementById("btn-go-home").onclick = () => {
  document.getElementById("zukan-screen").classList.add("hidden");
  document.getElementById("home-screen").classList.remove("hidden");
};

// ===============================
// 起動
// ===============================
loadCSV();