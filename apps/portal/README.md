# CC_Wordpress

Ringkasan singkat

- `CC_Wordpress` adalah antarmuka web berbasis React + Vite yang berisi komponen UI, halaman, dan pengaturan untuk pengelolaan instance dan demo aplikasi. Repositori ini hanya berisi kode sumber frontend; konfigurasi dan kunci API disimpan secara lokal melalui variabel lingkungan.

Persyaratan

- **Node.js:** versi LTS yang direkomendasikan (mis. 16+).
- **npm** atau **yarn** untuk manajemen paket.

Instalasi — Menjalankan secara lokal

1. Pasang dependensi:

```
npm install
```

2. Siapkan variabel lingkungan:

- Buat file `.env.local` di root proyek (jika belum ada).
- Tambahkan variabel yang diperlukan, mis. `GEMINI_API_KEY`. Jangan membagikan nilai kunci secara publik.

```
GEMINI_API_KEY=your_api_key_here
```

3. Menjalankan dalam mode pengembangan:

```
npm run dev
```

Build untuk produksi

```
npm run build
npm run preview
```

Konfigurasi lingkungan

- Semua konfigurasi sensitif harus ditempatkan di `.env.local` dan tidak di-commit ke kontrol versi.

Struktur proyek (ringkas)

- `src/components` — komponen UI.
- `src/pages` — halaman aplikasi.
- `src/context` — konteks React (mis. otentikasi).
- `src/services` — panggilan API dan mock.

Kontribusi

- Fork repositori dan buat branch untuk fitur/bugfix.
- Ajukan pull request dengan deskripsi perubahan dan instruksi pengujian bila diperlukan.

Lisensi

- Periksa file `LICENSE` di repositori untuk ketentuan lisensi.

Kontak

- Untuk pertanyaan teknis, buka issue di repositori.

Catatan

- README ini sengaja tidak menyertakan informasi publik mengenai lokasi deployment atau tautan layanan.
