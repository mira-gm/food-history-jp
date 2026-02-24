// ===============================
// タイトル画面（CSV読み込み待ち → フェードアウト）
// ===============================
document.addEventListener("DOMContentLoaded", () => {

  // タイトル画面のスクロール画像は index.html 側で生成済み

  document.getElementById("title-screen").onclick = async () => {

    // eraList が読み込まれるまで待機
    while (!window.eraList || eraList.length === 0) {
      await new Promise(r => setTimeout(r, 50));
    }

    const t = document.getElementById("title-screen");
    t.classList.add("fade-out");

    setTimeout(() => {
      t.style.display = "none";
      document.getElementById("home-screen").classList.remove("hidden");

      // 最初の時代ポップアップ
      showEraPopup(eraList[currentEraIndex]);

    }, 300);
  };
});

// ===============================
// 図鑑タブ切り替え
// ===============================
document.querySelectorAll(".info-tab").forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll(".info-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    zukanTab = tab.dataset.type;
    renderZukan();
  };
});

// ===============================
// 図鑑 → ホームへ戻る
// ===============================
document.getElementById("btn-go-zukan").onclick = () => {
  document.getElementById("home-screen").classList.add("hidden");
  document.getElementById("zukan-screen").classList.remove("hidden");
};

document.getElementById("btn-zukan-home").onclick = () => {
  document.getElementById("zukan-screen").classList.add("hidden");
  document.getElementById("home-screen").classList.remove("hidden");
};

// ===============================
// 次の時代へ
// ===============================
document.getElementById("btn-next-era").onclick = () => {
  if (currentEraIndex < eraList.length - 1) {
    currentEraIndex++;
    viewEra = null;

    log(`${msgText["era_advance"]}${coloredName(eraNameByIndex(currentEraIndex), "時代")}`);

    renderHome();
    buildEraTabs();
    renderZukan();

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
  document.getElementById("era-popup-title").innerHTML = coloredName(era.時代タイトル, "時代");

  document.getElementById("era-popup-year").textContent =
    `（${era.開始年}〜${era.終了年}）`;

  document.getElementById("era-popup-desc").textContent = era.時代説明;
  document.getElementById("era-popup-food").textContent = era.食文化影響;

  box.style.display = "flex";
}

document.getElementById("era-popup").onclick = () => {
  document.getElementById("era-popup").style.display = "none";
};