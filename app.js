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

const fields = {
  editingId: document.querySelector("#editingId"),
  title: document.querySelector("#title"),
  madeAt: document.querySelector("#madeAt"),
  stage: document.querySelector("#stage"),
  clay: document.querySelector("#clay"),
  glaze: document.querySelector("#glaze"),
  firing: document.querySelector("#firing"),
  size: document.querySelector("#size"),
  photo: document.querySelector("#photo"),
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
  localStorage.setItem(storageKey, JSON.stringify(records));
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
    photo: fields.photo.value.trim(),
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
  fields.photo.value = record.photo;
  fields.notes.value = record.notes;
  formTitle.textContent = "作品を編集";
  saveButton.textContent = "更新する";
  fields.title.focus();
}

function clearForm() {
  form.reset();
  fields.editingId.value = "";
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
  if (index >= 0) {
    records[index] = data;
  } else {
    records = [data, ...records];
  }

  saveRecords();
  renderRecords();
  clearForm();
});

resetButton.addEventListener("click", clearForm);
searchInput.addEventListener("input", renderRecords);
stageFilter.addEventListener("change", renderRecords);

clearForm();
renderRecords();
