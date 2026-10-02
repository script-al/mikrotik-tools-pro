/**
 * Official Tools Engine — ComitTools PRO
 * Provides verified download links, tool info, and online viewers for official MikroTik utilities
 */

const OfficialTools = (function() {
  'use strict';

  const officialList = {
    'winbox-64': {
      title: 'Winbox-64 (64bit)',
      category: 'Windows Utility',
      version: 'v3.43 (x64)',
      size: '2.6 MB',
      url: 'https://download.mikrotik.com/routeros/winbox/3.43/winbox64.exe',
      desc: 'Aplikasi manajemen grafis resmi MikroTik RouterOS arsitektur 64-bit untuk Windows. Versi 3.43 stabil dan mendukung semua RouterOS v6 & v7.'
    },
    'winbox-32': {
      title: 'Winbox-32 (32bit)',
      category: 'Windows Utility',
      version: 'v3.43 (x86)',
      size: '2.0 MB',
      url: 'https://download.mikrotik.com/routeros/winbox/3.43/winbox.exe',
      desc: 'Winbox 32-bit versi 3.43 resmi untuk kompatibilitas Windows 32-bit legacy.'
    },
    'winbox-4-windows': {
      title: 'Winbox 4 Version Windows',
      category: 'Cross-Platform Next-Gen',
      version: 'v4.x (Windows)',
      size: 'Official Web',
      url: 'https://mikrotik.com/download/winbox',
      desc: 'Halaman unduhan resmi Winbox 4 generasi baru untuk platform Microsoft Windows.'
    },
    'winbox-4-linux': {
      title: 'Winbox 4 Version Linux',
      category: 'Linux Utility',
      version: 'v4.x (Linux)',
      size: 'Official Web',
      url: 'https://mikrotik.com/download/winbox',
      desc: 'Halaman unduhan resmi Winbox 4 native Linux (AppImage / tar.gz).'
    },
    'winbox-4-macos': {
      title: 'Winbox 4 Version MacOS',
      category: 'macOS Utility',
      version: 'v4.x (macOS)',
      size: 'Official Web',
      url: 'https://mikrotik.com/download/winbox',
      desc: 'Halaman unduhan resmi Winbox 4 untuk Apple macOS (DMG).'
    },
    'the-dude-client': {
      title: 'The Dude Client',
      category: 'Network Monitoring',
      version: 'v6.49 / v7.x',
      size: '4.8 MB',
      url: 'https://download.mikrotik.com/dude/6.49.10/dude-install-6.49.10.exe',
      desc: 'Aplikasi monitoring topologi jaringan resmi dari MikroTik. Memetakan network map, status ping perangkat, bandwidth graphs, dan outage alert.'
    },
    'netinstall': {
      title: 'Netinstall',
      category: 'Recovery Tool',
      version: 'v7.16 / v6.49',
      size: '3.2 MB',
      url: 'https://download.mikrotik.com/routeros/7.16/netinstall-7.16.zip',
      desc: 'Software recovery resmi dari MikroTik untuk instalasi ulang RouterOS pada router yang boot-loop, lupa password total, atau gagal upgrade.'
    },
    'flashfig': {
      title: 'FlashFig',
      category: 'Mass Provisioning',
      version: 'Official',
      size: '1.2 MB',
      url: 'https://mikrotik.com/download/tools',
      desc: 'Utilitas mass-provisioning untuk mengonfigurasi otomatis ratusan unit RouterBOARD baru begitu kabel ethernet dicolokkan pertama kali.'
    },
    'mikrotik-mib': {
      title: 'MikroTik.mib',
      category: 'SNMP / Monitoring',
      version: 'Latest SNMPv2/v3',
      size: '18 KB',
      url: 'https://download.mikrotik.com/routeros/mikrotik.mib',
      desc: 'File Management Information Base (MIB) SNMP resmi untuk integrasi dengan Zabbix, PRTG, Cacti, Nagios, Prometheus.'
    },
    'drawings-visio': {
      title: 'Drawings for VISIO',
      category: 'Network Design',
      version: 'Stencils Pack',
      size: '12 MB',
      url: 'https://download.mikrotik.com/visio.zip',
      desc: 'Kumpulan stencils vektor resmi MikroTik RouterBOARD untuk Microsoft Visio guna mendesain diagram topologi jaringan profesional.'
    },
    'bandwidth-test': {
      title: 'Bandwidth Test Tool',
      category: 'Diagnostic Tool',
      version: 'v0.1',
      size: '64 KB',
      url: 'https://download.mikrotik.com/btest.exe',
      desc: 'Program portabel Windows ringan untuk menguji throughput bandwidth TCP/UDP langsung ke server MikroTik.'
    },
    'mt-syslog-daemon': {
      title: 'MT Syslog Daemon',
      category: 'Logging Utility',
      version: 'Windows Syslog',
      size: '1.2 MB',
      url: 'https://i.mt.lv/files/exe/MT_Syslog.exe',
      desc: 'Server daemon MT_Syslog.exe resmi dari MikroTik untuk mengumpulkan riwayat logging MikroTik RouterOS ke komputer Windows.'
    },
    'mt-traffic-counter': {
      title: 'MT Traffic Counter',
      category: 'Billing / Accounting',
      version: 'TrafficCounter.zip',
      size: '800 KB',
      url: 'https://mikrotik.com/download/TrafficCounter.zip',
      desc: 'Server pencatat IP Traffic Accounting MikroTik resmi (TrafficCounter.zip) untuk memantau pemakaian kuota data per IP Address.'
    },
    'supout-rif-viewer': {
      title: 'Supout.rif viewer (need login)',
      category: 'Diagnostic Analyzer',
      version: 'Official Portal',
      size: 'Web Tool',
      url: 'https://mikrotik.com/client/supout',
      desc: 'Viewer dan analyzer resmi di portal MikroTik untuk membuka file diagnosis router [supout.rif] guna membaca log crash dan status hardware.'
    },
    'branding-maker': {
      title: 'Branding maker (need login)',
      category: 'Branding Tool',
      version: 'WebFig Maker',
      size: 'Web Portal',
      url: 'https://mikrotik.com/client/branding',
      desc: 'Pembuat paket branding resmi MikroTik untuk mengganti logo, icon, dan tampilan login WebFig default.'
    },
    'mikrotik-logo-pack': {
      title: 'MikroTik Merchandise & Assets',
      category: 'Official Merchandise',
      version: 'Logo, Wallpaper, T-Shirt',
      size: 'Official Store',
      url: 'https://merch.mikrotik.com/',
      desc: 'Portal toko merchandise resmi MikroTik: kaos, jaket, lanyard, stiker, logo resmi, dan wallpaper resmi MikroTik.'
    }
  };

  function getModalHTML(key) {
    const t = officialList[key];
    if (!t) return `<div style="padding:40px;text-align:center;color:var(--text-muted)">Tool not found</div>`;

    return `
      <div style="padding:28px 24px;max-width:700px;margin:0 auto">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border-color)">
          <div style="width:52px;height:52px;background:var(--brand-orange-light);border:1px solid rgba(255,92,0,0.3);border-radius:12px;display:flex;align-items:center;justify-content:center;color:var(--brand-orange);font-size:24px">
            <i class="fa-solid fa-download"></i>
          </div>
          <div>
            <h3 style="font-size:18px;color:#fff;margin-bottom:4px">${t.title}</h3>
            <div style="display:flex;gap:8px;font-size:11px">
              <span class="badge badge-teal">${t.category}</span>
              <span class="badge badge-orange">${t.version}</span>
              <span class="badge badge-cyan">${t.size}</span>
            </div>
          </div>
        </div>

        <div class="config-section" style="margin-bottom:20px">
          <div class="config-section-title"><i class="fa-solid fa-circle-info"></i> Deskripsi Utilitas</div>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.7">${t.desc}</p>
        </div>

        <div class="config-section" style="margin-bottom:24px">
          <div class="config-section-title"><i class="fa-solid fa-shield-check"></i> Sumber Download Resmi</div>
          <div style="font-size:11.5px;color:var(--text-muted);word-break:break-all;font-family:var(--font-mono);background:rgba(0,0,0,0.3);padding:10px;border-radius:6px;border:1px solid var(--border-color)">
            ${t.url}
          </div>
        </div>

        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="btn btn-secondary" onclick="closeModal('toolModal')">Tutup</button>
          <a href="${t.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="padding:10px 24px">
            <i class="fa-solid fa-cloud-arrow-down"></i> Unduh Sekarang (${t.size})
          </a>
        </div>
      </div>
    `;
  }

  return {
    officialList,
    getModalHTML
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OfficialTools };
}
