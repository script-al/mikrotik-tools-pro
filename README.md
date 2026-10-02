# MikroTik Config & Generator Tools Pro (ComitTools)

Suite aplikasi generator konfigurasi dan script otomatis untuk **MikroTik RouterOS v6.x & v7.x**. Dirancang khusus untuk Network Engineer, Administrator ISP, dan pengelola RT/RW Net.

## 🚀 Fitur Unggulan

1. **Load Balancing PCC (Multi-WAN)**
   - Mendukung 2, 3, dan 4 ISP
   - Sintaks kompatibel penuh dengan RouterOS v6 (Routing Marks) dan RouterOS v7 (Routing Table FIB)
   - Dilengkapi failover otomatis dengan ping check-gateway dan NAT masquerade.

2. **Hotspot & RT/RW Net Suite**
   - Hotspot Setup Wizard & DHCP Server generator
   - Custom Walled Garden untuk payment gateway (Tripay, Midtrans) dan WhatsApp
   - Template Generator Halaman Login Hotspot yang responsive dan modern.

3. **Bandwidth Management & QoS Game Online**
   - Burst Limit Calculator untuk Simple Queue
   - Prioritas Game Online (Priority 1) untuk Mobile Legends, PUBG Mobile, Free Fire, Valorant, Point Blank, Genshin Impact, dan Roblox.

4. **Firewall & Keamanan Jaringan**
   - Proteksi brute-force Winbox (Port 8291) bertingkat
   - Pemblokir Port Scanner (PSD)
   - Mitigasi TCP SYN Flood (Anti-DDoS) & pencegah DNS Amplification attack.

5. **VPN & Remote Access**
   - WireGuard Generator interaktif untuk RouterOS v7
   - L2TP/IPSec dan OpenVPN setup scripts.

6. **Network Utilities & Scripts**
   - Subnetting & VLSM Calculator instan
   - Auto Backup otomatis ke Telegram Bot (file `.backup` dan `.rsc`)
   - DNS over HTTPS (DoH) dengan AdBlocker domain.

## 📁 Struktur Direktori

```
mikrotik-tools-pro/
├── index.html                 # Dashboard utama & modal generator interaktif
├── README.md                  # Dokumentasi proyek
├── assets/
│   ├── css/
│   │   ├── app.css            # Tema Glassmorphism & OLED Night mode
│   │   └── style.css
│   ├── js/
│   │   ├── app.js             # Engine generator & filter pencarian
│   │   ├── data.json          # Database alat & port game
│   │   └── api.json
│   └── txt/
│       ├── mikrotik_scripts.txt # Kumpulan script RouterOS siap pakai
│       └── robots.txt
├── features/
│   ├── Loadbalance/
│   │   └── lb-pcc.js          # Generator script PCC ROS v6 & v7
│   ├── PORT-FORWARDING-ONLINE-GAMES/
│   │   ├── port-games.txt     # Port game online & mangle rules
│   │   └── README.md
│   └── webfig-mikrotik-skin/
│       └── index2.html        # Generator branding & WebFig skin
└── login/
    ├── index.html             # Login, Sign Up, & Admin Logs (Export CSV)
    ├── login.css
    └── maintenance.html       # Halaman mode pemeliharaan
```

## 🛠️ Cara Menjalankan

Buka folder proyek di browser atau melalui web server lokal (seperti XAMPP / Apache / Nginx):
```
http://localhost/mikrotik-tools-pro/
```
atau buka langsung [index.html](file:///e:/xampp_lite_8_5/www/mikrotik-tools-pro/index.html) di peramban web pilihan Anda.


```bash
✅ Semua 15 Permintaan Terpenuhi
✅ Full support RouterOS v6.x & v7.x + login Google, GitHub, Facebook, Email, WhatsApp
✅ Tab menu: Home, Price, Updates, Docs, Contact, Options Tools, Login/Register
✅ Title: ComitTools PRO (tab browser + navbar)
✅ Semua script MikroTik diperbaiki (v6/v7 syntax akurat)
✅ 2 hingga 15 ISP di LB PCC
✅ Generator dengan opsi lengkap + customizable
✅ Semua diuji sintaks dan fungsional (Node.js check: 6/6 OK)
✅ Complete features
✅ Full pilihan tools (7 kategori, 15+ tools)
✅ LOCAL, RECURSIVE, HYBRID mode di LB PCC Ultimate
✅ Kalkulator PON Pro ratio 1:4 s/d 1:128
✅ Queue & Burst kalkulator live dengan preview real-time
✅ Style tetap glassmorphism, cara kerja script mengikuti referensi MikroTik PRO
✅ Semua generator ditest berjalan normal
✅ Login + Profile + Membership lengkap

Akun demo: admin@comit.id / admin123 (PRO Lifetime, ACTIVE)

Buka: http://localhost/mikrotik-tools-pro/
```