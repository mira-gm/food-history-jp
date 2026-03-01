// ===============================
// タイトル画面：スクロール画像生成
// ===============================
document.addEventListener("DOMContentLoaded", () => {

  // 料理画像リスト
  const foodImages = [
    "101_yakizakana.png","102_nizakana.png","103_hoshizakana.png","104_kai_nikomi.png",
    "105_jomon_cookie.png","106_yaki_shikaniku.png","107_shikaniku_nikomi.png","108_hoshiniku.png",
    "202_kayu.png","203_narezushi.png","204_doburoku.png","205_hoshigome.png","206_mushi_daizu.png","207_kirimi_yaki.png",
    "301_gohan.png","302_atsumono.png","303_shiozuke.png","304_mochi.png",
    "401_miso_soup.png","402_shojin_ryori.png","403_nimono.png","404_tsukemono.png","405_udon.png","406_kushi_dango.png",
    "501_honzen_ryori.png","502_cha_kaiseki.png","503_nanban_zuke.png","504_sashimi.png","505_nanban_gashi.png","506_sake.png",
    "601_sushi.png","602_tempura.png","603_yatai_soba.png","604_nabe_ryori.png","605_unagi_kabayaki.png","606_wagashi.png",
    "701_gyunabe.png","702_curry_rice.png","703_korokke.png","704_tonkatsu.png","705_omurice.png","706_hayashi_rice.png","707_western_sweets.png",
    "801_ramen.png","802_hamburger.png","803_okonomiyaki.png","804_spaghetti.png","805_chuka_ryori.png","806_karaage.png","807_pizza.png","808_donburi.png"
  ];

  // シャッフル
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // スクロール画像を流し込む
  const scrollInner = document.querySelector("#title-scroll .scroll-inner");
  shuffle([...foodImages]).forEach(name => {
    const img = document.createElement("img");
    img.src = "./data/" + name;
    scrollInner.appendChild(img);
  });

  // ===============================
// タップで開始（eraList 読み込み待ち）
// ===============================
document.getElementById("title-screen").onclick = async () => {

  // eraList が読み込まれるまで待機
  while (eraList.length === 0) {
    await new Promise(r => setTimeout(r, 50));
  }

  const t = document.getElementById("title-screen");
  t.classList.add("fade-out");

  setTimeout(() => {
    t.style.display = "none";
    document.getElementById("home-screen").classList.remove("hidden");

    // 最初の縄文ポップアップ
    showEraPopup(eraList[currentEraIndex]);

  }, 300);
};
});

// ===============================
// 図鑑へボタン
// ===============================
document.getElementById("btn-go-zukan").onclick = () => {
  document.getElementById("home-screen").classList.add("hidden");
  document.getElementById("zukan-screen").classList.remove("hidden");

  viewEra = null;        // currentEraIndex を使うモードに戻す
  buildEraTabs();        // タブの active を現在の時代に張り直す
  renderZukan();         // 一覧も現在の時代で描画し直す
};

// ===============================
// 図鑑 → ホームへ戻る
// ===============================
document.getElementById("btn-zukan-home").onclick = () => {
  document.getElementById("zukan-screen").classList.add("hidden");
  document.getElementById("home-screen").classList.remove("hidden");
};

// ===============================
// 次の時代へ
// ===============================
document.getElementById("btn-next-era").onclick = () => {
  // 時代を進める
  currentEraIndex++;

  const era = eraList[currentEraIndex];

  // 食文化影響が undefined / 空 の場合は 2 行目を出さない
  const detail = era.食文化影響 ?? "";
  const text =
    detail
      ? `${coloredName(`時代進行：${era.時代名}時代`, "時代")}<br>${detail}`
      : `${coloredName(`時代進行：${era.時代名}時代`, "時代")}`;

  log(text);

  renderHome();
  renderZukan();
  showEraPopup(era);
};


// ===============================
// 図鑑：分類タブ（旧仕様）
// ===============================
document.querySelectorAll("#zukan-tabs .info-tab").forEach(tab => {
  tab.onclick = () => {
    // active の付け替え
    document.querySelectorAll("#zukan-tabs .info-tab")
      .forEach(t => t.classList.remove("active"));

    tab.classList.add("active");

    // 図鑑の分類を更新
    zukanTab = tab.dataset.type;

    // 図鑑を再描画
    renderZukan();
  };
});

