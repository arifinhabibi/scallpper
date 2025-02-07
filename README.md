# Sistem Trading Otomatis Berbasis AI

Sistem ini adalah bot trading otomatis yang menggunakan analisis teknikal, sentimen pasar, dan model AI untuk menghasilkan sinyal trading (BUY, SELL, HOLD) pada pasangan mata uang cryptocurrency seperti BTCUSDT. Bot ini dirancang untuk membantu trader membuat keputusan berdasarkan data pasar real-time dan prediksi AI.

---

## **Fitur Utama**

1. **Analisis Teknikal**
   - Menggunakan indikator teknikal seperti EMA (20, 50), RSI (14), MACD, Volume, dan rata-rata volume.
   - Data historis diambil dari Binance (candlestick 15 menit).

2. **Analisis Sentimen**
   - Menganalisis sentimen pasar menggunakan 4 model AI: Ollama (lokal AI), DeepSeek, Anthropic, dan OpenAI.
   - Menggabungkan hasil analisis untuk menghasilkan sinyal trading akhir.

3. **Eksekusi Trading Otomatis**
   - Mendukung eksekusi order BUY dan SELL berdasarkan saldo IDR dan BTC.
   - Terintegrasi dengan broker Binance dan Indodax.

4. **Scheduler Otomatis**
   - Analisis pasar dijalankan setiap 15 menit menggunakan scheduler.

5. **Logging dan Monitoring**
   - Semua aktivitas dicatat menggunakan logger.
   - Error ditangani dengan mekanisme fallback.

---

## **Komponen Sistem**

### **1. Scheduler**
- **File**: `trading.scheduler.ts`
- **Fungsi**: Menjalankan analisis pasar secara otomatis setiap 15 menit.

### **2. Trading Service**
- **File**: `trading.service.ts`
- **Fungsi**:
  - Mengeksekusi trade berdasarkan sinyal yang dihasilkan oleh `AnalysisService`.
  - Memvalidasi struktur data dan menangani error.

### **3. Analysis Service**
- **File**: `analysis.service.ts`
- **Fungsi**:
  - Menggabungkan analisis teknikal, sentimen pasar, dan data berita untuk menghasilkan sinyal trading final.
  - Menggunakan model AI untuk menganalisis sentimen dan data pasar.

### **4. Strategy Analysis Service**
- **File**: `strategy-analysis.service.ts`
- **Fungsi**:
  - Menghitung indikator teknikal seperti EMA, RSI, MACD, dan rata-rata volume.
  - Mengambil data candlestick dari Binance.

### **5. Market Data Service**
- **File**: `market-data.service.ts`
- **Fungsi**:
  - Mengambil data pasar dari Binance dan Indodax.

### **6. Broker Service**
- **File**: `broker.service.ts`
- **Fungsi**:
  - Menjalankan order BUY dan SELL melalui integrasi dengan broker Binance dan Indodax.

### **7. AI Analysis Service**
- **File**: `ai-analysis.service.ts`
- **Fungsi**:
  - Menganalisis sentimen pasar menggunakan 4 model AI: Ollama, DeepSeek, Anthropic, dan OpenAI.
  - Menggabungkan hasil analisis untuk menghasilkan sinyal trading.

---

## **Cara Kerja Sistem**

1. **Pengumpulan Data**
   - Ambil data candlestick dari Binance dan data pasar dari Indodax.
   - Hitung indikator teknikal seperti EMA, RSI, MACD, dll.

2. **Analisis AI**
   - Gunakan model AI untuk menganalisis sentimen pasar dan berita.
   - Gabungkan hasil dari beberapa model AI untuk menghasilkan sinyal trading final.

3. **Eksekusi Trading**
   - Jika sinyal adalah BUY, sistem membeli aset dengan saldo IDR.
   - Jika sinyal adalah SELL, sistem menjual aset BTC yang dimiliki.

4. **Logging dan Monitoring**
   - Semua aktivitas dicatat menggunakan logger.
   - Error ditangani dengan mekanisme fallback.

---

## **Kebutuhan Lingkungan**

1. **Node.js**: Versi 16 atau lebih tinggi.
2. **NestJS**: Framework backend yang digunakan untuk membangun sistem.
3. **API Keys**:
   - Binance API Key dan Secret Key.
   - Indodax API Key dan Secret Key.
   - API Keys untuk model AI (Ollama, DeepSeek, Anthropic, OpenAI).
   - NewsAPI Key untuk analisis sentimen berita.

4. **Database** (Opsional):
   - Untuk menyimpan data historis dan log aktivitas.

---

## **Konfigurasi**

1. **Environment Variables**
   - Konfigurasikan variabel lingkungan berikut di file `.env`:
     ```env
     BASE_URL_BINANCE=https://api.binance.com
     BASE_URL_INDODAX=https://indodax.com
     API_KEY_BINANCE=your_binance_api_key
     SECRET_KEY_BINANCE=your_binance_secret_key
     API_KEY_INDODAX=your_indodax_api_key
     SECRET_KEY_INDODAX=your_indodax_secret_key
     BASE_URL_OLLAMA=https://ollama.example.com
     API_KEY_OLLAMA=your_ollama_api_key
     MODEL_OLLAMA=your_ollama_model
     BASE_URL_DEEPSEEK=https://deepseek.example.com
     API_KEY_DEEPSEEK=your_deepseek_api_key
     MODEL_DEEPSEEK=your_deepseek_model
     API_KEY_ANTHROPIC=your_anthropic_api_key
     MODEL_ANTHROPIC=your_anthropic_model
     API_KEY_OPENAI=your_openai_api_key
     MODEL_OPENAI=your_openai_model
     NEWS_API_KEY=your_news_api_key
     ```

2. **Instalasi Dependensi**
   - Instal semua dependensi menggunakan npm:
     ```bash
     npm install
     ```

---

## **Catatan Penting**

1. **Manajemen Risiko**
   - Saat ini sistem belum memiliki fitur stop-loss atau take-profit. Pastikan untuk menambahkan fitur ini sebelum digunakan dalam kondisi pasar nyata.

2. **Backtesting**
   - Sistem belum memiliki modul backtesting untuk evaluasi strategi menggunakan data historis.

3. **Diversifikasi Aset**
   - Saat ini hanya mendukung pasangan mata uang BTCUSDT. Anda dapat menambahkan dukungan untuk pasangan lain seperti ETHUSDT atau LTCUSDT.

---

## **Kontribusi**

Jika Anda ingin berkontribusi pada proyek ini, silakan buat pull request atau laporkan issue di repository GitHub.

---

## **Lisensi**

Proyek ini dilisensikan di bawah [MIT License](LICENSE).