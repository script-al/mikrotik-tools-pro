# Port Forwarding & Game Prioritizer MikroTik

Panduan lengkap konfigurasi Quality of Service (QoS) & Mangle untuk game online di MikroTik RouterOS v6 & v7.

## Cara Menggunakan
1. Buka Winbox -> New Terminal.
2. Salin baris script mangle game yang ingin diprioritaskan dari file `port-games.txt`.
3. Paste ke Terminal dan tekan Enter.
4. Buat Queue Tree dengan Parent `global` dan prioritaskan `packet-mark` game dengan Priority 1 (High Priority).
5. Atur `limit-at` (bandwidth jaminan) agar game tidak terganggu saat traffic download/streaming tinggi.
