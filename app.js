import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const goalsContainer = document.getElementById("goals");

console.log("APP LOADED");

// =====================
// LOAD GOALS
// =====================
async function loadGoals() {
  const snapshot = await getDocs(collection(db, "goals"));

  goalsContainer.innerHTML = "";

  snapshot.forEach((goalDoc) => {
    const goal = goalDoc.data();

    let hearts = "";

    for (let i = 0; i < goal.target; i++) {
      hearts += `<span>${i < goal.current ? "❤️" : "🤍"}</span>`;
    }

    const card = document.createElement("div");
    card.className = goal.completed ? "goal-card done" : "goal-card";

    card.innerHTML = `
      <h2>${goal.title}</h2>
      <div>🎁 Reward: <b>${goal.reward || "—"}</b></div>
      <div>${goal.current}/${goal.target}</div>
      <div>${hearts}</div>

      <button class="minus" data-id="${goalDoc.id}">➖</button>
      <button class="plus" data-id="${goalDoc.id}">➕</button>
    `;

    goalsContainer.appendChild(card);
  });
}

// =====================
// ADD GOAL
// =====================
document.getElementById("addBtn").addEventListener("click", async () => {

  const title = document.getElementById("title").value;
  const target = Number(document.getElementById("target").value);
  const reward = document.getElementById("reward").value;

  if (!title || !target) return;

  await addDoc(collection(db, "goals"), {
    title,
    target,
    current: 0,
    reward: reward || "",
    completed: false
  });

  document.getElementById("title").value = "";
  document.getElementById("target").value = "";
  document.getElementById("reward").value = "";

  loadGoals();
});

// =====================
// PLUS / MINUS
// =====================
document.addEventListener("click", async (e) => {

  const id = e.target.dataset.id;
  if (!id) return;

  const goalRef = doc(db, "goals", id);
  const goalSnap = await getDoc(goalRef);
  const goal = goalSnap.data();

  if (e.target.classList.contains("plus")) {

    if (goal.current < goal.target) {
      const newCurrent = goal.current + 1;

      await updateDoc(goalRef, {
        current: newCurrent,
        completed: newCurrent >= goal.target
      });
    }
  }

  if (e.target.classList.contains("minus")) {

    if (goal.current > 0) {
      await updateDoc(goalRef, {
        current: goal.current - 1,
        completed: false
      });
    }
  }

  loadGoals();
});

// =====================
loadGoals();
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
