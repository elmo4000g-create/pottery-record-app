const storageKey = "pottery-records-v1";
const stages = ["成形", "削り", "乾燥", "素焼き", "釉掛け", "本焼き", "完成"];

const form = document.querySelector("#recordForm");
const recordList = document.querySelector("#recordList");
const template = document.querySelector("#recordTemplate");
const searchInput = document.querySelector("#searchInput");
const stageFilter = document.querySelector("#stageFilter");
const resetButton = document.querySelector("#resetButton");
const saveButton = document.querySelector("#saveButton");
const formTitle = document.querySelector("#formTitle");
const photoPreview = document.querySelector("#photoPreview");
const removePhotoButton = document.querySelector("#removePhotoButton");

const fields = {
  editingId: document.querySelector("#editingId"),
  title: document.querySelector("#title"),
  madeAt: document.querySelector("#madeAt"),
  stage: document.querySelector("#stage"),
  clay: document.querySelector("#clay"),
  glaze: document.querySelector("#glaze"),
  firing: document.querySelector("#firing"),
  size: document.querySelector("#size"),
  photoInput: document.querySelector("#photoInput"),
  notes: document.querySelector("#notes")
};

const sampleRecords = [
  {
    id: makeId(),
    title: "粉引きの飯碗",
    madeAt: "2026-05-03",
    stage: "完成",
    clay: "信楽白土",
    glaze: "透明釉",
    firing: "酸化 1230度",
    size: "直径12cm 高さ6cm",
    photo: "",
    notes: "高台を少し薄くしたら持ちやすくなった。次回は口縁をさらに軽くする。"
  },
  {
    id: makeId(),
    title: "灰釉の花器",
    madeAt: "2026-05-12",
    stage: "釉掛け",
    clay: "赤土",
    glaze: "灰釉",
    firing: "還元予定",
    size: "高さ18cm",
    photo: "",
    notes: "胴の張りはよい。釉薬は肩に流れを残したいので薄めに掛ける。"
  }
];

let records = loadRecords();
let currentPhoto = "";

function makeId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `record-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadRecords() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) {
    localStorage.setItem(storageKey, JSON.stringify(sampleRecords));
    return sampleRecords;
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : sampleRecords;
  } catch {
    return sampleRecords;
  }
}

function saveRecords() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(records));
    return true;
  } catch {
    alert("保存容量がいっぱいです。写真を外すか、不要な記録を削除してからもう一度試してください。");
    return false;
  }
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = src;
  });
}

async function preparePhoto(file) {
  if (!file) return currentPhoto;
  if (!file.type.startsWith("image/")) {
    alert("画像ファイルを選んでください。");
    fields.photoInput.value = "";
    return currentPhoto;
  }

  const dataUrl = await readImage(file);
  const image = await loadImage(dataUrl);
  const maxSize = 1200;
  const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.round(image.width * ratio);
  const height = Math.round(image.height * ratio);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 0.82);
}

function renderPhotoPreview(photo) {
  photoPreview.replaceChildren();
  if (!photo) {
    const empty = document.createElement("span");
    empty.textContent = "写真なし";
    photoPreview.append(empty);
    removePhotoButton.disabled = true;
    return;
  }

  const image = document.createElement("img");
  image.src = photo;
  image.alt = "選択中の作品写真";
  photoPreview.append(image);
  removePhotoButton.disabled = false;
}

function formatDate(value) {
  if (!value) return "日付なし";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function getFormData() {
  return {
    id: fields.editingId.value || makeId(),
    title: fields.title.value.trim(),
    madeAt: fields.madeAt.value,
    stage: fields.stage.value,
    clay: fields.clay.value.trim(),
    glaze: fields.glaze.value.trim(),
    firing: fields.firing.value.trim(),
    size: fields.size.value.trim(),
    photo: currentPhoto,
    notes: fields.notes.value.trim()
  };
}

function setFormData(record) {
  fields.editingId.value = record.id;
  fields.title.value = record.title;
  fields.madeAt.value = record.madeAt;
  fields.stage.value = record.stage;
  fields.clay.value = record.clay;
  fields.glaze.value = record.glaze;
  fields.firing.value = record.firing;
  fields.size.value = record.size;
  currentPhoto = record.photo || "";
  fields.photoInput.value = "";
  renderPhotoPreview(currentPhoto);
  fields.notes.value = record.notes;
  formTitle.textContent = "作品を編集";
  saveButton.textContent = "更新する";
  fields.title.focus();
}

function clearForm() {
  form.reset();
  fields.editingId.value = "";
  currentPhoto = "";
  renderPhotoPreview(currentPhoto);
  fields.madeAt.valueAsDate = new Date();
  formTitle.textContent = "新しい作品";
  saveButton.textContent = "記録する";
}

function createDetail(label, value) {
  if (!value) return null;
  const wrapper = document.createElement("div");
  const term = document.createElement("dt");
  const description = document.createElement("dd");
  term.textContent = label;
  description.textContent = value;
  wrapper.append(term, description);
  return wrapper;
}

function renderSummary() {
  document.querySelector("#totalCount").textContent = records.length;
  document.querySelector("#activeCount").textContent = records.filter((record) => record.stage !== "完成").length;
  document.querySelector("#finishedCount").textContent = records.filter((record) => record.stage === "完成").length;
}

function filteredRecords() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedStage = stageFilter.value;

  return records
    .filter((record) => selectedStage === "all" || record.stage === selectedStage)
    .filter((record) => {
      if (!query) return true;
      return [record.title, record.clay, record.glaze, record.firing, record.size, record.notes]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .sort((a, b) => b.madeAt.localeCompare(a.madeAt));
}

function renderRecords() {
  recordList.replaceChildren();
  const visibleRecords = filteredRecords();

  if (visibleRecords.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "条件に合う作品がありません。検索や工程を変えてみてください。";
    recordList.append(empty);
    renderSummary();
    return;
  }

  visibleRecords.forEach((record) => {
    const card = template.content.firstElementChild.cloneNode(true);
    const image = card.querySelector(".record-image");
    const details = card.querySelector(".record-details");
    const notes = card.querySelector(".record-notes");

    card.querySelector("h3").textContent = record.title;
    card.querySelector(".record-date").textContent = formatDate(record.madeAt);
    card.querySelector(".stage-pill").textContent = record.stage;

    if (record.photo) {
      image.style.backgroundImage = `url("${record.photo.replaceAll('"', "%22")}")`;
    }

    [
      createDetail("土", record.clay),
      createDetail("釉薬", record.glaze),
      createDetail("焼成", record.firing),
      createDetail("サイズ", record.size)
    ].filter(Boolean).forEach((detail) => details.append(detail));

    notes.textContent = record.notes || "メモはまだありません。";
    card.querySelector(".edit-button").addEventListener("click", () => setFormData(record));
    card.querySelector(".delete-button").addEventListener("click", () => deleteRecord(record.id));
    recordList.append(card);
  });

  renderSummary();
}

function deleteRecord(id) {
  const target = records.find((record) => record.id === id);
  if (!target) return;

  const confirmed = confirm(`「${target.title}」を削除しますか？`);
  if (!confirmed) return;

  records = records.filter((record) => record.id !== id);
  saveRecords();
  renderRecords();
  clearForm();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = getFormData();

  if (!data.title || !data.madeAt) return;

  const index = records.findIndex((record) => record.id === data.id);
  const previousRecords = records;
  if (index >= 0) {
    records = records.map((record) => record.id === data.id ? data : record);
  } else {
    records = [data, ...records];
  }

  if (!saveRecords()) {
    records = previousRecords;
    return;
  }
  renderRecords();
  clearForm();
});

resetButton.addEventListener("click", clearForm);
searchInput.addEventListener("input", renderRecords);
stageFilter.addEventListener("change", renderRecords);
fields.photoInput.addEventListener("change", async () => {
  const [file] = fields.photoInput.files;
  if (!file) return;

  saveButton.disabled = true;
  saveButton.textContent = "写真を準備中...";
  try {
    currentPhoto = await preparePhoto(file);
    renderPhotoPreview(currentPhoto);
  } catch {
    alert("写真を読み込めませんでした。別の画像を選んでください。");
    fields.photoInput.value = "";
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = fields.editingId.value ? "更新する" : "記録する";
  }
});
removePhotoButton.addEventListener("click", () => {
  currentPhoto = "";
  fields.photoInput.value = "";
  renderPhotoPreview(currentPhoto);
});

clearForm();
renderRecords();
