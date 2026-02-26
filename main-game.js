// ===============================
// 共通ユーティリティ
// ===============================

// 必要ID（素材ID・技術ID・道具ID）
function needID(str) {
  if (!str) return [];
  return str.split("・").filter(x => x);
}

// 時代クリア判定
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

// 料理作成可能判定
function canCookAnyRecipe() {
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
// 行動：素材探索
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

  log(`${msgText["found_material"]}${coloredName(item.name, "素材")}<br>${item.メッセージ}`);

  renderHome();
  renderZukan();
};

// ===============================
// 行動：技術研究
// ===============================
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

  log(`${msgText["learn_tech"]}${coloredName(item.name, "技術")}<br>${item.メッセージ}`);

  renderHome();
  renderZukan();
};

// ===============================
// 行動：道具開発
// ===============================
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

  log(`${msgText["develop_tool"]}${coloredName(item.name, "道具")}<br>${item.メッセージ}`);

  renderHome();
  renderZukan();
};

// ===============================
// 行動：料理作成
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

    log(`${msgText["complete_recipe"]}${coloredName(r.料理, "料理")}<br> → ${r.メッセージ}`);

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
// 料理ポップアップ表示
// ===============================
function showPopupForRecipe(r) {
  popupActive = true;

  const popup = document.getElementById("popup");
  const img = document.getElementById("popup-img");
  const title = document.getElementById("popup-title");
  const detail = document.getElementById("popup-detail");

  img.src = "./data/" + gazoMap[r.料理];
  title.innerHTML = coloredName(r.料理, "料理");

  const needM = needID(r.素材ID).map(id => coloredName(getNameById(id), "素材")).join("・") || "なし";
  const needT = needID(r.技術ID).map(id => coloredName(getNameById(id), "技術")).join("・") || "なし";
  const needD = needID(r.道具ID).map(id => coloredName(getNameById(id), "道具")).join("・") || "なし";

  detail.innerHTML =
    `素材：${needM}<br>` +
    `技術：${needT}<br>` +
    `道具：${needD}<br><br>` +
    `${r.メッセージ}`;

  popup.style.display = "flex";
}

// ID → 名前
function getNameById(id) {
  const item = dataList.find(d => d.id === id);
  return item ? item.name : id;
}

// ===============================
// ポップアップ閉じる
// ===============================
document.getElementById("popup").onclick = () => {
  // ★ 追加：非表示なら何もしない（空欄ポップアップ防止）
  if (document.getElementById("popup").style.display === "none") return;
  document.getElementById("popup").style.display = "none";
  popupActive = false;
  if (popupQueue.length > 0) {
    showNextPopup();
  }
};