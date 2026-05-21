const fields = {
  apiKey: document.querySelector("#apiKey"),
  model: document.querySelector("#model"),
  postType: document.querySelector("#postType"),
  title: document.querySelector("#title"),
  persona: document.querySelector("#persona"),
  brand: document.querySelector("#brand"),
  season: document.querySelector("#season"),
  summary: document.querySelector("#summary"),
  date: document.querySelector("#date"),
  time: document.querySelector("#time"),
  products: document.querySelector("#products"),
  benefits: document.querySelector("#benefits"),
  recommend: document.querySelector("#recommend"),
  link: document.querySelector("#link"),
  tone: document.querySelector("#tone"),
  postTitles: document.querySelector("#postTitles"),
  hashtags: document.querySelector("#hashtags"),
  draft: document.querySelector("#draft"),
  status: document.querySelector("#status"),
};

const generateButton = document.querySelector("#generate");
const addProductButton = document.querySelector("#addProduct");
const fillProductPointsButton = document.querySelector("#fillProductPoints");
const productCards = document.querySelector("#productCards");
const apiBox = document.querySelector("#apiBox");
const saveApiKeyButton = document.querySelector("#saveApiKey");
const apiSavedText = document.querySelector("#apiSavedText");
const loadingOverlay = document.querySelector("#loadingOverlay");
const loadingTitle = document.querySelector("#loadingTitle");
const loadingMessage = document.querySelector("#loadingMessage");
const adaptiveUi = {
  dateField: document.querySelector("#dateField"),
  dateLabel: document.querySelector("#dateLabel"),
  timeField: document.querySelector("#timeField"),
  timeLabel: document.querySelector("#timeLabel"),
  productSection: document.querySelector("#productSection"),
  productSectionLabel: document.querySelector("#productSectionLabel"),
  benefitsField: document.querySelector("#benefitsField"),
  benefitsLabel: document.querySelector("#benefitsLabel"),
  linkLabel: document.querySelector("#linkLabel"),
};
let productDrafts = [];
let syncingProducts = false;

const formPresets = {
  live: {
    dateLabel: "라이브 일정",
    datePlaceholder: "예: 5월 20일",
    timeLabel: "라이브 시간",
    timePlaceholder: "예: 13시 ~ 14시",
    showSchedule: true,
    showProducts: true,
    productLabel: "라이브 상품 구성",
    benefitsLabel: "라이브 혜택/이벤트",
    benefitsPlaceholder: "예: 소통 이벤트 네이버페이 5천원 / 구매인증 이벤트 네이버페이 1만원 / 상품평 이벤트 최대 3만원",
    linkLabel: "라이브/상품 링크",
    linkPlaceholder: "라이브 또는 상품 URL",
  },
};

const tonePrompts = {
  friendly: "친근한 뽀리 톤: 밝고 자연스럽게, 이모지를 적당히 사용하고 독자에게 말을 건네는 느낌으로 작성하세요.",
  clean: "짧고 깔끔한 정보형: 군더더기를 줄이고 핵심 일정, 상품, 혜택이 빠르게 보이도록 간결하게 작성하세요.",
  sales: "구매 유도 강조형: 혜택의 한정성, 가격 메리트, 알람 설정 필요성을 자연스럽게 강조하세요. 과장 표현은 피하세요.",
  detail: "상세 설명형: 상품별 활용 상황과 추천 이유를 조금 더 자세히 풀어 설명하되, 읽기 쉽게 섹션을 나누세요.",
};

const typeMeta = {
  live: {
    label: "라이브 특가",
    headline: "단 1시간 라이브 특가",
    hook: "방송 시간에만 만날 수 있는 혜택이라 평소 관심 있으셨던 분들이라면 꼭 체크해보셔도 좋겠습니다.",
    scheduleTitle: "📢 라이브 일정 안내",
    productTitle: "📺 라이브 특가 상품 구성",
    close: "라이브 한정 혜택으로 진행되는 만큼 방송 전에 미리 알람을 설정해두시면 좋겠습니다.",
  },
};

const defaultSample = {
    title: "2026 New Odyssey G8 론칭 라이브",
    persona: "뽀리",
    brand: "오제앤에스",
    season: "5월 가정의 달",
    date: "5월 20일",
    time: "13시 ~ 14시",
    products: "오디세이 G8 LS27HG806 | 최종체감가 946,148원 | 27형 고해상도 게이밍 모니터\n오디세이 G8 LS32HG806 | 최종체감가 1,504,352원 | 32형 대화면 프리미엄 게이밍 모니터\n오디세이 G9 LS49DG930 | 최종체감가 1,309,000원 | 49형 울트라 와이드 게이밍 모니터",
    benefits: "소통 이벤트 네이버페이 5천원 / 구매인증 이벤트 네이버페이 1만원 / 상품평 이벤트 네이버페이 최대 3만원",
    link: "https://view.shoppinglive.naver.com/",
};

function createProductDraft(name = "", price = "", points = "") {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    name,
    price,
    points,
  };
}

function productsToText(products) {
  return products
    .map((product) => {
      const parts = [product.name, product.price, product.points]
        .map((part) => String(part || "").trim())
        .filter(Boolean);
      return parts.join(" || ");
    })
    .filter(Boolean)
    .join("\n");
}

function parseProductsText(text) {
  return text
    .split(/\n(?=[^|\n]+(?:\s\|\||\s\|))/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.includes("||") ? "||" : "|";
      const parts = line.split(separator).map((part) => part.trim());
      return createProductDraft(parts[0] || "", parts[1] || "", parts.slice(2).join(" | "));
    });
}

function syncProductsTextarea() {
  syncingProducts = true;
  fields.products.value = productsToText(productDrafts);
  syncingProducts = false;
}

function renderProductCards() {
  productCards.innerHTML = "";

  productDrafts.forEach((product, index) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.id = product.id;

    card.innerHTML = `
      <div class="product-card-head">
        <span class="product-card-title">상품 ${index + 1}</span>
        <button class="remove-product" type="button">삭제</button>
      </div>
      <div class="field">
        <label>상품명/모델명</label>
        <input class="product-name" placeholder="예: 오디세이 G8 LS27HG806" value="${escapeHtml(product.name)}">
      </div>
      <div class="field">
        <label>혜택가/가격</label>
        <input class="product-price" placeholder="예: 최종체감가 946,148원" value="${escapeHtml(product.price)}">
      </div>
      <div class="field hidden-field">
        <label>특징/추천 포인트</label>
        <textarea class="product-points" placeholder="예: 27형 고해상도 게이밍 모니터&#10;FPS, 콘솔 게임, 작업용으로 활용 가능">${escapeHtml(product.points)}</textarea>
      </div>
    `;

    productCards.appendChild(card);
  });
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function setProductsFromText(text) {
  productDrafts = parseProductsText(text);
  if (!productDrafts.length) {
    productDrafts = [createProductDraft()];
  }
  renderProductCards();
  syncProductsTextarea();
}

function value(key, fallback = "") {
  const text = fields[key].value.trim();
  return text || fallback;
}

function inferSeasonContext() {
  const text = `${value("date")} ${value("title")}`;
  const monthMatch = text.match(/(?:^|[^0-9])([1-9]|1[0-2])\s*월/);
  const month = monthMatch ? Number(monthMatch[1]) : new Date().getMonth() + 1;
  const monthNames = {
    1: "새해를 시작하는 1월",
    2: "겨울 끝자락의 2월",
    3: "봄기운이 찾아오는 3월",
    4: "따뜻한 봄날의 4월",
    5: "5월 가정의 달",
    6: "초여름이 시작되는 6월",
    7: "본격적인 여름이 찾아온 7월",
    8: "무더운 여름의 8월",
    9: "가을을 준비하는 9월",
    10: "선선한 가을의 10월",
    11: "연말을 준비하는 11월",
    12: "한 해를 마무리하는 12월",
  };
  fields.season.value = monthNames[month] || "요즘";
}

function applyFormPreset() {
  const preset = formPresets[value("postType", "live")];
  adaptiveUi.dateField.classList.toggle("hidden-field", !preset.showSchedule);
  adaptiveUi.timeField.classList.toggle("hidden-field", !preset.showSchedule);
  adaptiveUi.productSection.classList.toggle("hidden-field", !preset.showProducts);
  adaptiveUi.dateLabel.textContent = preset.dateLabel;
  fields.date.placeholder = preset.datePlaceholder;
  adaptiveUi.timeLabel.textContent = preset.timeLabel;
  fields.time.placeholder = preset.timePlaceholder;
  adaptiveUi.productSectionLabel.textContent = preset.productLabel;
  adaptiveUi.benefitsLabel.textContent = preset.benefitsLabel;
  fields.benefits.placeholder = preset.benefitsPlaceholder;
  adaptiveUi.linkLabel.textContent = preset.linkLabel;
  fields.link.placeholder = preset.linkPlaceholder;

}

function productsAreEnabled() {
  return formPresets[value("postType", "live")].showProducts;
}

function showLoading(title, message) {
  loadingTitle.textContent = title;
  loadingMessage.textContent = message;
  loadingOverlay.hidden = false;
}

function updateLoading(message) {
  loadingMessage.textContent = message;
}

function hideLoading() {
  loadingOverlay.hidden = true;
}

function updateApiBoxState(collapsed = false) {
  const hasKey = Boolean(value("apiKey"));
  apiBox.classList.toggle("saved", collapsed && hasKey);
  apiSavedText.textContent = hasKey ? "저장됨" : "저장 전";
}

function listFromText(text) {
  return text
    .split(/\n|\/|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function productLines(text) {
  const products = productDrafts.filter((product) => product.name.trim() || product.price.trim() || product.points.trim());

  if (products.length) {
    return products.map((product, index) => {
      const lines = [`${index + 1}️⃣ ${product.name.trim() || `상품 ${index + 1}`}`];
      if (product.price.trim()) lines.push(`👉 ${product.price.trim()}`);

      product.points
        .split("\n")
        .map((point) => point.trim())
        .filter(Boolean)
        .forEach((point) => {
          lines.push(`✔ ${point}`);
        });

      return lines.join("\n");
    });
  }

  return parseProductsText(text).map((product, index) => {
    const lines = [`${index + 1}️⃣ ${product.name.trim() || `상품 ${index + 1}`}`];
    if (product.price.trim()) lines.push(`👉 ${product.price.trim()}`);
    if (product.points.trim()) lines.push(`✔ ${product.points.trim()}`);
    return lines.join("\n");
  });
}

function mainProductName() {
  if (!productsAreEnabled()) return value("title", "이번 소식");
  const firstLine = value("products").split("\n").map((line) => line.trim()).find(Boolean);
  if (!firstLine) return value("title", "이번 소식");
  return firstLine.split("||")[0].split("|")[0].trim() || value("title", "이번 소식");
}

function fallbackAutoFields(meta) {
  const title = value("title", meta.headline);
  const season = value("season", "요즘");
  const product = mainProductName();
  const benefit = listFromText(value("benefits"))[0] || meta.label;

  const summaryParts = [
    `${season}, ${product}를 눈여겨보고 계셨던 분들께 반가운 ${meta.label} 소식이 준비되었습니다.`,
    `${benefit}을 중심으로 일정과 상품 구성을 한 번에 확인할 수 있어 구매를 고민하셨던 분들께 좋은 타이밍이 될 수 있어요.`,
    `${title} 관련 핵심 내용을 뽀리와 함께 차근차근 살펴보겠습니다.`,
  ];

  const productHints = value("products")
    .split("\n")
    .map((line) => line.split("|").map((part) => part.trim()).filter(Boolean))
    .filter((parts) => parts.length)
    .slice(0, 3);

  const recommendations = [
    `${product}를 합리적인 혜택으로 만나보고 싶은 분`,
    "라이브 특가나 기간 한정 프로모션을 기다리셨던 분",
    "제품 구성과 가격 혜택을 한 번에 비교하고 싶은 분",
    "공간과 사용 목적에 맞는 디스플레이 제품을 찾는 분",
  ];

  productHints.forEach((parts) => {
    if (parts[2]) recommendations.push(`${parts[2]} 구성을 찾고 계신 분`);
  });

  fields.summary.value = summaryParts.join(" ");
  fields.recommend.value = [...new Set(recommendations)].slice(0, 6).join("\n");
  fields.postTitles.value = [
    `${product} ${meta.label} 혜택 정리`,
    `${title} 일정과 상품 구성 한눈에 보기`,
    `${season} 추천 ${product} 혜택 소식`,
  ].join("\n");
  fields.hashtags.value = [
    "#오제앤에스",
    "#삼성공식파트너",
    `#${product.replace(/\s+/g, "")}`,
    `#${meta.label.replace(/[\/\s]/g, "")}`,
    "#라이브특가",
    "#모니터추천",
    "#게이밍모니터",
    "#네이버쇼핑라이브",
  ].join(" ");
}

function buildGenerationPrompt(meta) {
  return [
    "아래 정보를 바탕으로 오제앤에스 네이버 블로그 원고에 들어갈 문장과 포스팅 제목, 해시태그를 생성해 주세요.",
    "기존 원고 톤: 친근한 한국어, 화자 뽀리, 시즌 공감, 부드러운 구매/참여 유도, 과장보다 실용적 정리.",
    `이번 원고 톤: ${tonePrompts[value("tone", "friendly")]}`,
    "반드시 JSON만 반환하세요. 형식은 {\"summary\":\"문단\", \"recommendations\":[\"추천 대상\"], \"titles\":[\"제목\"], \"hashtags\":[\"#태그\"]} 입니다.",
    "summary는 2~3문장으로 자연스럽게 작성하고, recommendations는 4~6개로 작성하세요.",
    "titles는 네이버 블로그용 제목 후보 3개를 작성하세요. 핵심 키워드, 행사명, 상품명이 앞쪽에 오도록 해주세요.",
    "hashtags는 8~14개를 작성하세요. 공백 없이 #으로 시작하고, 브랜드/상품/행사/용도 키워드를 섞어주세요.",
    "",
    `원고 유형: ${meta.label}`,
    `핵심 제목: ${value("title", meta.headline)}`,
    `브랜드/판매처: ${value("brand", "오제앤에스")}`,
    `시즌 문맥: ${value("season", "요즘")}`,
    `일정: ${value("date", "미정")}`,
    `시간: ${value("time", "미정")}`,
    `상품 구성: ${productsAreEnabled() ? value("products", "미입력") : "해당 없음"}`,
    `혜택/이벤트: ${value("benefits", "미입력")}`,
  ].join("\n");
}

function buildProductPointsPrompt() {
  return [
    "아래 상품 목록을 바탕으로 각 상품의 블로그용 특징/추천 포인트를 생성해 주세요.",
    `톤: ${tonePrompts[value("tone", "friendly")]} 실용적이고 구매 판단에 도움이 되는 문장으로 작성하세요.`,
    "반드시 JSON만 반환하세요. 형식은 {\"products\":[{\"name\":\"상품명\", \"points\":\"포인트\"}]} 입니다.",
    "points는 상품마다 2~3줄로 작성하고, 줄바꿈은 \\n으로 표현하세요.",
    "",
    `원고 유형: ${typeMeta[value("postType", "live")].label}`,
    `핵심 제목: ${value("title")}`,
    `시즌 문맥: ${value("season")}`,
    `상품 목록: ${productDrafts.map((product) => `${product.name} / ${product.price}`).join("\n")}`,
  ].join("\n");
}

function fallbackProductPoints() {
  productDrafts = productDrafts.map((product) => {
    const name = product.name || "해당 상품";
    const priceLine = product.price ? `${product.price} 혜택으로 부담을 낮춰볼 수 있는 구성` : "행사 혜택과 함께 살펴보기 좋은 구성";
    return {
      ...product,
      points: product.points || [
        `${name}을 찾고 계셨던 분들께 추천드리기 좋은 상품입니다.`,
        priceLine,
        "영상 감상, 업무, 공간 활용 등 다양한 목적에 맞춰 활용하기 좋습니다.",
      ].join("\n"),
    };
  });
  renderProductCards();
  syncProductsTextarea();
}

async function generateProductPoints() {
  const apiKey = value("apiKey");
  if (!apiKey) {
    fallbackProductPoints();
    return "Gemini API 키가 없어 기본 문장으로 상품 포인트를 채웠습니다.";
  }

  const model = encodeURIComponent(value("model", "gemini-2.5-flash"));
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: buildProductPointsPrompt() }] }],
      generationConfig: {
        temperature: 0.65,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            products: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  points: { type: "STRING" },
                },
                required: ["name", "points"],
              },
            },
          },
          required: ["products"],
        },
      },
    }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const errorData = await response.json();
      detail = errorData.error?.message || JSON.stringify(errorData.error || errorData);
    } catch {
      detail = await response.text();
    }
    const error = new Error(detail);
    error.isQuotaError = response.status === 429 || /quota|rate|exceeded/i.test(detail);
    throw error;
  }

  const data = await response.json();
  const generated = parseGeneratedText(extractGeminiText(data));
  const generatedProducts = Array.isArray(generated.products) ? generated.products : [];

  productDrafts = productDrafts.map((product, index) => ({
    ...product,
    points: generatedProducts[index]?.points || product.points,
  }));
  renderProductCards();
  syncProductsTextarea();
  return "상품 특징/추천 포인트를 자동 생성했습니다.";
}

function extractGeminiText(data) {
  return (data.candidates || [])
    .flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => part.text || "")
    .join("")
    .trim();
}

function parseGeneratedText(text) {
  if (!text) {
    throw new Error("Gemini 응답에 생성된 문장이 없습니다. API 키와 모델명을 확인해 주세요.");
  }

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("API 응답을 읽을 수 없습니다.");
  }
}

async function generateAutoFields(meta) {
  const apiKey = value("apiKey");
  if (!apiKey) {
    throw new Error("Gemini API 키를 입력해 주세요. 입력칸의 AIza...는 예시이며 실제 키를 붙여넣어야 합니다.");
  }

  const model = encodeURIComponent(value("model", "gemini-2.5-flash"));
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: buildGenerationPrompt(meta) }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            summary: { type: "STRING" },
            recommendations: {
              type: "ARRAY",
              items: { type: "STRING" },
            },
            titles: {
              type: "ARRAY",
              items: { type: "STRING" },
            },
            hashtags: {
              type: "ARRAY",
              items: { type: "STRING" },
            },
          },
          required: ["summary", "recommendations", "titles", "hashtags"],
        },
      },
    }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const errorData = await response.json();
      detail = errorData.error?.message || JSON.stringify(errorData.error || errorData);
    } catch {
      detail = await response.text();
    }
    const error = new Error(`Gemini API 요청에 실패했습니다. ${detail.slice(0, 220)}`);
    error.isQuotaError = response.status === 429 || /quota|rate|exceeded/i.test(detail);
    throw error;
  }

  const data = await response.json();
  const generated = parseGeneratedText(extractGeminiText(data));
  const recommendations = Array.isArray(generated.recommendations)
    ? generated.recommendations
    : [];

  fields.summary.value = String(generated.summary || "").trim();
  fields.recommend.value = recommendations.map((item) => String(item).trim()).filter(Boolean).join("\n");
  fields.postTitles.value = Array.isArray(generated.titles)
    ? generated.titles.map((item) => String(item).trim()).filter(Boolean).join("\n")
    : "";
  fields.hashtags.value = Array.isArray(generated.hashtags)
    ? generated.hashtags.map((item) => String(item).trim()).filter(Boolean).join(" ")
    : "";
}

function makeIntro(meta) {
  const persona = value("persona", "뽀리");
  const brand = value("brand", "오제앤에스");
  const season = value("season", "요즘");
  const title = value("title", meta.headline);
  const summary = value("summary", `${title} 소식을 ${brand} 블로그에서 소개해 드리려고 합니다.`);

  return [
    `${title}`,
    "",
    `안녕하세요, ${persona}입니다 😊`,
    "",
    `${season}, 어떤 제품을 고르면 좋을지 또는 어떤 혜택을 챙기면 좋을지 고민하시는 분들 많으실 텐데요.`,
    "",
    summary,
    "",
    `오늘은 ${brand}에서 준비한 ${meta.label} 소식을 자세히 정리해드리려고 합니다.`,
    "",
    meta.hook,
  ].join("\n");
}

function makeSchedule(meta) {
  const date = value("date");
  const time = value("time");
  const lines = [];

  if (date) lines.push(`👉 일정: ${date}`);
  if (time) lines.push(`👉 시간: ${time}`);

  if (!lines.length) return "";

  return [`${meta.scheduleTitle}`, "", ...lines].join("\n");
}

function makeProducts(meta) {
  if (!productsAreEnabled()) return "";

  const products = productLines(value("products"));
  const benefits = listFromText(value("benefits"));
  const blocks = [];

  if (products.length) {
    blocks.push(`${meta.productTitle}\n\n${products.join("\n\n")}`);
  }

  if (benefits.length) {
    blocks.push(`🎁 함께 챙기면 좋은 혜택\n\n${benefits.map((item) => `✔ ${item}`).join("\n")}`);
  }

  return blocks.join("\n\n");
}

function makeRecommend() {
  const recommend = listFromText(value("recommend"));
  if (!recommend.length) return "";

  return [`💡 이런 분들께 추천드려요`, "", recommend.map((item) => `✔ ${item}`).join("\n")].join("\n");
}

function makeClosing(meta) {
  const title = value("title", meta.headline);
  const link = value("link");
  const lines = [
    meta.close,
    "",
    `특히 ${title}를 기다리셨던 분들이라면 이번 소식을 꼭 확인해보세요.`,
    "",
    "좋은 조건으로 필요한 제품과 혜택을 챙기실 수 있길 바랍니다 😊",
  ];

  if (link) {
    lines.push("", "바로가기 링크▼", link);
  }

  return lines.join("\n");
}

function composeDraft(meta) {
  const sections = [
    makeIntro(meta),
    makeSchedule(meta),
    makeProducts(meta),
    makeRecommend(),
    makeClosing(meta),
  ].filter(Boolean);

  fields.draft.value = sections.join("\n\n");
}

async function generateDraft() {
  const meta = typeMeta[value("postType", "live")];
  generateButton.disabled = true;
  fillProductPointsButton.disabled = true;
  inferSeasonContext();
  fields.status.textContent = "Gemini API로 상품 포인트와 도입 문장, 추천 대상을 생성하는 중입니다.";
  showLoading("초안 생성 중", "상품 특징과 추천 포인트를 먼저 정리하고 있습니다.");

  try {
    const productMessage = productsAreEnabled()
      ? await generateProductPoints()
      : "입력한 이벤트 정보를 바탕으로 구성했습니다.";
    updateLoading("도입 문장, 포스팅 제목, 해시태그를 생성하고 있습니다.");
    await generateAutoFields(meta);
    updateLoading("블로그 원고 형태로 정리하고 있습니다.");
    composeDraft(meta);
    fields.status.textContent = `초안이 생성되었습니다. ${productMessage}`;
    saveState();
  } catch (error) {
    if (error.isQuotaError) {
      fallbackProductPoints();
      fallbackAutoFields(meta);
      composeDraft(meta);
      fields.status.textContent = "Gemini 무료 사용량 제한에 걸려 API 없이 기본 자동 생성으로 초안을 만들었습니다. 잠시 후 다시 시도하거나 다른 키를 사용해 주세요.";
      saveState();
      return;
    }

    const message = error.name === "TypeError"
      ? "Gemini API에 연결하지 못했습니다. 인터넷 연결, API 키, 브라우저 요청 차단 여부를 확인해 주세요."
      : error.message;
    fields.status.textContent = message;
  } finally {
    generateButton.disabled = false;
    fillProductPointsButton.disabled = false;
    hideLoading();
  }
}

function saveState() {
  const data = Object.keys(fields).reduce((memo, key) => {
    const field = fields[key];
    const shouldSave = (
      field instanceof HTMLInputElement ||
      field instanceof HTMLTextAreaElement ||
      field instanceof HTMLSelectElement
    );

  if (shouldSave) memo[key] = field.value;
    return memo;
  }, {});
  data.apiCollapsed = apiBox.classList.contains("saved");
  localStorage.setItem("blogDraftGenerator", JSON.stringify(data));
}

function restoreState() {
  const raw = localStorage.getItem("blogDraftGenerator");
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    Object.entries(data).forEach(([key, val]) => {
      if (fields[key]) fields[key].value = val;
    });
    updateApiBoxState(Boolean(data.apiCollapsed));
  } catch {
    localStorage.removeItem("blogDraftGenerator");
  }
}

generateButton.addEventListener("click", generateDraft);

addProductButton.addEventListener("click", () => {
  productDrafts.push(createProductDraft());
  renderProductCards();
  syncProductsTextarea();
  saveState();
});

fillProductPointsButton.addEventListener("click", async () => {
  fillProductPointsButton.disabled = true;
  fields.status.textContent = "상품 특징/추천 포인트를 생성하는 중입니다.";
  showLoading("포인트 생성 중", "상품명과 가격 정보를 바탕으로 추천 포인트를 작성하고 있습니다.");
  try {
    const message = await generateProductPoints();
    fields.status.textContent = message;
    saveState();
  } catch (error) {
    if (error.isQuotaError) {
      fallbackProductPoints();
      fields.status.textContent = "Gemini 무료 사용량 제한에 걸려 기본 문장으로 상품 포인트를 채웠습니다.";
      saveState();
      return;
    }
    fields.status.textContent = error.name === "TypeError"
      ? "Gemini API에 연결하지 못했습니다. 기본 문장으로 상품 포인트를 채웠습니다."
      : `상품 포인트 생성에 실패했습니다. ${error.message.slice(0, 160)}`;
    fallbackProductPoints();
    saveState();
  } finally {
    fillProductPointsButton.disabled = false;
    hideLoading();
  }
});

productCards.addEventListener("input", (event) => {
  const card = event.target.closest(".product-card");
  if (!card) return;

  const product = productDrafts.find((item) => item.id === card.dataset.id);
  if (!product) return;

  product.name = card.querySelector(".product-name").value;
  product.price = card.querySelector(".product-price").value;
  product.points = card.querySelector(".product-points").value;
  syncProductsTextarea();
  saveState();
});

productCards.addEventListener("click", (event) => {
  if (!event.target.classList.contains("remove-product")) return;

  const card = event.target.closest(".product-card");
  productDrafts = productDrafts.filter((item) => item.id !== card.dataset.id);
  if (!productDrafts.length) productDrafts = [createProductDraft()];
  renderProductCards();
  syncProductsTextarea();
  saveState();
});

fields.products.addEventListener("input", () => {
  if (syncingProducts) return;
  setProductsFromText(fields.products.value);
  saveState();
});

fields.date.addEventListener("input", () => {
  inferSeasonContext();
  saveState();
});

document.querySelector("#clear").addEventListener("click", () => {
  Object.keys(fields).forEach((key) => {
    if (key === "apiKey" || key === "model") return;
    const field = fields[key];
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      field.value = "";
    }
  });
  fields.postType.value = "live";
  fields.persona.value = "뽀리";
  fields.brand.value = "오제앤에스";
  fields.season.value = "5월 가정의 달";
  productDrafts = [createProductDraft()];
  renderProductCards();
  syncProductsTextarea();
  fields.status.textContent = "입력값을 비웠습니다.";
  saveState();
});

saveApiKeyButton.addEventListener("click", (event) => {
  event.stopPropagation();
  saveState();
  updateApiBoxState(true);
  fields.status.textContent = "API 키를 이 브라우저에 저장했습니다.";
});

apiBox.addEventListener("click", () => {
  if (!apiBox.classList.contains("saved")) return;
  updateApiBoxState(false);
});

async function copyTextFromField(field, emptyMessage, successMessage) {
  if (!field.value.trim()) {
    fields.status.textContent = emptyMessage;
    return;
  }
  await navigator.clipboard.writeText(field.value);
  fields.status.textContent = successMessage;
}

document.querySelector("#copyTitles").addEventListener("click", () => {
  copyTextFromField(fields.postTitles, "먼저 초안을 만들어 제목 후보를 생성해 주세요.", "포스팅 제목 후보를 복사했습니다.");
});

document.querySelector("#copyHashtags").addEventListener("click", () => {
  copyTextFromField(fields.hashtags, "먼저 초안을 만들어 해시태그를 생성해 주세요.", "해시태그를 복사했습니다.");
});

document.querySelector("#copy").addEventListener("click", async () => {
  copyTextFromField(fields.draft, "먼저 초안을 만들어 주세요.", "본문을 클립보드에 복사했습니다.");
});

document.querySelector("#download").addEventListener("click", () => {
  if (!fields.draft.value.trim()) {
    fields.status.textContent = "먼저 초안을 만들어 주세요.";
    return;
  }
  const blob = new Blob([fields.draft.value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${value("title", "블로그 원고")}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  fields.status.textContent = "TXT 파일로 저장했습니다.";
});

Object.values(fields).forEach((field) => {
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
    field.addEventListener("input", () => {
      saveState();
      if (field === fields.apiKey) updateApiBoxState(false);
    });
  }
});

restoreState();
if (fields.postType.value !== "live") {
  fields.postType.value = "live";
  saveState();
}
if (fields.model.value === "gemini-2.0-flash" || fields.model.value === "gemini-2.0-flash-lite") {
  fields.model.value = "gemini-2.5-flash";
  saveState();
}
applyFormPreset();
updateApiBoxState(apiBox.classList.contains("saved"));
if (!fields.title.value.trim()) {
  Object.entries(defaultSample).forEach(([key, val]) => {
    fields[key].value = val;
  });
  fields.status.textContent = "예시가 준비되었습니다. API 키를 입력한 뒤 초안 만들기를 눌러주세요.";
}
setProductsFromText(fields.products.value);
