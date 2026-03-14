# 💰 SmartFinBot Agent

> AI Financial Agent berbasis **Google Gemini 2.5 Flash** dengan arsitektur agentic loop, 6 tools real-time, dan memory percakapan per sesi.

Dibangun sebagai bagian dari program **AI Productivity and AI API Integration for Developers** oleh Hacktiv8 — AI Opportunity Fund: Asia Pacific.

---

## 📸 Tampilan Aplikasi

```
┌─────────────────────────────────────────────┐
│  💰 SmartFinBot                    🗑 Reset  │
│  AI Financial Agent · Powered by Gemini     │
├─────────────────────────────────────────────┤
│  Coba tanya: [Harga Bitcoin] [Kurs USD] ... │
├─────────────────────────────────────────────┤
│                                             │
│  💰 Halo! Saya SmartFinBot...               │
│                                             │
│                  Berapa harga Bitcoin? 👤   │
│                                             │
│  💰 Harga Bitcoin saat ini adalah...        │
│     🔧 get_crypto_price                     │
│                                             │
├─────────────────────────────────────────────┤
│  [Tanya sesuatu tentang keuangan...] [Kirim]│
└─────────────────────────────────────────────┘
```

---

## ✨ Fitur Utama

### 🤖 AI Agent dengan Agentic Loop
Berbeda dengan chatbot biasa, SmartFinBot menggunakan **agentic reasoning loop** — Gemini berpikir sendiri tools mana yang perlu dipanggil, mengeksekusi tools tersebut, lalu merangkum hasilnya secara natural.

### 🔧 6 Tools Real-time

| Tool | Fungsi | API |
|------|--------|-----|
| `get_crypto_price` | Harga cryptocurrency real-time | CoinGecko (gratis) |
| `get_exchange_rate` | Konversi kurs mata uang | ExchangeRate API (gratis) |
| `calculate_finance` | Hitung bunga majemuk, ROI, DCA, cicilan | Built-in |
| `get_market_news` | Berita pasar keuangan terkini | NewsAPI |
| `track_portfolio` | Lacak & hitung nilai portofolio aset | CoinGecko (gratis) |
| `get_financial_advice` | Edukasi dan strategi investasi | Built-in |

### 🧠 Memory per Sesi
Setiap percakapan disimpan per `sessionId` sehingga bot mengingat konteks percakapan sebelumnya dalam satu sesi.

### 🛡️ Error Handling Lengkap
Menangani berbagai jenis error dengan pesan yang ramah dan informatif untuk pengguna.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js v18+
- **Framework**: Express.js v5
- **AI Model**: Google Gemini 2.5 Flash
- **SDK**: @google/genai
- **Frontend**: Vanilla JavaScript (HTML + CSS + JS)
- **External APIs**: CoinGecko, ExchangeRate API, NewsAPI

---

## 📁 Struktur Project

```
smartfinbot-agent/
├── public/                  # Frontend (served oleh Express)
│   ├── index.html           # UI chatbot
│   ├── script.js            # Logika frontend & fetch API
│   └── style.css            # Styling chatbot
├── src/
│   ├── index.js             # Express server & endpoint API
│   ├── agent.js             # Agent orchestrator & memory
│   └── tools.js             # Definisi & implementasi 6 tools
├── .env.example             # Contoh environment variables
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Cara Menjalankan

### Prasyarat
- Node.js v18 atau lebih baru
- Gemini API Key (gratis di [aistudio.google.com](https://aistudio.google.com/app/apikey))

### 1. Clone / Extract Project

```bash
cd smartfinbot-agent
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment

```bash
cp .env.example .env
```

Buka file `.env` dan isi dengan API key kamu:

```env
GEMINI_API_KEY=AIza...kunci_gemini_kamu
NEWS_API_KEY=...kunci_newsapi_kamu   # opsional
PORT=3000
```

> **Tips:** `NEWS_API_KEY` bersifat opsional. Jika tidak diisi, bot akan menggunakan data berita simulasi.

### 4. Jalankan Server

```bash
# Mode normal
node src/index.js

# Mode development (auto-restart saat file berubah)
npm run dev
```

### 5. Buka di Browser

```
http://localhost:3000
```

---

## � Deployment ke Vercel

### 1. Push ke GitHub
Pastikan kode sudah di-push ke repository GitHub kamu.

### 2. Import ke Vercel
- Buka [vercel.com](https://vercel.com) dan login
- Klik "New Project"
- Import repository GitHub kamu
- Vercel akan otomatis mendeteksi sebagai Node.js project

### 3. Konfigurasi Environment Variables
Di dashboard Vercel, tambahkan environment variables:

```
GEMINI_API_KEY=AIza...kunci_gemini_kamu
NEWS_API_KEY=...kunci_newsapi_kamu   # opsional
```

### 4. Deploy
Klik "Deploy" dan tunggu proses selesai. Aplikasi akan tersedia di URL Vercel yang diberikan.

> **Catatan:** Vercel menggunakan serverless functions, jadi aplikasi akan berjalan optimal untuk traffic rendah hingga sedang.

---

## �📡 API Endpoints

### `POST /api/agent`
Mengirim pesan ke agent dan mendapatkan respons AI.

**Request Body:**
```json
{
  "message": "Berapa harga Bitcoin sekarang?",
  "sessionId": "user-session-001"
}
```

**Response:**
```json
{
  "reply": "Harga Bitcoin saat ini adalah Rp1.500.000.000...",
  "meta": {
    "iterations": 2,
    "tools_used": ["get_crypto_price"],
    "session_id": "user-session-001"
  }
}
```

---

### `GET /api/agent/memory/:sessionId`
Melihat riwayat percakapan sesi tertentu (untuk debugging).

**Contoh:**
```
GET http://localhost:3000/api/agent/memory/user-session-001
```

---

### `DELETE /api/agent/memory/:sessionId`
Menghapus riwayat percakapan sesi tertentu.

**Contoh:**
```
DELETE http://localhost:3000/api/agent/memory/user-session-001
```

---

## 💬 Contoh Pertanyaan

```
"Berapa harga Bitcoin sekarang?"
"Konversi 500 USD ke IDR"
"Kalau nabung Rp500rb/bulan selama 3 tahun dengan bunga 6%, dapat berapa?"
"Lacak portofolio: 0.01 BTC beli di Rp800 juta, 1 ETH beli di Rp50 juta"
"Jelaskan apa itu dollar cost averaging"
"Berikan saran investasi untuk profil risiko moderat"
"Berita terbaru tentang Bitcoin"
```

---

## 🧠 Cara Kerja AI Agent

```
User kirim pesan
      │
      ▼
Express menerima request
      │
      ▼
Agent Orchestrator (Gemini)
      │
      ├─ Apakah perlu tool? ──YES──► Eksekusi tool
      │                                    │
      │                              Hasil tool
      │                                    │
      └─────────────────────────────► Gemini merangkum
                                           │
                                           ▼
                                    Jawaban final → User
```

Siklus ini bisa berulang hingga **10 iterasi** dalam satu pertanyaan jika Gemini membutuhkan beberapa tools sekaligus.

---

## ⚠️ Error Handling

| Error | Penyebab | Solusi |
|-------|----------|--------|
| `429 Rate Limit` | Terlalu banyak request | Tunggu 1-2 menit |
| `401 Invalid Key` | API key salah | Periksa file `.env` |
| `503 Network Error` | Koneksi bermasalah | Periksa internet |
| `400 Safety Block` | Konten tidak aman | Ubah pertanyaan |
| `500 Server Error` | Error internal | Lihat log terminal |

**Batas Free Tier Gemini:**
- 20 request per menit
- 1.500 request per hari
- Model: `gemini-2.5-flash`

---

## 🔧 Kustomisasi

### Ganti Model Gemini
Buka `src/agent.js`, ubah baris:
```js
const GEMINI_MODEL = "gemini-2.5-flash"; // ganti sesuai kebutuhan
```

### Ubah Persona Bot
Buka `src/agent.js`, edit bagian `SYSTEM_INSTRUCTION`:
```js
const SYSTEM_INSTRUCTION = `Kamu adalah SmartFinBot...`;
```

### Tambah Tool Baru
1. Tambahkan deklarasi tool ke array `toolDeclarations` di `src/tools.js`
2. Tambahkan handler di fungsi `handleToolCall`
3. Implementasikan fungsi tool-nya

---

## 📦 Pengumpulan Project (Hacktiv8)

```bash
# Inisialisasi Git
git init
git add .
git commit -m "feat: SmartFinBot AI Financial Agent"
git branch -M main

# Push ke GitHub
git remote add origin https://github.com/username/smartfinbot-agent.git
git push -u origin main
```

Kumpulkan URL repository ke: [https://bit.ly/finalproject-developers](https://bit.ly/finalproject-developers)

---

## ⚠️ Disclaimer

SmartFinBot memberikan **edukasi finansial**, bukan saran investasi resmi. Selalu lakukan riset mandiri dan konsultasikan keputusan investasi dengan profesional keuangan yang terlisensi.

---

## 📄 Lisensi

Project ini dibuat untuk keperluan edukasi dalam program AI Opportunity Fund: Asia Pacific oleh Hacktiv8.
