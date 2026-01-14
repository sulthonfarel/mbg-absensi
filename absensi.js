// js/absensi.js
import { db } from "./firebase.js";
import {
  addDoc, collection, doc, updateDoc, increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function submitAbsensi(u1, u2) {
  const tanggal = new Date().toISOString().split("T")[0];

  await addDoc(collection(db, "absensi"), {
    tanggal,
    pengambil: [u1, u2],
    status: "normal"
  });

  await updateDoc(doc(db, "users", u1), { ambil: increment(1) });
  await updateDoc(doc(db, "users", u2), { ambil: increment(1) });
}
