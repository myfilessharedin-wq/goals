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

  const goalsArray = [];

  snapshot.forEach((goalDoc) => {
    goalsArray.push({
      id: goalDoc.id,
      ...goalDoc.data()
    });
  });

  // completed вниз
  goalsArray.sort((a, b) => {
    return a.completed - b.completed;
  });

  goalsArray.forEach((goal) => {

    let hearts = "";

    for (let i = 0; i < goal.target; i++) {
      hearts += `
        <span>
          ${i < goal.current ? "❤️" : "🤍"}
        </span>
      `;
    }

    const card = document.createElement("div");

    card.className = goal.completed
      ? "goal-card done"
      : "goal-card";

    card.innerHTML = `
      <h2>${goal.title}</h2>

      ${goal.completed ? "<div>🏆 DONE</div>" : ""}

      <div>
        🎁 Reward: <b>${goal.reward || "—"}</b>
      </div>

      <div style="margin:8px 0;">
        ${goal.current}/${goal.target}
      </div>

   <div class="progress-wrapper">

  <div class="progress-bar">
    <div 
      class="progress-fill"
      style="width: ${(goal.current / goal.target) * 100}%">
    </div>
  </div>

  <div class="progress-text">
    💖 ${goal.current} / ${goal.target}
  </div>

</div>

      <div style="margin-top:10px;">
        <button class="minus" data-id="${goal.id}">➖</button>
        <button class="plus" data-id="${goal.id}">➕</button>
      </div>
    `;

    goalsContainer.appendChild(card);
  });
}

    card.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
  currentCard = card;
});

card.addEventListener("touchmove", (e) => {
  if (!currentCard) return;

  let diff = e.touches[0].clientX - startX;

  if (diff < -50) {
    currentCard.style.transform = `translateX(${diff}px)`;
    currentCard.style.opacity = "0.7";
  }
});

card.addEventListener("touchend", async (e) => {
  let diff = e.changedTouches[0].clientX - startX;

  if (diff < -120) {
    // swipe delete
    await deleteDoc(doc(db, "goals", goalDoc.id));
    loadGoals();
  } else {
    currentCard.style.transform = "translateX(0)";
    currentCard.style.opacity = "1";
  }

  currentCard = null;
});

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
let startX = 0;
let currentCard = null;

import { deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
