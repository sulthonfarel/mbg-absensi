// js/main.js
import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initPiket } from "./piket.js";
import { submitAbsensi } from "./absensi.js";

async function loadUsers() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

(async () => {
  const users = await loadUsers();
  initPiket(users);

  document.getElementById("submitAbsensi").onclick = async () => {
    const u1 = pengambil1.value;
    const u2 = pengambil2.value;
    await submitAbsensi(u1, u2);
    alert("Absensi tercatat");
  };
})();
