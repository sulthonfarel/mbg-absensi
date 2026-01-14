# 🎓 APLIKASI ABSENSI MBG SISWA PKL
## Prompt + Dokumen Perancangan Teknis

**Dibuat:** 13 Januari 2026  
**Status:** Siap Production  
**Target:** 16 Siswa PKL  

---

# 🔧 PROMPT UTAMA (PRODUCTION-READY)

> **Prompt ini bisa kamu pakai langsung ke ChatGPT / Claude / Copilot buat generate kode.**

---

## Prompt:

Buatkan sebuah aplikasi web sederhana untuk **absensi pengambilan MBG siswa PKL** dengan ketentuan berikut:

### 📋 Spesifikasi Umum

- **Total user:** 16 orang siswa
- **Platform:** Web (HTML, CSS, JavaScript)
- **Database:** Firebase Firestore (free tier)
- **File upload:** TIDAK ADA (semua data text-based)

---

### ✨ Fitur Utama

#### 1. Manajemen Urutan Piket (Drag & Drop)
- Daftar nama siswa dapat diatur urutannya secara manual menggunakan drag and drop
- Urutan ini berfungsi sebagai **antrian piket pengambilan MBG**
- Simpan urutan ke Firestore real-time

#### 2. Sistem Pengambilan MBG
- Setiap pengambilan dilakukan oleh **2 orang siswa sekaligus**
- Ambil dari 2 siswa teratas urutan piket
- Jika siswa berhalangan → **posisinya bisa diganti** oleh siswa lain

#### 3. Sistem Penggantian (Substitusi)
- Jika ada siswa yang **tidak bisa mengambil**, dia bisa diganti
- **Syarat pengganti:** Siswa yang belum pernah mengambil MBG (`ambil === 0`)
- Sistem otomatis memfilter, hanya tampilkan siswa dengan `ambil = 0`

#### 4. Absensi & Pencatatan
- Setiap pengambilan MBG dicatat dengan:
  - Tanggal pengambilan
  - Nama 2 pengambil
  - Status: `normal` atau `menggantikan`
  - Jika ada penggantian, catat siapa yang diganti
- Simpan ke Firestore collection `absensi`

#### 5. Sistem Utang (Debt Tracking)
Jika terjadi penggantian:
- **Siswa yang diganti** → `utang += 1`
- **Siswa yang menggantikan** → `utang -= 1`

Logika: Yang diganti punya hutang, yang gantiin kurangi hutangnya

#### 6. Data Siswa
Setiap siswa menyimpan:
- `name` - Nama lengkap
- `ambil` - Jumlah kali mengambil MBG
- `utang` - Jumlah utang penggantian

#### 7. Tabel Patungan Transport MBG
- **Biaya per pengambilan:** Rp1.000 per siswa (2 siswa = Rp2.000)
- Tabel checklist pembayaran untuk setiap absensi
- Tandai siapa yang sudah / belum membayar
- Data tersimpan per absensi

#### 8. Rekap & Transparansi
Tampilkan 3 bagian recapitulation:

**a) Riwayat Pengambilan MBG**
- Tanggal, siapa yang ambil, status (normal/pengganti)

**b) Status Utang Setiap Siswa**
- List siswa + jumlah utang mereka
- Highlight yang punya utang

**c) Status Pembayaran Transport**
- Tabel siapa yang sudah / belum bayar
- Total yang terkumpul

#### 9. Syarat & Ketentuan (Static Section)
Tampilkan bagian fixed di bawah aplikasi dengan aturan:
- Pengambilan MBG dilakukan 2 orang per sesi
- Absensi wajib diisi setiap kali ada pengambilan
- Penggantian tetap dihitung sebagai utang
- Iuran transport wajib dibayar
- Semua data bersifat transparan untuk semua

---

### 🛠️ Spesifikasi Teknis

#### Database Firestore

**Collection: `users`**
```
Documents:
- id: "nama_siswa"
- data:
  {
    "name": "Farel",
    "ambil": 0,
    "utang": 0
  }
```

**Collection: `piket_order`**
```
Single document: "current"
- data:
  {
    "order": ["siswa1", "siswa2", "siswa3", ...]
  }
```

**Collection: `absensi`**
```
Documents: auto-generated (timestamp-based)
- data:
  {
    "tanggal": "2026-01-13",
    "pengambil": ["farel", "andi"],
    "status_ambil": ["normal", "normal"],
    "pengganti": [null, null],
    "diganti_dari": [null, null],
    "timestamp": 1705088400000
  }
```

**Collection: `iuran`**
```
Documents: auto-generated
- data:
  {
    "absensi_id": "doc-id-dari-absensi",
    "tanggal": "2026-01-13",
    "bayar": {
      "farel": true,
      "andi": false,
      "dika": true
    }
  }
```

#### Frontend Stack

- **HTML5** - Semantic struktur
- **CSS** - Grid/Flexbox (Tailwind atau plain CSS)
- **JavaScript (Vanilla)** - Logic dan Firebase integration
- **SortableJS** - Library drag & drop

#### File Structure

```
/mbg-absensi
├── index.html           # Main HTML
├── css/
│   └── style.css        # All styling
├── js/
│   ├── firebase.js      # Firebase config & helpers
│   ├── piket.js         # Piket order management
│   ├── absensi.js       # Absensi logic
│   ├── iuran.js         # Payment tracking
│   └── main.js          # App initialization
└── README.md
```

---

### 🎯 User Flow

1. **Buka aplikasi** → Muat data dari Firestore
2. **Lihat urutan piket** → Bisa drag-drop urutannya
3. **Ambil MBG:**
   - Klik button "Ambil MBG"
   - Auto-detect 2 teratas
   - Jika ada pengganti → select dari filter (ambil=0)
   - Submit absensi
4. **Isi pembayaran** → Checklist iuran transport
5. **Lihat rekapitulasi:**
   - Riwayat
   - Status utang
   - Status pembayaran

---

### ✅ Validasi & Rules

- Pengganti **harus** punya `ambil === 0`
- Hanya **2 pengambil** per absensi
- Satu absensi = **1 record iuran**
- Tidak boleh ada siswa yang ambil 2x dalam sehari
- Timestamp otomatis dicatat

---

### 📊 Harapan Output Kode

1. Struktur folder & file sudah di-setup
2. Skema Firestore jelas dan siap di-initialize
3. Contoh code untuk main features:
   - Load & render users
   - Drag-drop piket order
   - Filter pengganti
   - Submit absensi
   - Render recap tables
4. Penjelasan logic per function
5. Tips Firebase security rules (basic)

---

---

# 📐 DOKUMEN PERANCANGAN TEKNIS (TDD)

## Executive Summary

Aplikasi absensi MBG adalah sistem manajemen piket untuk 16 siswa PKL yang:
- ✅ Adil (tracking utang & pembayaran transparan)
- ✅ Fleksibel (support penggantian)
- ✅ Ringan (no file upload, pure data)
- ✅ Gratis (Firebase free tier)
- ✅ Mudah dikelola (minimal dependencies)

---

## 1. Tujuan & Objektif

### Primary Goals
1. **Manajemen antrian piket** yang fleksibel dan mudah diatur
2. **Tracking absensi** setiap pengambilan MBG
3. **Sistem utang** yang fair untuk penggantian
4. **Transparansi keuangan** untuk patungan transport

### Success Metrics
- Semua 16 siswa data tercatat dengan benar
- Tidak ada duplikasi record
- Real-time sync dengan Firestore
- UI responsif & mudah digunakan
- Zero bugs dalam kalkulasi utang

---

## 2. Tech Stack

### Frontend

| Layer | Tool | Alasan |
|-------|------|--------|
| **HTML** | HTML5 Semantic | Native, no build tool |
| **CSS** | Vanilla CSS / Tailwind | Simple & maintainable |
| **JS** | Vanilla ES6+ | No framework overhead |
| **Drag-Drop** | SortableJS | Lightweight, battle-tested |

### Backend / Database

| Service | Tool | Alasan |
|---------|------|--------|
| **Database** | Firebase Firestore | Free, real-time, NoSQL |
| **Auth** | None (internal use) | Simple, no login needed |
| **Hosting** | Firebase Hosting | Free, fast, built-in CDN |

### Development

| Item | Tool |
|------|------|
| **Version Control** | Git |
| **Code Editor** | VS Code |
| **Testing** | Browser DevTools |

---

## 3. Arsitektur Sistem

### 3.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    WEB BROWSER (Client)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         HTML5 UI (Semantic Elements)                │   │
│  │  - Piket Order List                                 │   │
│  │  - Ambil MBG Form                                   │   │
│  │  - Iuran Checklist                                  │   │
│  │  - Recap Tables                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↕                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │       JavaScript Logic Layer (Client-side)          │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ main.js (App Initialization)                │   │   │
│  │  │ - Init Firestore listeners                  │   │   │
│  │  │ - Render initial UI                         │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ piket.js (Piket Management)                 │   │   │
│  │  │ - Load piket order                          │   │   │
│  │  │ - Handle drag-drop                          │   │   │
│  │  │ - Save order to Firestore                   │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ absensi.js (Absensi Logic)                  │   │   │
│  │  │ - Get 2 top piket                           │   │   │
│  │  │ - Filter pengganti (ambil=0)                │   │   │
│  │  │ - Submit absensi + update users             │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ iuran.js (Payment Tracking)                 │   │   │
│  │  │ - Load iuran checklist                      │   │   │
│  │  │ - Update payment status                     │   │   │
│  │  │ - Render recap tables                       │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ firebase.js (Firebase Utilities)            │   │   │
│  │  │ - Config initialization                     │   │   │
│  │  │ - CRUD helpers (get, set, update, delete)   │   │   │
│  │  │ - Real-time listeners                       │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│          ↕ HTTP/WebSocket (Real-time)                       │
├─────────────────────────────────────────────────────────────┤
│                  FIREBASE BACKEND (Cloud)                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         FIRESTORE DATABASE (NoSQL)                 │   │
│  │  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │ users        │  │ piket_order  │               │   │
│  │  │ collection   │  │ collection   │               │   │
│  │  └──────────────┘  └──────────────┘               │   │
│  │  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │ absensi      │  │ iuran        │               │   │
│  │  │ collection   │  │ collection   │               │   │
│  │  └──────────────┘  └──────────────┘               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

```
USER INTERACTION
        ↓
   JavaScript Handler (event listener)
        ↓
   Validate & Process Data
        ↓
   Call Firebase Helper (firebase.js)
        ↓
   Update Firestore Document
        ↓
   Real-time Listener Triggers
        ↓
   Re-render UI Component
```

---

## 4. Struktur Folder & File

```
/mbg-absensi/
│
├── index.html                          # Single HTML file (SPA)
│
├── css/
│   └── style.css                       # All styling (grid, flex, responsive)
│
├── js/
│   ├── firebase.js                     # Firebase config & utilities
│   │   - initFirebase()
│   │   - getCollection()
│   │   - setDocument()
│   │   - updateDocument()
│   │   - deleteDocument()
│   │   - onSnapshotListener()
│   │
│   ├── piket.js                        # Piket order management
│   │   - loadPiketOrder()
│   │   - initSortable()
│   │   - savePiketOrder()
│   │   - getPiketOrder()
│   │
│   ├── absensi.js                      # Absensi logic
│   │   - getTopTwoPiket()
│   │   - filterPengganti()
│   │   - submitAbsensi()
│   │   - updateUserAmbil()
│   │   - updateUserUtang()
│   │
│   ├── iuran.js                        # Payment tracking
│   │   - loadIuranChecklist()
│   │   - togglePaymentStatus()
│   │   - getIuranSummary()
│   │   - getTotalTerkumpul()
│   │
│   └── main.js                         # App initialization & routing
│       - initApp()
│       - setupEventListeners()
│       - renderUI()
│
├── PROMPT_AND_TECHNICAL_DESIGN.md      # This file
└── README.md                           # Quick start guide
```

---

## 5. Firestore Database Schema

### 5.1 Collection: `users`

**Purpose:** Menyimpan data setiap siswa

**Document Structure:**
```javascript
// Document ID: "farel" (lowercase, no spaces)
{
  "name": "Farel Rahman",           // string - Nama lengkap
  "ambil": 0,                       // number - Berapa kali sudah ambil MBG
  "utang": 0,                       // number - Utang penggantian (bisa negatif)
  "created_at": 1705088400000       // timestamp - Kapan data dibuat
}
```

**Indexes:** Tidak perlu index custom untuk collection ini

---

### 5.2 Collection: `piket_order`

**Purpose:** Menyimpan urutan piket pengambilan MBG

**Document Structure:**
```javascript
// Document ID: "current"
{
  "order": [
    "farel",
    "andi",
    "dika",
    "budi",
    // ... (total 16 siswa)
  ],
  "last_updated": 1705088400000    // timestamp
}
```

**Notes:**
- Hanya 1 document dalam collection ini
- Order array adalah urutan antrian piket
- Index 0-1 adalah 2 orang yang akan ambil berikutnya

---

### 5.3 Collection: `absensi`

**Purpose:** Mencatat setiap kali ada pengambilan MBG

**Document Structure:**
```javascript
// Document ID: auto-generated (e.g., "absensi_1705088400000")
{
  "tanggal": "2026-01-13",                        // string - Tanggal pengambilan
  "pengambil": ["farel", "andi"],                 // array[string] - 2 nama pengambil
  "status_ambil": ["normal", "normal"],           // array[string] - "normal" atau "pengganti"
  "pengganti": [null, "farel"],                   // array[string|null] - Siapa pengganti (null jika normal)
  "diganti_dari": [null, "budi"],                 // array[string|null] - Siapa yg diganti
  "timestamp": 1705088400000,                     // number - Unix timestamp
  "catatan": "Budi berhalangan",                  // string - Optional catatan
  "iuran_status": false                           // boolean - Sudah bayar iuran atau belum (di-update dari iuran collection)
}
```

**Notes:**
- Array `pengambil`, `status_ambil`, `pengganti`, `diganti_dari` selalu berukuran 2
- Index 0 = pengambil pertama, Index 1 = pengambil kedua
- Contoh penggantian:
  ```
  pengambil: ["farel", "dika"]
  status_ambil: ["normal", "pengganti"]
  diganti_dari: [null, "andi"]
  pengganti: [null, "dika"]
  
  Artinya: Farel ambil normal, Dika menggantikan Andi
  ```

---

### 5.4 Collection: `iuran`

**Purpose:** Tracking pembayaran transport MBG

**Document Structure:**
```javascript
// Document ID: same as absensi doc ID (e.g., "absensi_1705088400000")
{
  "absensi_id": "absensi_1705088400000",         // string - Reference ke absensi
  "tanggal": "2026-01-13",                       // string
  "pengambil": ["farel", "andi"],                // array[string] - 2 orang yg ambil
  "bayar": {                                     // object - Tracking pembayaran semua siswa
    "farel": true,
    "andi": false,
    "dika": true,
    // ... (16 siswa)
  },
  "created_at": 1705088400000                    // timestamp
}
```

**Notes:**
- Satu absensi = satu iuran checklist
- `bayar` object track semua 16 siswa (bukan hanya 2 pengambil)
- Total iuran per absensi = Rp2.000 (Rp1.000 x 2 orang)
- Tapi dibayar oleh semua 16 siswa secara collective (patungan)

---

### 5.5 Firestore Rules (Basic Security)

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write tanpa auth (internal use only)
    // IMPORTANT: Gunakan ini hanya untuk internal use!
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

---

## 6. Core Logic & Algorithms

### 6.1 Piket Management Logic

```
LOAD PIKET ORDER:
  1. Get document "current" from collection "piket_order"
  2. Extract array "order"
  3. Render siswa dalam UI dengan drag-drop enabled

SAVE PIKET ORDER:
  1. Listen to onEnd event dari SortableJS
  2. Capture new order array
  3. Update document "current" field "order" dengan new array
  4. Update last_updated timestamp
```

---

### 6.2 Ambil MBG Logic

```
GET TOP TWO PIKET:
  1. Load piket_order["current"]["order"]
  2. Return [order[0], order[1]]

FILTER PENGGANTI:
  1. Get all users collection
  2. Filter where ambil === 0
  3. Return filtered list untuk dropdown pilih pengganti

SUBMIT ABSENSI:
  INPUT:
    - pengambil1: string
    - pengambil2: string
    - status1: "normal" | "pengganti"
    - status2: "normal" | "pengganti"
    - diganti_dari1: string | null
    - diganti_dari2: string | null
  
  LOGIC:
    1. Validate: pengambil1 !== pengambil2 (no duplicate)
    2. Validate: jika status="pengganti", maka pengganti harus ambil===0
    3. Create absensi document dengan data di atas
    4. Create iuran document (bayar semua false initially)
    5. Update users:
       a. ambil += 1 untuk pengambil1 dan pengambil2
       b. Jika ada penggantian (diganti_dari !== null):
          - User yang diganti: utang += 1
          - User yang menggantikan: utang -= 1
    6. Remove pengambil dari piket_order atau rotate (aturan bisnis)
    7. Timestamp otomatis
  
  OUTPUT:
    - Absensi recorded
    - User data updated
    - Iuran checklist created
```

---

### 6.3 Iuran Logic

```
LOAD IURAN CHECKLIST:
  1. Get iuran document by absensi_id
  2. Extract object "bayar"
  3. Render checkbox untuk setiap siswa

UPDATE PAYMENT STATUS:
  INPUT:
    - iuran_id: string
    - siswa: string
    - status: boolean
  
  LOGIC:
    1. Get iuran document
    2. Update bayar[siswa] = status
    3. Save to Firestore

CALCULATE SUMMARY:
  1. Get all iuran documents
  2. Count total true values dalam all bayar objects
  3. Total terkumpul = count * Rp1.000
  
  ATAU (per absensi):
    1. Get specific iuran document
    2. Count true dalam bayar object
    3. Terkumpul untuk absensi ini = count * Rp1.000
```

---

### 6.4 Rekapitulasi Logic

```
RIWAYAT PENGAMBILAN MBG:
  1. Get all documents from absensi collection (sorted by timestamp DESC)
  2. For each doc:
     - Show tanggal, pengambil1, pengambil2, status1, status2
     - If penggantian ada: show diganti_dari + pengganti

STATUS UTANG:
  1. Get all users
  2. Filter where utang !== 0
  3. Sort by utang DESC (yang utang paling banyak di atas)
  4. Show name + utang value

STATUS PEMBAYARAN:
  1. Get all iuran documents
  2. Calculate:
     - Total bayar per siswa (sum of all true di bayar[siswa])
     - Total bayar keseluruhan
     - Total seharusnya = count(absensi) * 2 * Rp1.000
  3. Show tabel: nama | sudah bayar | belum bayar | total
```

---

## 7. User Interface Specification

### 7.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                       HEADER                                     │
│                  MBG Absensi PKL (Logo)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ TAB 1: PIKET ORDER (Active by default)                     │ │
│  │                                                             │ │
│  │  Drag & Drop Ordered List:                                │ │
│  │  1. [Farel Rahman]        ← drag                          │ │
│  │  2. [Andi Suryanto]        ← drag                          │ │
│  │  3. [Dika Pratama]         ← drag                          │ │
│  │  ...                                                       │ │
│  │  [Save Order] [Reset]                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ TAB 2: AMBIL MBG                                            │ │
│  │                                                             │ │
│  │  Pengambil 1: Farel Rahman (auto, dari piket)            │ │
│  │  Pengambil 2: Andi Suryanto (auto, dari piket)           │ │
│  │                                                             │ │
│  │  [✓] Pengambil 1 normal                                   │ │
│  │  [ ] Pengambil 1 menggantikan (choose pengganti)          │ │
│  │      → [Pilih siswa dengan ambil=0]                       │ │
│  │                                                             │ │
│  │  [✓] Pengambil 2 normal                                   │ │
│  │  [ ] Pengambil 2 menggantikan (choose pengganti)          │ │
│  │      → [Pilih siswa dengan ambil=0]                       │ │
│  │                                                             │ │
│  │  Catatan: [____________]                                  │ │
│  │                                                             │ │
│  │  [SUBMIT ABSENSI] [BATAL]                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ TAB 3: IURAN TRANSPORT                                      │ │
│  │                                                             │ │
│  │  Absensi Terakhir: 2026-01-13 (Farel, Andi)              │ │
│  │  Biaya: Rp2.000                                           │ │
│  │                                                             │ │
│  │  Pembayaran:                                              │ │
│  │  ☐ Farel Rahman                                          │ │
│  │  ☑ Andi Suryanto                                         │ │
│  │  ☐ Dika Pratama                                          │ │
│  │  ...                                                       │ │
│  │                                                             │ │
│  │  [SIMPAN] [RESET]                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ TAB 4: REKAPITULASI                                         │ │
│  │                                                             │ │
│  │  Sub-tabs:                                                │ │
│  │  [Riwayat] [Status Utang] [Pembayaran]                    │ │
│  │                                                             │ │
│  │  ▼ Riwayat Pengambilan MBG                               │ │
│  │  Tabel:                                                   │ │
│  │  Tanggal | Pengambil 1 | Pengambil 2 | Status | Pengganti │ │
│  │  2026-01-13 | Farel | Andi | Normal | - │                │ │
│  │  2026-01-10 | Dika | Budi | Pengganti | Dika ganti Budi │ │
│  │                                                             │ │
│  │  ▼ Status Utang Siswa                                     │ │
│  │  Tabel:                                                   │ │
│  │  Nama | Utang                                             │ │
│  │  Budi | +1                                                │ │
│  │  Dika | -1                                                │ │
│  │  (Siswa dengan utang 0 tidak ditampilkan)                 │ │
│  │                                                             │ │
│  │  ▼ Status Pembayaran Iuran                                │ │
│  │  Tabel:                                                   │ │
│  │  Nama | Sudah Bayar | Belum Bayar | Total (Rp)          │ │
│  │  Farel | 2 | 1 | Rp2.000                                 │ │
│  │  Andi | 1 | 2 | Rp1.000                                  │ │
│  │  (Baru) | 1 | 0 | Rp1.000                                │ │
│  │                                                             │ │
│  │  Total Terkumpul: Rp50.000 / Rp32.000 (48x)             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│ FOOTER: SYARAT & KETENTUAN (Static)                             │
│                                                                   │
│ 1. Pengambilan MBG dilakukan oleh 2 orang setiap kali          │ │
│ 2. Absensi wajib diisi setiap ada pengambilan                  │ │
│ 3. Penggantian tetap dihitung sebagai utang                    │ │
│ 4. Iuran transport wajib dibayar (Rp1.000 / orang / absensi)  │ │
│ 5. Semua data bersifat transparan untuk semua siswa            │ │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│ Last Updated: 2026-01-13 15:45:00 | Connected to Firebase ✓   │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Responsive Design

- **Desktop (≥768px):** Multi-column layout, tab-based navigation
- **Tablet (480-767px):** Single column, hamburger menu untuk tabs
- **Mobile (<480px):** Stacked layout, touch-friendly buttons

### 7.3 Color Scheme

| Element | Color | Hex |
|---------|-------|-----|
| Primary | Blue | #3B82F6 |
| Success | Green | #10B981 |
| Warning | Orange | #F59E0B |
| Danger | Red | #EF4444 |
| Neutral | Gray | #6B7280 |

---

## 8. Key Features Detail

### 8.1 Drag & Drop Piket

**Library:** SortableJS

**Implementation:**
```javascript
// Di index.html
<ul id="piketList" class="piket-sortable">
  <li class="piket-item" draggable="true">Farel</li>
  <li class="piket-item" draggable="true">Andi</li>
  ...
</ul>

// Di piket.js
const sortable = Sortable.create(document.getElementById('piketList'), {
  animation: 150,
  onEnd: function(evt) {
    const newOrder = sortable.toArray(); // Get new order
    savePiketOrder(newOrder);
  }
});
```

---

### 8.2 Filter Pengganti Otomatis

**Logic:**
```javascript
function filterPengganti() {
  const allUsers = await getCollection('users');
  return allUsers.filter(user => user.ambil === 0).map(u => u.name);
}

// Di HTML
<select id="penggantiSelect">
  <option value="">-- Pilih Pengganti --</option>
  <!-- Diisi dinamis oleh filterPengganti() -->
</select>
```

---

### 8.3 Real-time Sync

**Menggunakan Firestore Listener:**
```javascript
// Listen to piket_order changes
onSnapshot(doc(db, "piket_order", "current"), (doc) => {
  if (doc.exists()) {
    const order = doc.data().order;
    renderPiketList(order);
  }
});

// Listen to users changes
onSnapshot(collection(db, "users"), (snapshot) => {
  const users = [];
  snapshot.forEach((doc) => {
    users.push({ id: doc.id, ...doc.data() });
  });
  renderUsersList(users);
});
```

---

## 9. Validasi & Business Rules

### 9.1 Input Validation

| Input | Rule | Error Message |
|-------|------|---------------|
| Pengambil 1 | Required | "Pilih pengambil 1" |
| Pengambil 2 | Required | "Pilih pengambil 2" |
| Pengambil 1 ≠ Pengambil 2 | Must differ | "Pengambil 1 dan 2 harus berbeda" |
| Pengganti | ambil === 0 | "Pengganti harus belum pernah ambil" |
| Max substitution | 2 per session | "Max 2 orang bisa diganti per sesi" |
| Piket order | 16 siswa | "Piket order harus 16 siswa" |

### 9.2 Utang Calculation Rules

```
Scenario 1: Normal (tanpa penggantian)
  A ambil → A.ambil += 1

Scenario 2: A diganti oleh B
  A.utang += 1    (A seharusnya ambil tapi tidak)
  B.utang -= 1    (B yang ambil seharusnya bukan giliran B)

Scenario 3: A diganti B, C diganti D
  A.utang += 1
  B.utang -= 1
  C.utang += 1
  D.utang -= 1
```

---

## 10. Error Handling

### 10.1 Firebase Errors

```javascript
try {
  await updateDocument('absensi', docId, data);
} catch (error) {
  if (error.code === 'permission-denied') {
    showError('Tidak ada akses ke database');
  } else if (error.code === 'unavailable') {
    showError('Koneksi internet terputus');
  } else {
    showError('Error: ' + error.message);
  }
}
```

---

## 11. Performance Optimization

### 11.1 Firestore Queries

- **No complex queries** → gunakan simple reads
- **Batch operations** → update multiple docs sekaligus
- **Offline support** → Firebase auto-handle dengan cache

### 11.2 Frontend Optimization

- **Lazy load** → load UI components on-demand
- **Debounce drag** → delay save hingga user selesai drag
- **Minimize re-renders** → update only changed DOM elements

---

## 12. Testing Strategy

### 12.1 Manual Testing Checklist

**Piket Management:**
- [ ] Bisa drag-drop urutan piket
- [ ] Perubahan urutan tersimpan real-time
- [ ] Semua 16 siswa ada

**Ambil MBG:**
- [ ] Top 2 piket auto-detected
- [ ] Filter pengganti hanya show ambil=0
- [ ] Absensi tersimpan dengan benar

**Utang Logic:**
- [ ] Normal pengambilan tidak ada utang
- [ ] Penggantian update utang dengan benar
- [ ] Utang bisa negative

**Iuran:**
- [ ] Checklist muncul setelah ambil MBG
- [ ] Update status pembayaran berjalan
- [ ] Total terkumpul dihitung benar

**Rekapitulasi:**
- [ ] Riwayat lengkap dan terurut
- [ ] Status utang akurat
- [ ] Pembayaran cocok dengan checklist

### 12.2 Firebase Console Testing

- [ ] Check Firestore data structure
- [ ] Verify collections & documents
- [ ] Test read/write rules
- [ ] Monitor real-time updates

---

## 13. Deployment Plan

### 13.1 Pre-deployment

1. **Test di local** dengan data dummy 16 siswa
2. **Firebase setup:**
   - Buat project di Firebase Console
   - Enable Firestore
   - Initialize dengan skema collection
   - Set basic security rules
3. **Testing:** Jalankan semua manual tests
4. **Backup:** Export data template

### 13.2 Deployment Steps

1. **Connect ke Firebase:**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login
   firebase login
   
   # Initialize project
   firebase init hosting
   ```

2. **Deploy:**
   ```bash
   firebase deploy
   ```

3. **Post-deploy:**
   - Test di production
   - Setup monitoring
   - Share link ke users

---

## 14. Maintenance & Documentation

### 14.1 Code Documentation

- Setiap function punya JSDoc comment
- Setiap business rule ada penjelasan inline
- README.md dengan quick start

### 14.2 Data Backup

- Monthly export dari Firestore
- Store di Google Drive / GitHub

### 14.3 Version Control

```
git log format:
- feat: Tambah fitur X
- fix: Perbaiki bug Y
- docs: Update dokumentasi
- refactor: Reorganisir code Z
```

---

## 15. Security Considerations

### 15.1 Data Privacy

- ✅ Tanpa login (internal use)
- ✅ Tanpa file upload (text-based saja)
- ✅ No sensitive data (nama + angka saja)
- ✅ Firestore rules terbatas (internal network)

### 15.2 Recommended Security Rules (Production)

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Restrict to IP whitelist or authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null && 
                           request.auth.uid in ['admin1', 'admin2'];
    }
  }
}
```

---

## 16. Success Criteria

✅ **MVP Success:**
1. Semua 16 siswa terkelola dalam piket
2. Absensi tercatat otomatis setiap pengambilan
3. Utang terkalkulasi dengan benar
4. Transparansi keuangan tercapai
5. Zero data loss
6. Responsive di desktop + mobile
7. Real-time sync dengan Firestore

---

## 17. Timeline & Milestones

| Fase | Durasi | Deliverable |
|------|--------|-------------|
| **Planning** | 1 hari | Dokumen ini ✓ |
| **Setup** | 1 hari | Firebase + folder struktur |
| **Core Dev** | 3-4 hari | All features |
| **Testing** | 1-2 hari | QA & bug fixes |
| **Deploy** | 0.5 hari | Firebase Hosting |
| **Training** | 0.5 hari | User documentation |

**Total:** ~7-8 hari kerja

---

## Appendix A: Environment Variables

**File:** `.env` (local only, jangan di-commit)

```
# Firebase Config
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_PROJECT_ID=mbg-absensi-xxxx
VITE_FIREBASE_DATABASE_URL=https://mbg-absensi-xxxx.firebaseio.com
```

---

## Appendix B: Useful Resources

- [Firebase Docs](https://firebase.google.com/docs)
- [SortableJS Docs](https://sortablejs.github.io/Sortable/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [CSS Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)

---

## Appendix C: FAQ & Troubleshooting

**Q: Bisa pakai framework (React/Vue)?**  
A: Bisa, tapi overengineering. Vanilla JS cukup untuk 16 siswa.

**Q: Bagaimana jika offline?**  
A: Firestore punya offline support. Perubahan akan sync otomatis saat online.

**Q: Bisa di-host gratis?**  
A: Ya, Firebase Hosting free tier cukup.

**Q: Gimana jika data corrupt?**  
A: Backup regular + Firestore sudah punya versioning.

---

**Document Version:** 1.0  
**Last Updated:** 13 Januari 2026  
**Status:** Production Ready ✓  
**Next Review:** 3 bulan setelah deployment
