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

const goalsContainer = document.getElementById("goals");
const themes = [
  "theme-pink",
  "theme-purple",
  "theme-blue",
  "theme-holo",
  "theme-star"
];
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

  // completed goals go to bottom
  goalsArray.sort((a, b) => {
    return a.completed - b.completed;
  });

  goalsArray.forEach((goal) => {

    const progressPercent =
      (goal.current / goal.target) * 100;

    const card = document.createElement("div");

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
        <button class="minus" data-id="${goal.id}">
          ➖
        </button>

        <button class="plus" data-id="${goal.id}">
          ➕
        </button>
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

      let diff =
        e.touches[0].clientX - startX;

      if (diff < -40) {
        card.style.transform =
          `translateX(${diff}px)`;

        card.style.opacity = "0.7";
      }
    });

    card.addEventListener("touchend", async (e) => {

      let diff =
        e.changedTouches[0].clientX - startX;

      if (diff < -120) {

        await deleteDoc(
          doc(db, "goals", goal.id)
        );

        loadGoals();

      } else {

        card.style.transform =
          "translateX(0)";

        card.style.opacity = "1";
      }
    });

    goalsContainer.appendChild(card);
  });
}

// =========================
// ADD GOAL
// =========================

const addBtn =
  document.getElementById("addBtn");

addBtn.onclick = async () => {

  const title =
    document.getElementById("title").value;

  const target = Number(
    document.getElementById("target").value
  );

  const reward =
    document.getElementById("reward").value;

  if (!title || target <= 0) return;

  await addDoc(collection(db, "goals"), {
    title: title,
    target: target,
    current: 0,
    reward: reward || "",
    completed: false,
    theme:
  themes[
    Math.floor(Math.random() * themes.length)
  ],
  });

  // clear form
  document.getElementById("title").value = "";
  document.getElementById("target").value = "";
  document.getElementById("reward").value = "";

  loadGoals();
};

// =========================
// PLUS / MINUS
// =========================

document.addEventListener(
  "click",
  async (e) => {

    const id = e.target.dataset.id;

    if (!id) return;

    const goalRef =
      doc(db, "goals", id);

    const goalSnap =
      await getDoc(goalRef);

    const goal =
      goalSnap.data();

    // PLUS
    if (
      e.target.classList.contains("plus")
    ) {

      if (goal.current < goal.target) {

        const newCurrent =
          goal.current + 1;

        await updateDoc(goalRef, {
          current: newCurrent,
          completed:
            newCurrent >= goal.target
        });
      }
    }

    // MINUS
    if (
      e.target.classList.contains("minus")
    ) {

      if (goal.current > 0) {

        await updateDoc(goalRef, {
          current: goal.current - 1,
          completed: false
        });
      }
    }

    loadGoals();
  }
);

// =========================
// ENTER KEY SUPPORT
// =========================

document.addEventListener(
  "keydown",
  (e) => {

    if (e.key === "Enter") {
      addBtn.click();
    }
  }
);

// =========================
// SERVICE WORKER
// =========================

if ("serviceWorker" in navigator) {

  navigator.serviceWorker
    .register("sw.js");
}

// =========================
// INIT
// =========================

loadGoals();
if (e.target.classList.contains("edit")) {
  const id = e.target.dataset.id;

  const goalRef = doc(db, "goals", id);
  const goalSnap = await getDoc(goalRef);
  const goal = goalSnap.data();

  const newTitle = prompt("Edit title:", goal.title);
  if (!newTitle) return;

  const newTarget = Number(prompt("Edit target:", goal.target));
  if (!newTarget || newTarget <= 0) return;

  const newReward = prompt("Edit reward:", goal.reward || "");

  await updateDoc(goalRef, {
    title: newTitle,
    target: newTarget,
    reward: newReward || ""
  });

  loadGoals();
}

let editingGoalId = null;
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
if (e.target.classList.contains("edit")) {
  const id = e.target.dataset.id;

  const goalRef = doc(db, "goals", id);
  const goalSnap = await getDoc(goalRef);

  openEditModal({
    id,
    ...goalSnap.data()
  });
}
document.getElementById("saveEdit").onclick = async () => {
  const goalRef = doc(db, "goals", editingGoalId);

  const newTitle = document.getElementById("editTitle").value;
  const newTarget = Number(document.getElementById("editTarget").value);
  const newReward = document.getElementById("editReward").value;

  if (!newTitle || newTarget <= 0) return;

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
