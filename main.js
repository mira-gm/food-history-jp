// ===============================
// パート2：ゲームロジック（ID判定版 + ポップアップ + 図鑑クリック対応）
// ===============================

// ---- 時代一覧 ----
const eras = [
  "縄文","弥生","古墳・奈良","平安・鎌倉",
  "室町・戦国","江戸","明治・大正","昭和・平成"
];

let currentEraIndex = 0;
let viewEra = null;
let zukanTab = "素材";

// 所持データ（IDで管理）
const owned = {
  素材: new Set(),
  技術: new Set(),
  道具: new Set()
};

// 完成した料理（料理名で管理）
const completed = new Set();

// CSVデータ
let dataList = [];   // 素材・技術・道具（ID付き）
let recipes = [];    // 料理（ID付き）
let gazoMap = {};    // 料理名 → 画像ファイル名

// ポップアップキュー
let popupQueue = [];
let popupActive = false;

// ===============================
// CSV 読み込み
// ===============================
async function loadCSV() {
  const sozaiText = await fetch("./data/sozai.csv").then(r => r.text());
  const ryouriText = await fetch("./data/ryouri.csv").then(r => r.text());
  const gazoText = await fetch("./data/gazo.csv").then(r => r.text());

  dataList = parseCSV(sozaiText);
  recipes = parseCSV(ryouriText);

  // gazo.csv → マップ化
  parseCSV(gazoText).forEach(row => {
    gazoMap[row["料理名"]] = row["画像ファイル名"];
  });

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

// ===============================
// ログ
// ===============================
function log(msg){
  const el = document.getElementById("log");
  el.innerHTML = msg + "<br>" + el.innerHTML;
}

// ===============================
// 空欄は条件なしとして扱う
// ===============================
function needID(str) {
  if (!str) return [];
  return str.split("・").filter(x => x);
}

// ===============================
// 時代クリア判定（IDで判定）
// ===============================
function isEraCleared() {
  const era = eras[currentEraIndex];

  const items = dataList.filter(d => d.時代 === era);

  const needM = items.filter(d => d.分類 === "素材").map(d => d.id);
  const needT = items.filter(d => d.分類 === "技術").map(d => d.id);
  const needD = items.filter(d => d.分類 === "道具").map(d => d.id);

  const eraRecipes = recipes.filter(r => r.時代 === era).map(r => r.料理);

  const okM = needM.every(x => owned.素材.has(x));
  const okT = needT.every(x => owned.技術.has(x));
  const okD = needD.every(x => owned.道具.has(x));
  const okR = eraRecipes.every(x => completed.has(x));

  return okM && okT && okD && okR;
}

// ===============================
// 料理作成可能判定（IDで判定）
// ===============================
function canCookAnyRecipe(){
  const era = eras[currentEraIndex];

  return recipes
    .filter(r => r.時代 === era && !completed.has(r.料理))
    .some(r => {
      const needM = needID(r.素材ID);
      const needT = needID(r.技術ID);
      const needD = needID(r.道具ID);

      const okM = needM.every(x => owned.素材.has(x));
      const okT = needT.every(x => owned.技術.has(x));
      const okD = needD.every(x => owned.道具.has(x));

      return okM && okT && okD;
    });
}

// ===============================
// ホーム画面
// ===============================
function renderHome(){
  const eraName = eras[currentEraIndex];
  document.getElementById("era").textContent = "時代：" + eraName;

  const imageMap = {
    "縄文": "./data/01jomon.png",
    "弥生": "./data/02yayoi.png",
    "古墳・奈良": "./data/03kofunnara.png",
    "平安・鎌倉": "./data/04heiankamakura.png",
    "室町・安土桃山": "./data/05muromachisengoku.png",
    "江戸": "./data/06edo.png",
    "明治・大正": "./data/07meijitaisyo.png",
    "昭和・平成": "./data/08syowaheisei.png"
  };
  document.getElementById("era-image").src = imageMap[eraName];

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

  eras.forEach((e,i)=>{
    const div = document.createElement("div");
    div.textContent = e;

    const active = viewEra ? (viewEra === e) : (currentEraIndex === i);
    div.className = "era-tab" + (active ? " active" : "");

    div.onclick = () => {
      viewEra = (e === eras[currentEraIndex]) ? null : e;
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
  const eraName = viewEra || eras[currentEraIndex];
  const box = document.getElementById("zukan-info-box");
  box.innerHTML = "";

  // ▼ 料理タブ
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

  // ▼ 素材・技術・道具
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
// 行動ボタン（IDで管理）
// ===============================
document.getElementById("btn-material").onclick = () => {
  const era = eras[currentEraIndex];
  const candidates = dataList.filter(d =>
    d.分類 === "素材" &&
    d.時代 === era &&
    !owned.素材.has(d.id)
  );

  if (candidates.length === 0) {
    log("この時代の素材はすべて発見済み。");
    return;
  }

  const item = candidates[Math.floor(Math.random() * candidates.length)];
  owned.素材.add(item.id);

  log(`素材発見：<span class="item-name">${item.name}</span><br>${item.メッセージ}`);
  renderHome();
  renderZukan();
};

document.getElementById("btn-tech").onclick = () => {
  const era = eras[currentEraIndex];
  const candidates = dataList.filter(d =>
    d.分類 === "技術" &&
    d.時代 === era &&
    !owned.技術.has(d.id)
  );

  if (candidates.length === 0) {
    log("この時代の技術はすべて習得済み。");
    return;
  }

  const item = candidates[Math.floor(Math.random() * candidates.length)];
  owned.技術.add(item.id);

  log(`技術習得：<span class="item-name">${item.name}</span><br>${item.メッセージ}`);
  renderHome();
  renderZukan();
};

document.getElementById("btn-tool").onclick = () => {
  const era = eras[currentEraIndex];
  const candidates = dataList.filter(d =>
    d.分類 === "道具" &&
    d.時代 === era &&
    !owned.道具.has(d.id)
  );

  if (candidates.length === 0) {
    log("この時代の道具はすべて開発済み。");
    return;
  }

  const item = candidates[Math.floor(Math.random() * candidates.length)];
  owned.道具.add(item.id);

  log(`道具開発：<span class="item-name">${item.name}</span><br>${item.メッセージ}`);
  renderHome();
  renderZukan();
};

// ===============================
// 料理作成（IDで判定 + ポップアップ）
// ===============================
document.getElementById("btn-cook").onclick = () => {
  const era = eras[currentEraIndex];

  const available = recipes.filter(r => {
    const needM = needID(r.素材ID);
    const needT = needID(r.技術ID);
    const needD = needID(r.道具ID);

    const okM = needM.every(x => owned.素材.has(x));
    const okT = needT.every(x => owned.技術.has(x));
    const okD = needD.every(x => owned.道具.has(x));

    return (
      r.時代 === era &&
      !completed.has(r.料理) &&
      okM && okT && okD
    );
  });

  if (available.length === 0) return;

  available.forEach(r => {
    completed.add(r.料理);

    // ログにも残す
    log(`<span class="recipe-msg">料理完成：<span class="recipe-name">${r.料理}</span><br> → ${r.メッセージ}</span>`);

    // ポップアップキューに追加
    popupQueue.push(r);
  });

  renderHome();
  renderZukan();

  // ポップアップ開始
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
// ポップアップ（単体表示：図鑑クリック用）
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

// ID → 日本語名
function getNameById(id) {
  const item = dataList.find(d => d.id === id);
  return item ? item.name : id;
}

// ===============================
// ポップアップ閉じる
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
  if (currentEraIndex < eras.length - 1) {
    currentEraIndex++;
    viewEra = null;
    log(`<span class="era-msg">時代が進みました：${eras[currentEraIndex]}</span>`);
    renderHome();
    buildEraTabs();
    renderZukan();
  } else {
    log("これ以上進む時代はありません。");
  }
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
  renderHome();
};

// ===============================
// 初期化
// ===============================
loadCSV();