/**
 * Tools Catalog — ComitTools PRO
 * Complete dataset for all 100+ tools across 8 primary categories.
 * All tools include rich icons, descriptions, badges, and version compatibility.
 */

const ToolsCatalog = {
  categories: [
    // 1. RECOMMENDED TOOLS
    {
      id: 'cat-recommended',
      name: 'Recommended Tools',
      subtitle: 'Koleksi tool unggulan dan paling sering digunakan oleh network engineer',
      icon: 'fa-star',
      color: 'orange',
      tools: [
        { id: 'lb-pcc-ultimate', name: 'LB PCC ULTIMATE Generator', desc: 'Load balancing 2 s/d 15 ISP dengan mode LOCAL, RECURSIVE, HYBRID, Bandwidth Ratio, & Address-List Bypass.', icon: 'fa-network-wired', badge: 'PRO ULTIMATE', star: true, version: 'both', tier: 'pro' },
        { id: 'address-list-generator', name: 'Address-List Ultimate Generator', desc: 'Generate daftar IP BOGON, Sosmed, Streaming, Game Online, Banking/Fintech, atau Custom dengan target RAW, Filter, dan Mangle.', icon: 'fa-list-check', badge: 'PRO', star: true, version: 'both', tier: 'pro' },
        { id: 'queue-burst', name: 'Queue & Burst Rate Calculator', desc: 'Hitung Max Limit, Burst Limit, Burst Threshold, dan Limit At secara akurat dengan live preview.', icon: 'fa-gauge-high', badge: 'PRO', star: true, version: 'both' },
        { id: 'pon-calc', name: 'Kalkulator PON Pro (Full Ratio)', desc: 'Kalkulasi split ratio 1:4 hingga 1:128, bandwidth per ONT, CIR, MIR, dan Queue Tree otomatis.', icon: 'fa-tower-cell', badge: 'NEW', star: true, version: 'both' },
        { id: 'hotspot-login-page-maker', name: 'Hotspot Login Page Maker', desc: 'Desain dan generate template login hotspot modern, responsive, dan ringan untuk MikroTik.', icon: 'fa-palette', badge: 'FREE', star: true, version: 'both' },
        { id: 'mikrotik-qr-code-generator', name: 'MikroTik QR Code Generator', desc: 'Generate QR Code koneksi WiFi otomatis dan login voucher captive portal dengan kartu cetak.', icon: 'fa-qrcode', badge: 'PRO', star: true, version: 'both' },
        { id: 'ai-script-generator', name: 'AI Powered Script Generator', desc: 'Ketik konfigurasi yang diinginkan dalam bahasa manusia, AI menyusun script RouterOS otomatis.', icon: 'fa-wand-magic-sparkles', badge: 'PRO', star: true, version: 'both' },
        { id: 'ai-log-debugger', name: 'AI Powered Log Debugger', desc: 'Paste error log dari Winbox, AI menganalisis penyebab dan menghasilkan script perbaikan otomatis.', icon: 'fa-bug', badge: 'PRO', star: true, version: 'both' },
        { id: 'basic-config-generator', name: 'Basic Configuration Generator', desc: 'Setup awal router baru: Bridge LAN, DHCP Client, DHCP Server, DNS, NAT, dan Clock Timezone.', icon: 'fa-sliders', badge: 'PRO', star: true, version: 'both' },
        { id: 'failover-recursive', name: 'Failover Recursive Gateway', desc: 'Failover multi-gateway otomatis via pengecekan IP DNS target reachability (scope & target-scope).', icon: 'fa-shuffle', badge: 'PRO', star: true, version: 'both' },
        { id: 'static-routing-social', name: 'Static Routing Sosmed & Video', desc: 'Pisahkan jalur trafik YouTube, TikTok, Facebook, dan WhatsApp ke ISP khusus.', icon: 'fa-share-nodes', badge: 'PRO', star: true, version: 'both' },
        { id: 'qos-priority-social', name: 'QoS Priority Video & Gaming', desc: 'Prioritas bandwidth Queue Tree dengan DSCP / Packet Mark agar game online tidak lag.', icon: 'fa-layer-group', badge: 'PRO', star: true, version: 'both' },
        { id: 'telegram-reporter', name: 'Telegram Bot Status Reporter', desc: 'Laporan otomatis berkala CPU load, RAM, uptime, hotspot active, dan PPPoE ke Telegram.', icon: 'fa-paper-plane', badge: 'PRO', star: true, version: 'both' },
        { id: 'mikrotik-ninja', name: 'MikroTik Ninja (Hide from ISP)', desc: 'Sembunyikan RouterBOARD dari deteksi ISP: TTL masking 64, stealth traceroute, dan blokir MNDP.', icon: 'fa-user-ninja', badge: 'PRO', star: true, version: 'both' },
        { id: 'mikrotik-auto-backup-email', name: 'Auto Backup to E-Mail', desc: 'Scheduler backup berkala binary .backup dan config .rsc langsung terkirim ke Gmail/SMTP.', icon: 'fa-envelope-circle-check', badge: 'PRO', star: true, version: 'both' },
        { id: 'script-database', name: 'RouterOS Script Repository', desc: 'Koleksi database script siap pakai: Cloudflare DDNS, multi-host netwatch, dan auto reboot.', icon: 'fa-database', badge: 'PRO', star: true, version: 'both' }
      ]
    },

    // 2. LOAD BALANCING & MULTI-WAN
    {
      id: 'cat-lb',
      name: 'Load Balancing & Multi-WAN',
      subtitle: 'Distribusi beban bandwidth internet multi-gateway hingga 15 ISP',
      icon: 'fa-network-wired',
      color: 'teal',
      tools: [
        { id: 'lb-pcc-ultimate', name: 'LB PCC ULTIMATE (2-15 ISP)', desc: 'Mangle PCC lengkap dengan classifier both-addresses-and-ports, Bandwidth Ratio, routing table v7, dan failover.', icon: 'fa-network-wired', badge: 'PRO ULTIMATE', version: 'both', tier: 'pro' },
        { id: 'address-list-generator', name: 'Address-List Ultimate Generator', desc: 'Generate Address-List IP untuk pemisahan traffic, bypass PCC, RAW drop, dan routing khusus.', icon: 'fa-list-check', badge: 'PRO', version: 'both', tier: 'pro' },
        { id: 'starlink-lb-pcc', name: 'Starlink Load Balancing PCC', desc: 'Khusus Starlink + ISP Fiber dengan MSS clamping 1420 dan penanganan fluktuasi latency.', icon: 'fa-satellite', badge: 'PRO', version: 'both' },
        { id: 'lb-nth', name: 'Load Balancing NTH Round-Robin', desc: 'Distribusi paket round-robin NTH untuk traffic browsing berkecepatan tinggi.', icon: 'fa-arrows-split-up-and-left', badge: 'PRO', version: 'both' },
        { id: 'lb-ecmp', name: 'Load Balancing ECMP Multi-Gateway', desc: 'Equal-Cost Multi-Path dengan check-gateway ping pada default route.', icon: 'fa-code-branch', badge: 'FREE', version: 'both' },
        { id: 'failover-recursive', name: 'Failover Recursive Gateway', desc: 'Pengecekan gateway rekursif via host DNS publik untuk keandalan maksimal.', icon: 'fa-shuffle', badge: 'PRO', version: 'both' },
        { id: 'bgp-generator', name: 'BGP (iBGP / eBGP) Generator', desc: 'Konfigurasi Autonomous System (AS) peering BGP untuk RouterOS v6 dan v7.', icon: 'fa-diagram-project', badge: 'PRO', version: 'both' },
        { id: 'local-client-static-routing', name: 'Local Client VIP Static Route', desc: 'Rute khusus mengarahkan IP client / server tertentu agar selalu lewat ISP pilihan.', icon: 'fa-user-tie', badge: 'PRO', version: 'both' },
        { id: 'website-static-routing', name: 'Website Domain Static Routing', desc: 'Arahkan domain tertentu (misal: internet banking, portal kerja) lewat ISP 1.', icon: 'fa-globe', badge: 'PRO', version: 'both' }
      ]
    },

    // 3. QUEUE, BANDWIDTH & PON OPTICAL
    {
      id: 'cat-queue',
      name: 'Queue & Bandwidth Management',
      subtitle: 'Manajemen alokasi kecepatan internet, burst kalkulator, dan PON ratio',
      icon: 'fa-chart-pie',
      color: 'amber',
      tools: [
        { id: 'queue-burst', name: 'Queue & Burst Rate Calculator', desc: 'Kalkulator presisi Max Limit, Burst Limit, Threshold, dan Limit At secara otomatis.', icon: 'fa-gauge-high', badge: 'PRO', version: 'both' },
        { id: 'pon-calc', name: 'Kalkulator PON Pro (1:4 - 1:128)', desc: 'Hitung pembagian bandwidth splitter PON OLT uplink dan generate Queue Tree FTTH.', icon: 'fa-tower-cell', badge: 'NEW', version: 'both' },
        { id: 'queue-tree', name: 'Hierarchical Queue Tree Generator', desc: 'Struktur antrian bertingkat dengan parent queue dan PCQ per-client download/upload.', icon: 'fa-sitemap', badge: 'PRO', version: 'both' },
        { id: 'game-qos', name: 'Online Game QoS Priority', desc: 'Prioritas paket game online (MLBB, PUBG, FF, Valorant, dll.) pada Priority 1.', icon: 'fa-gamepad', badge: 'FREE', version: 'both' },
        { id: 'qos-priority-social', name: 'Streaming & Video QoS Priority', desc: 'Batasi dan alokasikan bandwidth video streaming tanpa mengganggu browsing.', icon: 'fa-layer-group', badge: 'PRO', version: 'both' }
      ]
    },

    // 4. HOTSPOT, PPPoE & VOUCHER
    {
      id: 'cat-hotspot',
      name: 'Hotspot, PPPoE & Voucher',
      subtitle: 'Sistem manajemen captive portal, billing voucher, dan PPP Secrets',
      icon: 'fa-wifi',
      color: 'purple',
      tools: [
        { id: 'hotspot', name: 'Hotspot Server Setup Generator', desc: 'Konfigurasi Hotspot lengkap: Pool IP, DHCP Server, Profile, Walled Garden, dan Trial.', icon: 'fa-wifi', badge: 'FREE', version: 'both' },
        { id: 'hotspot-login-page-maker', name: 'Hotspot Login Page Maker', desc: 'Generator skin captive portal dengan branding, paket voucher, dan nomor kontak.', icon: 'fa-palette', badge: 'FREE', version: 'both' },
        { id: 'mikrotik-qr-code-generator', name: 'MikroTik QR Code Generator', desc: 'Generate QR Code koneksi WiFi otomatis dan login voucher captive portal dengan kartu cetak.', icon: 'fa-qrcode', badge: 'PRO', version: 'both' },
        { id: 'generate-vouchers', name: 'Batch Voucher Generator', desc: 'Buat puluhan user & password voucher sekaligus dengan batas uptime dan profil kecepatan.', icon: 'fa-ticket', badge: 'FREE', version: 'both' },
        { id: 'hotspot-ip-binding-mac', name: 'Hotspot IP Binding (Bypass)', desc: 'Bypass perangkat CCTV, printer, atau server dari kewajiban login captive portal.', icon: 'fa-link', badge: 'FREE', version: 'both' },
        { id: 'ppp-secret', name: 'PPPoE & VPN User Secret', desc: 'Generate akun pelanggan PPPoE / L2TP / OVPN dengan profil bandwidth.', icon: 'fa-key', badge: 'FREE', version: 'both' },
        { id: 'walled-garden', name: 'Walled Garden Payment Gateway', desc: 'Izinkan akses domain payment gateway bank/midtrans sebelum user login hotspot.', icon: 'fa-shield-cat', badge: 'FREE', version: 'both' },
        { id: 'clear-hotspot-cookies', name: 'Clear Active Hotspot Cookies', desc: 'Bersihkan seluruh cookie login aktif untuk memaksa autentikasi ulang user.', icon: 'fa-cookie-bite', badge: 'FREE', version: 'both' }
      ]
    },

    // 5. FIREWALL, SECURITY & STEALTH
    {
      id: 'cat-firewall',
      name: 'Firewall, Security & Hardening',
      subtitle: 'Perlindungan router dari serangan siber, brute-force, dan kebocoran port',
      icon: 'fa-shield-halved',
      color: 'rose',
      tools: [
        { id: 'firewall', name: 'Firewall Security Hardening Pro', desc: 'Filter komprehensif: anti-DDoS, port scan detector, bogon filter, dan proteksi router.', icon: 'fa-shield-halved', badge: 'FREE', version: 'both' },
        { id: 'address-list-generator', name: 'Address-List Ultimate Generator', desc: 'Daftar IP BOGON/Martians, proteksi RAW drop 0% CPU, dan rule isolasi subnet.', icon: 'fa-list-check', badge: 'PRO', version: 'both', tier: 'pro' },
        { id: 'anti-hack-mikrotik', name: 'Anti Hack Security Lockdown', desc: 'Nonaktifkan service rentan (telnet, ftp, www, api) dan ubah port SSH/Winbox.', icon: 'fa-user-lock', badge: 'FREE', version: 'both' },
        { id: 'anti-ddos-attacks', name: 'Anti SYN & UDP Flood DDoS', desc: 'Batasi laju koneksi SYN dan blacklist otomatis IP penyerang DDoS.', icon: 'fa-shield-virus', badge: 'FREE', version: 'both' },
        { id: 'anti-netcut', name: 'Anti Netcut (ARP Reply-Only)', desc: 'Kunci tabel ARP menjadi reply-only untuk mencegah pemutusan koneksi oleh Netcut.', icon: 'fa-scissors', badge: 'FREE', version: 'both' },
        { id: 'anti-tethering-hotspot', name: 'Anti Tethering (TTL=1 Clamp)', desc: 'Ubah TTL menjadi 1 agar client hotspot tidak bisa berbagi koneksi wifi hotspot.', icon: 'fa-mobile-screen-button', badge: 'FREE', version: 'both' },
        { id: 'anti-ping-wan', name: 'Anti-Ping WAN (Stealth Mode)', desc: 'Drop paket ICMP echo-request dari interface WAN internet publik.', icon: 'fa-eye-slash', badge: 'FREE', version: 'both' },
        { id: 'block-access-modem', name: 'Block Client Access to Modem', desc: 'Cegah pelanggan mengakses IP dashboard modem ISP di interface WAN.', icon: 'fa-lock', badge: 'FREE', version: 'both' },
        { id: 'block-open-recursive-dns', name: 'Block Open Recursive DNS', desc: 'Tutup akses DNS port 53 dari internet untuk mencegah serangan DNS Amplification.', icon: 'fa-server', badge: 'FREE', version: 'both' },
        { id: 'bootloader-protector', name: 'Bootloader Hard-Reset Lock', desc: 'Kunci routerboard agar tidak dapat di-reset melalui tombol fisik sembarangan.', icon: 'fa-microchip', badge: 'FREE', version: 'both' },
        { id: 'mikrotik-ninja', name: 'MikroTik Ninja (Hide from ISP)', desc: 'Samarkan TTL, matikan broadcast MNDP/CDP, dan sembunyikan identitas router.', icon: 'fa-user-ninja', badge: 'PRO', version: 'both' }
      ]
    },

    // 6. VPN, ROUTING & REMOTE ACCESS
    {
      id: 'cat-vpn',
      name: 'VPN, Tunnel & Remote Access',
      subtitle: 'Koneksi terenkripsi WireGuard, L2TP, SSTP, PPTP, dan port forwarding',
      icon: 'fa-lock',
      color: 'cyan',
      tools: [
        { id: 'vpn-wireguard', name: 'WireGuard Server Setup (ROS v7)', desc: 'VPN modern berkecepatan tinggi dengan pertukaran public/private key dan peers.', icon: 'fa-shield', badge: 'v7 ONLY', version: 'v7' },
        { id: 'vpn-l2tp', name: 'L2TP / IPSec VPN Server', desc: 'VPN IPSec kompatibel langsung dengan Windows, Android, dan iPhone.', icon: 'fa-lock', badge: 'FREE', version: 'both' },
        { id: 'vpn-sstp', name: 'SSTP VPN Server (SSL Port 443)', desc: 'VPN lewat port HTTPS 443 yang tahan blokir firewall publik.', icon: 'fa-certificate', badge: 'FREE', version: 'both' },
        { id: 'vpn-pptp', name: 'PPTP VPN Server (Legacy)', desc: 'Setup VPN PPTP sederhana untuk kebutuhan remote darurat.', icon: 'fa-key', badge: 'FREE', version: 'v6' },
        { id: 'all-traffic-vpn-tunnel', name: 'All Traffic to VPN Tunnel', desc: 'Rute default mengalirkan seluruh koneksi internet kantor/rumah lewat VPN.', icon: 'fa-shield-halved', badge: 'PRO', version: 'both' },
        { id: 'port-forward', name: 'Port Forwarding (DST-NAT)', desc: 'Buka akses web server, CCTV, remote desktop internal ke internet publik.', icon: 'fa-arrow-right-arrow-left', badge: 'FREE', version: 'both' },
        { id: 'games-static-raw', name: 'Games Static Route via RAW Table', desc: 'Rute trafik game online lewat jalur khusus dengan 0% beban CPU router.', icon: 'fa-gamepad', badge: 'PRO', version: 'both' }
      ]
    },

    // 7. FAST ONE-CLICK MIKROTIK SCRIPTS (60 TOOLS)
    {
      id: 'cat-fast',
      name: 'Free Fast Script Generator',
      subtitle: 'Kumpulan 60 script cepat satu klik untuk konfigurasi, pembersihan, dan utilitas',
      icon: 'fa-bolt',
      color: 'emerald',
      tools: [
        { id: 'add-admin-user', name: 'Add Admin User', desc: 'Tambah user admin baru dengan hak akses full/write/read dan IP restriction.', icon: 'fa-user-plus', badge: 'FREE', version: 'both' },
        { id: 'add-ip-address', name: 'Add IP Address', desc: 'Tetapkan IP address dan subnet mask pada interface yang dipilih.', icon: 'fa-network-wired', badge: 'FREE', version: 'both' },
        { id: 'add-ip-pool', name: 'Add IP Pool', desc: 'Buat rentang alokasi pool IP untuk DHCP Server atau Hotspot.', icon: 'fa-layer-group', badge: 'FREE', version: 'both' },
        { id: 'anti-ddos-attacks', name: 'Anti DDoS Attacks', desc: 'Rule pertahanan terhadap serangan SYN flood dan UDP flood.', icon: 'fa-shield-virus', badge: 'FREE', version: 'both' },
        { id: 'anti-hack-exploit-user-dat', name: 'Anti Hack Exploit (user.dat)', desc: 'Tutup celah CVE Winbox port 8291 dari serangan exploit user.dat.', icon: 'fa-bug-slash', badge: 'FREE', version: 'both' },
        { id: 'anti-hack-mikrotik', name: 'Anti Hack MikroTik', desc: 'Amankan service management dan ganti port SSH bawaan.', icon: 'fa-shield-halved', badge: 'FREE', version: 'both' },
        { id: 'anti-netcut', name: 'Anti Netcut', desc: 'Ubah ARP ke reply-only untuk mencegah pemutusan koneksi.', icon: 'fa-scissors', badge: 'FREE', version: 'both' },
        { id: 'anti-tethering-hotspot', name: 'Anti Tethering Hotspot', desc: 'Kunci TTL=1 agar voucher hotspot tidak dapat ditetheringkan.', icon: 'fa-mobile-screen-button', badge: 'FREE', version: 'both' },
        { id: 'anti-ping-wan', name: 'Anti-Ping WAN', desc: 'Sembunyikan router dari ping scan di jaringan internet luar.', icon: 'fa-eye-slash', badge: 'FREE', version: 'both' },
        { id: 'auto-reboot', name: 'Auto Reboot Scheduler', desc: 'Jadwalkan reboot router berkala di jam subuh untuk refresh memori.', icon: 'fa-clock-rotate-left', badge: 'FREE', version: 'both' },
        { id: 'backup-export-file-rsc', name: 'Backup Export File .rsc', desc: 'Export backup script lengkap dan backup binary dengan timestamp.', icon: 'fa-file-export', badge: 'FREE', version: 'both' },
        { id: 'block-access-modem', name: 'Block Access Modem', desc: 'Blokir akses client internal ke IP web dashboard modem internet.', icon: 'fa-lock', badge: 'FREE', version: 'both' },
        { id: 'block-ip-address', name: 'Block IP Address', desc: 'Blokir total akses IP tertentu baik forward maupun input.', icon: 'fa-ban', badge: 'FREE', version: 'both' },
        { id: 'block-mac-address', name: 'Block MAC Address', desc: 'Blokir perangkat berdasarkan MAC Address fisik pada bridge filter.', icon: 'fa-ethernet', badge: 'FREE', version: 'both' },
        { id: 'block-open-proxy', name: 'Block Open PROXY', desc: 'Tutup celah proxy port 8080 dan 3128 dari interface WAN.', icon: 'fa-globe', badge: 'FREE', version: 'both' },
        { id: 'block-open-recursive-dns', name: 'Block Open Recursive DNS', desc: 'Cegah router digunakan sebagai reflektor DDoS DNS amplifikasi.', icon: 'fa-server', badge: 'FREE', version: 'both' },
        { id: 'block-port', name: 'Block Port', desc: 'Blokir port TCP/UDP berbahaya (telnet, smb, rpc, dll.).', icon: 'fa-door-closed', badge: 'FREE', version: 'both' },
        { id: 'block-website-layer-7', name: 'Block Website (Layer 7)', desc: 'Blokir domain website via pola regex Layer 7 Protocol.', icon: 'fa-filter', badge: 'FREE', version: 'both' },
        { id: 'block-website-static-dns', name: 'Block Website (Static DNS)', desc: 'Sinkhole domain iklan / judi ke IP lokal 127.0.0.1.', icon: 'fa-shield', badge: 'FREE', version: 'both' },
        { id: 'bootloader-protector', name: 'Bootloader Protector', desc: 'Kunci tombol reset fisik RouterBOARD agar router tidak direset sembarangan.', icon: 'fa-microchip', badge: 'FREE', version: 'both' },
        { id: 'bypass-local-traffic', name: 'Bypass Local Traffic', desc: 'Bypass subnet private RFC1918 agar koneksi lokal tidak terkena mangle.', icon: 'fa-arrow-turn-down', badge: 'FREE', version: 'both' },
        { id: 'bypass-hotspot-ip-binding', name: 'Bypass Hotspot IP Binding', desc: 'Bypass MAC/IP perangkat tertentu tanpa perlu login voucher.', icon: 'fa-unlock', badge: 'FREE', version: 'both' },
        { id: 'change-mac-address', name: 'Change MAC Address', desc: 'Kloning atau ubah alamat fisik MAC address interface ethernet.', icon: 'fa-pen-to-square', badge: 'FREE', version: 'both' },
        { id: 'clear-hotspot-cookies', name: 'Clear Hotspot Cookies', desc: 'Hapus cookie sesi aktif hotspot di router.', icon: 'fa-cookie', badge: 'FREE', version: 'both' },
        { id: 'clear-dns-flush', name: 'Clear DNS Flush', desc: 'Bersihkan seluruh riwayat cache DNS di MikroTik.', icon: 'fa-broom', badge: 'FREE', version: 'both' },
        { id: 'clear-log-terminal', name: 'Clear Log Terminal', desc: 'Flush buffer pencatatan memori log di terminal.', icon: 'fa-trash-can', badge: 'FREE', version: 'both' },
        { id: 'dns-settings', name: 'DNS Settings', desc: 'Konfigurasi primary/secondary DNS server dan allow remote requests.', icon: 'fa-server', badge: 'FREE', version: 'both' },
        { id: 'drop-invalid-packets', name: 'Drop Invalid Packets', desc: 'Drop paket berstatus invalid di firewall filter.', icon: 'fa-triangle-exclamation', badge: 'FREE', version: 'both' },
        { id: 'drop-traceroute', name: 'Drop Traceroute', desc: 'Drop probe traceroute dari luar agar hops router tidak terlihat.', icon: 'fa-route', badge: 'FREE', version: 'both' },
        { id: 'enable-fasttrack', name: 'Enable Fasttrack', desc: 'Akselerasi throughput TCP/UDP lewat bypass connection tracking.', icon: 'fa-forward-fast', badge: 'FREE', version: 'both' },
        { id: 'generate-vouchers', name: 'Generate Vouchers', desc: 'Buat batch user voucher hotspot dengan limit waktu.', icon: 'fa-ticket', badge: 'FREE', version: 'both' },
        { id: 'hotspot-ip-binding-mac', name: 'Hotspot IP Binding (MAC)', desc: 'Binding MAC ke status bypassed, regular, atau blocked.', icon: 'fa-link', badge: 'FREE', version: 'both' },
        { id: 'ip-service-control', name: 'IP Service Control', desc: 'Kustomisasi port Winbox, SSH, dan batasi alamat IP pengelola.', icon: 'fa-gears', badge: 'FREE', version: 'both' },
        { id: 'interface-name-to-default', name: 'Interface Name to Default', desc: 'Kembalikan nama port ethernet ke default (ether1, ether2, ...).', icon: 'fa-arrow-rotate-left', badge: 'FREE', version: 'both' },
        { id: 'ping-tool', name: 'Ping Tool Script', desc: 'Script uji ping multi-host dengan batas count.', icon: 'fa-satellite-dish', badge: 'FREE', version: 'both' },
        { id: 'port-forward', name: 'Port Forward (DST-NAT)', desc: 'Buka port layanan internal router ke internet.', icon: 'fa-arrows-split-up-and-left', badge: 'FREE', version: 'both' },
        { id: 'protect-btest-server', name: 'Protect Btest Server', desc: 'Matikan bandwidth test server agar resource router tidak dikuras.', icon: 'fa-gauge', badge: 'FREE', version: 'both' },
        { id: 'ppp-secret', name: 'PPP Secret User', desc: 'Tambah user akun PPPoE atau VPN client.', icon: 'fa-key', badge: 'FREE', version: 'both' },
        { id: 'protect-mac-server', name: 'Protect Mac Server', desc: 'Kunci akses MAC-Winbox dan MAC-Telnet dari interface WAN.', icon: 'fa-lock', badge: 'FREE', version: 'both' },
        { id: 'protect-neighbors-discovery', name: 'Protect Neighbors Discovery', desc: 'Matikan broadcast MNDP/CDP agar router tidak bocor di Winbox tetangga.', icon: 'fa-user-secret', badge: 'FREE', version: 'both' },
        { id: 'remove-all-firewall', name: 'Remove All Firewall', desc: 'Reset bersih seluruh rule filter, nat, mangle, dan raw.', icon: 'fa-trash-arrow-up', badge: 'FREE', version: 'both' },
        { id: 'remove-all-queue', name: 'Remove All Queue', desc: 'Hapus seluruh Simple Queue dan Queue Tree di router.', icon: 'fa-delete-left', badge: 'FREE', version: 'both' },
        { id: 'remove-arp-table', name: 'Remove ARP Table', desc: 'Hapus seluruh entri dynamic pada tabel ARP router.', icon: 'fa-arrows-rotate', badge: 'FREE', version: 'both' },
        { id: 'remove-dhcp-server-client', name: 'Remove DHCP Server & Client', desc: 'Hapus seluruh konfigurasi DHCP Server, network, dan lease.', icon: 'fa-circle-xmark', badge: 'FREE', version: 'both' },
        { id: 'remove-dns', name: 'Remove DNS', desc: 'Reset pengaturan DNS resolver dan hapus static DNS.', icon: 'fa-rotate-left', badge: 'FREE', version: 'both' },
        { id: 'remove-all-hotspot', name: 'Remove All Hotspot', desc: 'Hapus total seluruh komponen hotspot dan user voucher.', icon: 'fa-dumpster', badge: 'FREE', version: 'both' },
        { id: 'remove-all-ip-address', name: 'Remove All IP Address', desc: 'Hapus seluruh IP Address di semua interface router.', icon: 'fa-eraser', badge: 'FREE', version: 'both' },
        { id: 'remove-all-ip-pool', name: 'Remove All IP Pool', desc: 'Hapus seluruh entri IP Pool di menu /ip pool.', icon: 'fa-recycle', badge: 'FREE', version: 'both' },
        { id: 'remove-interface-bridge', name: 'Remove Interface & Bridge', desc: 'Hapus seluruh bridge port dan interface bridge.', icon: 'fa-bridge-circle-xmark', badge: 'FREE', version: 'both' },
        { id: 'remove-all-ppp', name: 'Remove All PPP', desc: 'Hapus seluruh koneksi aktif PPP dan database secret.', icon: 'fa-user-xmark', badge: 'FREE', version: 'both' },
        { id: 'remove-all-routing', name: 'Remove All Routing', desc: 'Hapus seluruh rute statis di tabel routing.', icon: 'fa-route', badge: 'FREE', version: 'both' },
        { id: 'reset-all-counters', name: 'Reset All Counters', desc: 'Reset byte/packet counter di firewall dan queue ke angka nol.', icon: 'fa-gauge-simple', badge: 'FREE', version: 'both' },
        { id: 'reset-mac-all-interfaces', name: 'Reset MAC All Interfaces', desc: 'Kembalikan alamat fisik MAC seluruh interface ke bawaan pabrik.', icon: 'fa-arrows-rotate', badge: 'FREE', version: 'both' },
        { id: 'set-identity-router', name: 'Set Identity Router', desc: 'Ganti nama router identity yang muncul di Winbox & terminal.', icon: 'fa-tag', badge: 'FREE', version: 'both' },
        { id: 'setup-ntp-client', name: 'Setup NTP Client', desc: 'Sinkronisasi jam router otomatis ke pool NTP dan zona waktu lokal.', icon: 'fa-clock', badge: 'FREE', version: 'both' },
        { id: 'setup-romon', name: 'Setup RoMON Discovery', desc: 'Aktifkan Router Management Overlay Network untuk remote antar router.', icon: 'fa-network-wired', badge: 'FREE', version: 'both' },
        { id: 'shutdown-reset-reboot', name: 'Shutdown / Reset / Reboot', desc: 'Perintah reboot, shutdown, atau factory reset konfigurasi.', icon: 'fa-power-off', badge: 'FREE', version: 'both' },
        { id: 'system-note-terminal', name: 'System Note Terminal', desc: 'Atur banner catatan atau peringatan yang muncul saat login terminal.', icon: 'fa-message', badge: 'FREE', version: 'both' },
        { id: 'traceroutetool', name: 'Traceroute Diagnostic Tool', desc: 'Lakukan penelusuran rute paket jaringan langsung dari terminal.', icon: 'fa-route', badge: 'FREE', version: 'both' },
        { id: 'walled-garden', name: 'Walled Garden Portal', desc: 'Daftarkan domain bebas akses sebelum login captive portal.', icon: 'fa-shield-cat', badge: 'FREE', version: 'both' }
      ]
    },

    // 8. OFFICIAL MIKROTIK UTILITIES
    {
      id: 'cat-official',
      name: 'Tools Official Windows / Linux / macOS',
      subtitle: 'Software dan utilitas resmi langsung dari server MikroTik Ltd.',
      icon: 'fa-download',
      color: 'cyan',
      tools: [
        { id: 'winbox-64', name: 'Winbox-64 (64bit)', desc: 'Aplikasi manajemen grafis resmi 64-bit untuk sistem operasi Windows.', icon: 'fa-window-maximize', badge: 'OFFICIAL', version: 'both' },
        { id: 'winbox-32', name: 'Winbox-32 (32bit)', desc: 'Winbox resmi arsitektur 32-bit untuk Windows legacy.', icon: 'fa-window-restore', badge: 'OFFICIAL', version: 'both' },
        { id: 'winbox-4-windows', name: 'Winbox 4 Version Windows', desc: 'Generasi baru Winbox 4 modern dengan native dark mode untuk Windows.', icon: 'fa-windows', badge: 'NEW', version: 'both' },
        { id: 'winbox-4-linux', name: 'Winbox 4 Version Linux', desc: 'Aplikasi native Winbox 4 untuk Linux (Ubuntu, Debian, Fedora, Arch) tanpa WINE.', icon: 'fa-linux', badge: 'NEW', version: 'both' },
        { id: 'winbox-4-macos', name: 'Winbox 4 Version MacOS', desc: 'Aplikasi native Winbox 4 untuk Apple macOS (Apple Silicon & Intel).', icon: 'fa-apple', badge: 'NEW', version: 'both' },
        { id: 'the-dude-client', name: 'The Dude Client', desc: 'Software monitoring topologi jaringan resmi dari MikroTik.', icon: 'fa-desktop', badge: 'OFFICIAL', version: 'both' },
        { id: 'netinstall', name: 'Netinstall Recovery Tool', desc: 'Alat recovery resmi untuk instalasi ulang RouterOS pada router boot-loop.', icon: 'fa-wrench', badge: 'OFFICIAL', version: 'both' },
        { id: 'flashfig', name: 'FlashFig Mass Provisioning', desc: 'Konfigurasi otomatis ratusan RouterBOARD baru saat dicolokkan pertama kali.', icon: 'fa-bolt-lightning', badge: 'OFFICIAL', version: 'both' },
        { id: 'mikrotik-mib', name: 'MikroTik.mib SNMP File', desc: 'File SNMP MIB resmi untuk integrasi dengan Zabbix, PRTG, dan Cacti.', icon: 'fa-file-code', badge: 'OFFICIAL', version: 'both' },
        { id: 'drawings-visio', name: 'Drawings for Microsoft VISIO', desc: 'Vektor stencil RouterBOARD resmi untuk diagram topologi Microsoft Visio.', icon: 'fa-bezier-curve', badge: 'OFFICIAL', version: 'both' },
        { id: 'bandwidth-test', name: 'Bandwidth Test Tool (btest)', desc: 'Program portabel Windows untuk uji throughput kecepatan langsung ke router.', icon: 'fa-gauge-high', badge: 'OFFICIAL', version: 'both' },
        { id: 'mt-syslog-daemon', name: 'MT Syslog Daemon', desc: 'Server penerima log jarak jauh untuk mengumpulkan riwayat logging di PC.', icon: 'fa-file-lines', badge: 'OFFICIAL', version: 'both' },
        { id: 'mt-traffic-counter', name: 'MT Traffic Counter', desc: 'Utilitas penghitung kuota data IP accounting untuk PC Windows.', icon: 'fa-calculator', badge: 'OFFICIAL', version: 'both' },
        { id: 'supout-rif-viewer', name: 'Supout.rif Analyzer', desc: 'Viewer online untuk menganalisis file diagnosis router supout.rif.', icon: 'fa-magnifying-glass-chart', badge: 'TOOL', version: 'both' },
        { id: 'branding-maker', name: 'WebFig Branding Maker', desc: 'Kustomisasi logo dan tampilan halaman WebFig untuk perusahaan Anda.', icon: 'fa-id-card', badge: 'TOOL', version: 'both' },
        { id: 'mikrotik-logo-pack', name: 'Logo, Wallpaper & Merch Pack', desc: 'Paket resmi logo vektor resolusi tinggi dan wallpaper desktop MikroTik.', icon: 'fa-image', badge: 'ASSETS', version: 'both' }
      ]
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ToolsCatalog };
}

