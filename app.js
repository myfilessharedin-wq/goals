import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const goalsContainer = document.getElementById("goals");

async function loadGoals() {
  const snapshot = await getDocs(collection(db, "goals"));

  goalsContainer.innerHTML = "";

  snapshot.forEach((goalDoc) => {
    const goal = goalDoc.data();

    let hearts = "";

    for (let i = 0; i < goal.target; i++) {
      hearts += `
        <span class="heart">
          ${i < goal.current ? "❤️" : "🤍"}
        </span>
      `;
    }

    const div = document.createElement("div");
    div.className = "goal-card";

    div.innerHTML = `
      <h2>${goal.title}</h2>

      <div>🎁 Reward: <b>${goal.reward || "—"}</b></div>

      <div style="margin: 8px 0;">
        ${goal.current}/${goal.target}
      </div>

      <div class="hearts">
        ${hearts}
      </div>

      <div style="margin-top:10px;">
        <button class="minus" data-id="${goalDoc.id}">➖</button>
        <button class="plus" data-id="${goalDoc.id}">➕</button>
      </div>
    `;

    goalsContainer.appendChild(div);
  });
}

// ➕ / ➖ логика
document.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  const goalRef = doc(db, "goals", id);
  const goalSnap = await getDoc(goalRef);
  const goal = goalSnap.data();

  if (e.target.classList.contains("plus")) {
    if (goal.current < goal.target) {
      await updateDoc(goalRef, {
        current: goal.current + 1
      });
    }
  }

  if (e.target.classList.contains("minus")) {
    if (goal.current > 0) {
      await updateDoc(goalRef, {
        current: goal.current - 1
      });
    }
  }

  loadGoals();
});

loadGoals();
