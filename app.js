import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =========================
// STATE
// =========================
const goalsContainer = document.getElementById("goals");

const themes = [
  "theme-pink",
  "theme-purple",
  "theme-blue",
  "theme-holo",
  "theme-star"
];

let editingGoalId = null;

// =========================
// LOAD GOALS
// =========================
async function loadGoals() {

  const snapshot = await getDocs(collection(db, "goals"));

  goalsContainer.innerHTML = "";

  const goalsArray = [];

  snapshot.forEach((goalDoc) => {
    goalsArray.push({
      id: goalDoc.id,
      ...goalDoc.data()
    });
  });

  goalsArray.sort((a, b) => a.completed - b.completed);

  goalsArray.forEach((goal) => {

    const progressPercent =
      (goal.current / goal.target) * 100;

    const card = document.createElement("div");
    card.dataset.cardId = goal.id;
    card.className = `
      goal-card
      ${goal.completed ? "done" : ""}
      ${goal.theme || ""}
    `;

    card.innerHTML = `
      <h2>${goal.title}</h2>

      ${goal.completed ? '<div class="status done">Completed</div>' : ""}

      <div>
        Reward:
        <b>${goal.reward || "—"}</b>
      </div>

      <div class="progress-wrapper">

        <div class="progress-bar">
          <div
            class="progress-fill"
            style="width: ${progressPercent}%">
          </div>
        </div>

        <div class="progress-text">
          ${goal.current} / ${goal.target}
        </div>

      </div>

      <div style="margin-top:14px; display:flex; gap:8px;">
        <button class="minus" data-id="${goal.id}">➖</button>
        <button class="plus" data-id="${goal.id}">➕</button>
        <button class="edit" data-id="${goal.id}">✏️</button>
      </div>
    `;

    // =========================
    // SWIPE DELETE
    // =========================
    let startX = 0;

    card.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });

    card.addEventListener("touchmove", (e) => {
      const diff = e.touches[0].clientX - startX;

      if (diff < -40) {
        card.style.transform = `translateX(${diff}px)`;
        card.style.opacity = "0.7";
      }
    });

    card.addEventListener("touchend", async (e) => {
      const diff = e.changedTouches[0].clientX - startX;

      if (diff < -120) {
        await deleteDoc(doc(db, "goals", goal.id));
        loadGoals();
      } else {
        card.style.transform = "translateX(0)";
        card.style.opacity = "1";
      }
    });

    goalsContainer.appendChild(card);
  });
}
//хелпер
function updateGoalCard(id, updates) {

  const card = document.querySelector(
    `[data-card-id="${id}"]`
  );

  if (!card) return;

  // progress text
  if (updates.current !== undefined && updates.target !== undefined) {

    const progressText =
      card.querySelector(".progress-text");

    progressText.textContent =
      `${updates.current} / ${updates.target}`;

    const progressFill =
      card.querySelector(".progress-fill");

    const percent =
      (updates.current / updates.target) * 100;

    progressFill.style.width = `${percent}%`;
  }

  // completed state
  if (updates.completed !== undefined) {

    if (updates.completed) {
      card.classList.add("done");
    } else {
      card.classList.remove("done");
    }
  }
}

// =========================
// ADD GOAL
// =========================
const addBtn = document.getElementById("addBtn");

addBtn.onclick = async () => {

  const title = document.getElementById("title").value;
  const target = Number(document.getElementById("target").value);
  const reward = document.getElementById("reward").value;

  if (!title || !target || target <= 0) return;

  await addDoc(collection(db, "goals"), {
    title,
    target,
    current: 0,
    reward: reward || "",
    completed: false,
    theme: themes[Math.floor(Math.random() * themes.length)]
  });

  document.getElementById("title").value = "";
  document.getElementById("target").value = "";
  document.getElementById("reward").value = "";

  loadGoals();
};

// =========================
// CLICK HANDLER (PLUS / MINUS / EDIT)
// =========================
document.addEventListener("click", async (e) => {

  const button = e.target.closest("button");
  if (!button) return;

  const id = button.dataset.id;
  if (!id) return;

  const goalRef = doc(db, "goals", id);

  // =========================
  // EDIT
  // =========================
  if (button.classList.contains("edit")) {

    const goalSnap = await getDoc(goalRef);
    const goal = goalSnap.data();

    openEditModal({ id, ...goal });
    return;
  }
// получаем goal для plus/minus
const goalSnap = await getDoc(goalRef);
const goal = goalSnap.data();
  // =========================
  // =========================
// PLUS
// =========================
if (button.classList.contains("plus")) {

  if (goal.current < goal.target) {

    const newCurrent = goal.current + 1;

    // instant UI update
    updateGoalCard(id, {
      current: newCurrent,
      target: goal.target,
      completed: newCurrent >= goal.target
    });

    // firebase in background
    await updateDoc(goalRef, {
      current: newCurrent,
      completed: newCurrent >= goal.target
    });
  }

  return;
}

// =========================
// MINUS
// =========================
if (button.classList.contains("minus")) {

  if (goal.current > 0) {

    const newCurrent = goal.current - 1;

    // instant UI update
    updateGoalCard(id, {
      current: newCurrent,
      target: goal.target,
      completed: false
    });

    // firebase in background
    await updateDoc(goalRef, {
      current: newCurrent,
      completed: false
    });
  }

  return;
}
});
  // =========================
// MODAL (EDIT)
// =========================
function openEditModal(goal) {
  editingGoalId = goal.id;

  document.getElementById("editTitle").value = goal.title;
  document.getElementById("editTarget").value = goal.target;
  document.getElementById("editReward").value = goal.reward || "";

  document.getElementById("editModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("editModal").classList.add("hidden");
  editingGoalId = null;
}

document.getElementById("saveEdit").onclick = async () => {

  if (!editingGoalId) return;

  const goalRef = doc(db, "goals", editingGoalId);

  const newTitle = document.getElementById("editTitle").value.trim();
  const newTarget = Number(document.getElementById("editTarget").value);
  const newReward = document.getElementById("editReward").value;

  if (!newTitle || !newTarget || newTarget <= 0) return;

  await updateDoc(goalRef, {
    title: newTitle,
    target: newTarget,
    reward: newReward || ""
  });

  closeModal();
  loadGoals();
};

document.getElementById("cancelEdit").onclick = closeModal;

document.getElementById("editModal").onclick = (e) => {
  if (e.target.id === "editModal") {
    closeModal();
  }
};

// =========================
// ENTER SUPPORT
// =========================
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addBtn.click();
});

// =========================
// SW
// =========================
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}

// =========================
// INIT
// =========================
loadGoals();
