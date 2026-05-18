import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const goalsContainer = document.getElementById("goals");

async function loadGoals() {

  const querySnapshot = await getDocs(collection(db, "goals"));

  goalsContainer.innerHTML = "";

  querySnapshot.forEach((goalDoc) => {

    const goal = goalDoc.data();

    const card = document.createElement("div");
    card.className = "goal-card";

    let heartsHTML = "";

    for (let i = 0; i < goal.target; i++) {

      const filled = i < goal.current;

      heartsHTML += `
        <span
          class="heart"
          data-id="${goalDoc.id}"
          data-index="${i}"
        >
          ${filled ? "❤️" : "🤍"}
        </span>
      `;
    }

    card.innerHTML = `
      <h2>${goal.title}</h2>

      <div>
        ${goal.current}/${goal.target}
      </div>

      <div class="hearts">
        ${heartsHTML}
      </div>
    `;

    goalsContainer.appendChild(card);
  });

  addHeartListeners();
}

function addHeartListeners() {

  document.querySelectorAll(".heart").forEach((heart) => {

    heart.addEventListener("click", async () => {

      const goalId = heart.dataset.id;
      const index = Number(heart.dataset.index);

      const goalRef = doc(db, "goals", goalId);

      await updateDoc(goalRef, {
        current: index + 1
      });

      loadGoals();
    });
  });
}

loadGoals();