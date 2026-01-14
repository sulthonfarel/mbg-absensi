# 📦 MBG Absensi PKL - Aplikasi Web Piket Pengambilan MBG Universitas Majalengka

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** 14 Januari 2026

---

## Deskripsi

Aplikasi web sederhana untuk manajemen absensi pengambilan MBG siswa PKL. Dirancang untuk 16 siswa dengan fitur:

- ✅ Manajemen urutan piket (drag & drop)
- ✅ Pencatatan absensi otomatis
- ✅ Sistem penggantian dengan tracking utang
- ✅ Patungan transport transparan
- ✅ Rekapitulasi lengkap

---

##  Mulai Cepat

### 1. Konfigurasi Firebase

Aplikasi ini menggunakan **Firebase Firestore** sebagai database. Ikuti langkah berikut:

#### Step A: Buat Firebase Project
1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Klik **"Create Project"**
3. Nama project: `mbg-absensi` (atau terserah)
4. Klik **"Create"**

#### Step B: Setup Firestore Database
1. Di sidebar kiri, pilih **"Firestore Database"**
2. Klik **"Create Database"**
3. Pilih mode **"Start in test mode"** (untuk development)
4. Pilih region: **asia-southeast1** (Indonesia, tercepat)
5. Klik **"Create"**

#### Step C: Dapatkan Firebase Config
1. Pergi ke **Project Settings** (⚙️ icon di atas)
2. Scroll ke bawah, copy config object (jangan lupa tombol copy)
3. Edit [js/firebase.js](js/firebase.js):
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

#### Step D: Setup Firestore Security Rules
Di Firestore console, buka tab **"Rules"** dan ganti dengan:
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write untuk testing & internal use
    // ⚠️ Jangan pakai ini di production tanpa auth!
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Klik **"Publish"**.

### 2. Buka Aplikasi di Browser

1. Open [index.html](index.html) di browser
2. Atau host di Firebase Hosting (lihat [Deployment](#-deployment))

---

## 📁 Struktur Folder

```
mbg-absensi/
├── index.html                          # Main HTML
├── css/
│   └── style.css                       # Styling (responsive, modern)
├── js/
│   ├── firebase.js                     # Firebase config & utilities
│   ├── piket.js                        # Piket management
│   ├── absensi.js                      # Absensi logic
│   ├── iuran.js                        # Payment tracking
│   └── main.js                         # App initialization
├── PROMPT_AND_TECHNICAL_DESIGN.md      # Technical documentation
└── README.md                           # This file
```

---

## 📖 Panduan Penggunaan

### Tab 1: 📋 Piket Order
**Fungsi:** Atur urutan siswa untuk pengambilan MBG

- **Cara:** Drag nama siswa untuk mengubah urutan
- **2 teratas** akan menjadi pengambil MBG berikutnya
- Klik **"Simpan Urutan"** untuk menyimpan ke database
- Klik **"Reset"** untuk kembali ke urutan default

### Tab 2: ✍️ Ambil MBG
**Fungsi:** Catat pengambilan MBG & handle penggantian

1. **Pengambil otomatis** dari 2 teratas piket
2. **Jika ada yang berhalangan:**
   - Check box **"Pengambil X menggantikan"**
   - Pilih siswa pengganti dari dropdown (hanya yang `ambil = 0`)
3. **Optional:** Tambah catatan (misal: alasan berhalangan)
4. Klik **"Submit Absensi"** untuk simpan

**Logika Otomatis:**
- `ambil` pengambil += 1
- Jika penggantian:
  - Yang diganti: `utang += 1`
  - Yang menggantikan: `utang -= 1`

### Tab 3: 💰 Iuran Transport
**Fungsi:** Tracking pembayaran patungan MBG

- **Biaya:** Rp1.000 per siswa per pengambilan
- **Cara:** Check nama siswa yang sudah bayar
- **Simpan:** Perubahan otomatis tersimpan
- **Summary:** Lihat total terkumpul vs seharusnya

### Tab 4: 📊 Rekapitulasi
**Fungsi:** Lihat transparansi lengkap

**Sub-Tab:**
1. **Riwayat Pengambilan** - Log semua pengambilan MBG
2. **Status Utang** - Siswa dengan utang penggantian
3. **Status Pembayaran** - Tracking iuran per siswa

---

## 🔧 Technical Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Database** | Firebase Firestore (NoSQL) |
| **Drag & Drop** | SortableJS |
| **Hosting** | Firebase Hosting (optional) |

---

## 🔐 Security Notes

### Development Mode ✅
Aplikasi ini setup dengan `test mode` untuk development/internal use:
- Tidak ada login
- Tidak ada file upload
- Hanya data text-based (nama + angka)

### Production Mode ⚠️
Jika ingin production di server publik, update security rules:
```javascript
match /{document=**} {
  allow read, write: if request.auth != null;
}
```
Dan implementasi authentication system.

---

## 📊 Firestore Schema

### Collection: `users`
```json
{
  "id": "farel_rahman",
  "name": "Farel Rahman",
  "ambil": 2,
  "utang": -1,
  "created_at": 1705088400000
}
```

### Collection: `piket_order`
```json
{
  "id": "current",
  "order": ["user_id_1", "user_id_2", ...],
  "last_updated": 1705088400000
}
```

### Collection: `absensi`
```json
{
  "id": "absensi_1705088400000",
  "tanggal": "2026-01-13",
  "pengambil": ["user_id_1", "user_id_2"],
  "pengambil_nama": ["Farel Rahman", "Andi Suryanto"],
  "status_ambil": ["normal", "pengganti"],
  "pengganti": [null, "user_id_3"],
  "diganti_dari": [null, "user_id_2"],
  "catatan": "Andi berhalangan",
  "timestamp": 1705088400000
}
```

### Collection: `iuran`
```json
{
  "id": "absensi_1705088400000",
  "tanggal": "2026-01-13",
  "pengambil": ["user_id_1", "user_id_2"],
  "bayar": {
    "farel_rahman": true,
    "andi_suryanto": false,
    ...
  },
  "created_at": 1705088400000
}
```

---

## 🚀 Deployment (Firebase Hosting)

### Opsi 1: Command Line

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login ke Firebase
firebase login

# Initialize project
firebase init hosting

# Select existing project: mbg-absensi

# Deploy
firebase deploy
```

### Opsi 2: Firebase Console

1. Buka Firebase Console → Hosting
2. Klik **"Connect Repository"** atau **"Start without git"**
3. Upload folder project
4. Done! URL otomatis tersedia

**Result:** Aplikasi live di `https://mbg-absensi-xxxxx.firebaseapp.com`

---

## 📱 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Android)

---

## 🐛 Troubleshooting

### Error: "Firebase initialization failed"
**Solusi:**
- Check Firebase config di `js/firebase.js`
- Pastikan Firestore database sudah dibuat
- Check internet connection

### Drag & drop tidak berfungsi
**Solusi:**
- Refresh halaman (F5)
- Check browser console untuk error (F12)
- SortableJS CDN mungkin blocked

### Data tidak muncul
**Solusi:**
- Check Firestore Console → Data sudah ada?
- Clear browser cache (Ctrl+Shift+Delete)
- Check browser console untuk error

### Bagaimana reset semua data?
**Solusi:**
1. Buka Firestore Console
2. Pilih collection, klik 3 dots → Delete collection
3. Repeat untuk semua collection
4. Refresh app → akan auto-create dengan default data

---

## 📋 Checklist Pre-Launch

- [ ] Firebase project created & Firestore enabled
- [ ] Firebase config update di `js/firebase.js`
- [ ] Security rules published
- [ ] Test di local (open index.html)
- [ ] Test features:
  - [ ] Drag piket order
  - [ ] Submit absensi
  - [ ] Test substitusi dengan filter pengganti
  - [ ] Update payment checklist
  - [ ] Check recap tables
- [ ] Deploy (Firebase Hosting)
- [ ] Share link ke siswa

---

## 🔄 Real-time Updates

Aplikasi menggunakan Firestore real-time listeners:
- Piket order updates real-time
- User data sync instant
- Iuran checklist live update
- Multi-user safe (no conflict)

---

## 💾 Backup Data

### Export dari Firestore
```bash
firestore-export \
  --accountKey ./serviceAccountKey.json \
  --backupPath ./backup
```

### Import ke Firestore
```bash
firestore-import \
  --accountKey ./serviceAccountKey.json \
  --backupPath ./backup
```

---

## 📞 Support & Questions

- **Bug Report:** Check console (F12) untuk error detail
- **Documentation:** Lihat [PROMPT_AND_TECHNICAL_DESIGN.md](PROMPT_AND_TECHNICAL_DESIGN.md)
- **Firebase Docs:** https://firebase.google.com/docs

---

## 📄 License

Aplikasi ini gratis untuk digunakan & dimodifikasi (S&K Berlaku). Dibuat dengan ❤️ untuk PKL Universitas Majalengka.
** Syarat & Ketentuan **

- Segala bentuk kegiatan dalam proyek ini, termasuk **penggunaan, modifikasi, maupun penyalinan**, **wajib mendapatkan izin tertulis dari author**.  
  📧 Kontak: **sulthon.farel29@gmail.com**

- Proyek ini **tidak diperbolehkan untuk diperjualbelikan**, baik sebagian maupun keseluruhan, tanpa persetujuan dari author.

- Dilarang mengklaim proyek ini sebagai karya pribadi, baik secara langsung maupun tidak langsung.

- Apabila proyek ini digunakan untuk keperluan **akademik, pembelajaran, atau penelitian**, **wajib mencantumkan kredit kepada author**.

- Author berhak **mengubah syarat dan ketentuan** ini sewaktu-waktu tanpa pemberitahuan sebelumnya.

- Segala risiko yang timbul dari penggunaan proyek ini sepenuhnya menjadi **tanggung jawab pengguna**.

---

## 🎓 Notes Untuk Developer

### Menambah Siswa
Edit `initializeUsers()` di `js/main.js`:
```javascript
const defaultUsers = [
  'Nama Baru 1',
  'Nama Baru 2',
  // ...
];
```

### Mengubah Biaya Iuran
Edit cost constant di `js/iuran.js`:
```javascript
const costPerStudent = 2000; // Default 1000
```

### Customize Styling
Edit `css/style.css`:
- Colors: update CSS variables di `:root`
- Fonts: ubah `font-family` di `body`
- Layout: adjust grid/flex values

---

**Made with ❤️ for MBG Absensi PKL Universitas Majalengka**  
** Auth: Sulthon Farel Abdur Qois **
v1.0.0 | 13 Januari 2026
