// js/piket.js
import { db } from "./firebase.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function initPiket(users) {
  const list = document.getElementById("piketList");
  list.innerHTML = "";

  users.forEach(u => {
    const li = document.createElement("li");
    li.textContent = u.name;
    li.dataset.id = u.id;
    list.appendChild(li);
  });

  new Sortable(list, {
    animation: 150,
    onEnd: () => saveOrder()
  });
}

async function saveOrder() {
  const order = [...document.querySelectorAll("#piketList li")]
    .map(li => li.dataset.id);

  await setDoc(doc(db, "piket_order", "main"), { order });
}
