/**
 * Firewall Generator — ComitTools PRO
 * MikroTik RouterOS v6.x & v7.x
 * Complete firewall hardening script
 */
const FirewallGen = (function() {

  function generate(cfg) {
    const {
      rosVersion = 'v7',
      wanIface = 'ether1',
      lanIface = 'bridge-lan',
      protectWinbox = true,
      protectSSH = true,
      protectAPI = true,
      antiSynFlood = true,
      antiUDPFlood = true,
      portScanDetect = true,
      blockBogon = true,
      blockDNSFromWAN = true,
      dropInvalidPackets = true,
      enableICMPLimit = true,
      clientIsolation = false,
      portForwards = [],        // [{name, wanPort, lanIp, lanPort, proto}]
      allowedManageIPs = '',    // comma-separated IPs allowed to manage router
      blacklistTimeout = '1d',
    } = cfg;

    // Subscription Guard
    if (typeof Auth !== 'undefined' && Auth.canAccessTool) {
      const access = Auth.canAccessTool('firewall');
      if (!access.allowed) {
        return '# ================================================================\n# COMITTOOLS PRO — ACCESS RESTRICTED (SUBSCRIPTION REQUIRED)\n# ' + (access.message || 'Fitur ini memerlukan paket langganan aktif.') + '\n# Silakan SUBSCRIBE untuk membuka fitur Firewall Hardening.\n# ================================================================';
      }
    }

    const out = [];

    out.push('# ================================================================');
    out.push('# ComitTools PRO — Firewall Security Hardening');
    out.push(`# RouterOS: ${rosVersion.toUpperCase()} | WAN: ${wanIface} | LAN: ${lanIface}`);
    out.push('# ================================================================');
    out.push('');

    // ===== BOGON/BLACKLIST ADDRESS LISTS =====
    if (blockBogon) {
      out.push('# --- [1] Bogon & Blacklist Address Lists ---');
      out.push('/ip firewall address-list');
      out.push('add list=bogon_list address=0.0.0.0/8 comment="Bogon: This Network"');
      out.push('add list=bogon_list address=10.0.0.0/8 comment="Bogon: Private"');
      out.push('add list=bogon_list address=100.64.0.0/10 comment="Bogon: Carrier-Grade NAT"');
      out.push('add list=bogon_list address=127.0.0.0/8 comment="Bogon: Loopback"');
      out.push('add list=bogon_list address=169.254.0.0/16 comment="Bogon: APIPA"');
      out.push('add list=bogon_list address=172.16.0.0/12 comment="Bogon: Private"');
      out.push('add list=bogon_list address=192.0.0.0/24 comment="Bogon: IETF Protocol"');
      out.push('add list=bogon_list address=192.168.0.0/16 comment="Bogon: Private"');
      out.push('add list=bogon_list address=198.18.0.0/15 comment="Bogon: Benchmark"');
      out.push('add list=bogon_list address=198.51.100.0/24 comment="Bogon: Documentation"');
      out.push('add list=bogon_list address=203.0.113.0/24 comment="Bogon: Documentation"');
      out.push('add list=bogon_list address=224.0.0.0/4 comment="Bogon: Multicast"');
      out.push('add list=bogon_list address=240.0.0.0/4 comment="Bogon: Reserved"');
      out.push('add list=bogon_list address=255.255.255.255/32 comment="Bogon: Broadcast"');
      out.push('');
    }

    // ===== INPUT CHAIN =====
    out.push('# --- [2] INPUT Chain (Protect the Router itself) ---');
    out.push('/ip firewall filter');

    // Accept established/related
    out.push('add chain=input action=accept connection-state=established,related comment="Accept Established/Related"');

    // Drop invalid
    if (dropInvalidPackets) {
      out.push('add chain=input action=drop connection-state=invalid comment="Drop Invalid Packets"');
    }

    // Accept from LAN
    out.push(`add chain=input action=accept in-interface=${lanIface} comment="Accept from LAN"`);

    // Accept ICMP (limited)
    if (enableICMPLimit) {
      out.push('add chain=input action=accept protocol=icmp icmp-options=8:0 limit=50/5s,10:packet comment="Allow ICMP Echo-Request (rate limited)"');
      out.push('add chain=input action=accept protocol=icmp connection-state=established,related comment="Allow ICMP related"');
      out.push('add chain=input action=drop protocol=icmp comment="Drop excess ICMP"');
    }

    // Drop bogon source from WAN
    if (blockBogon) {
      out.push(`add chain=input action=drop in-interface=${wanIface} src-address-list=bogon_list comment="Drop Bogon Source IPs"`);
    }

    // Block DNS from WAN
    if (blockDNSFromWAN) {
      out.push(`add chain=input action=drop protocol=udp dst-port=53 in-interface=${wanIface} comment="Drop DNS Queries from WAN (Anti-Amplification)"`);
      out.push(`add chain=input action=drop protocol=tcp dst-port=53 in-interface=${wanIface} comment="Drop TCP DNS from WAN"`);
    }

    // Allowed management IPs
    if (allowedManageIPs) {
      const ips = allowedManageIPs.split(',').map(s => s.trim()).filter(Boolean);
      if (ips.length > 0) {
        ips.forEach(ip => {
          out.push(`add list=allowed_mgmt address=${ip} comment="Allowed Management IP"`);
        });
        out.push(`add chain=input src-address-list=allowed_mgmt action=accept comment="Allow from trusted management IPs"`);
      }
    }

    // SYN Flood protection
    if (antiSynFlood) {
      out.push('add chain=input protocol=tcp connection-state=new tcp-flags=syn limit=200,5:packet action=accept comment="Allow new TCP connections (rate limited)"');
      out.push('add chain=input protocol=tcp connection-state=new tcp-flags=syn action=drop comment="Drop TCP SYN Flood"');
    }

    // Winbox brute force
    if (protectWinbox) {
      out.push('# Winbox Brute-force Protection (Staged Blacklist)');
      out.push(`add chain=input protocol=tcp dst-port=8291 src-address-list=winbox_blacklist action=drop comment="Drop Winbox Blacklisted IPs"`);
      out.push(`add chain=input protocol=tcp dst-port=8291 connection-state=new src-address-list=winbox_stage3 action=add-src-to-address-list address-list=winbox_blacklist address-list-timeout=${blacklistTimeout} comment="Winbox: Stage 3 → Blacklist"`);
      out.push(`add chain=input protocol=tcp dst-port=8291 connection-state=new src-address-list=winbox_stage2 action=add-src-to-address-list address-list=winbox_stage3 address-list-timeout=1m`);
      out.push(`add chain=input protocol=tcp dst-port=8291 connection-state=new src-address-list=winbox_stage1 action=add-src-to-address-list address-list=winbox_stage2 address-list-timeout=1m`);
      out.push(`add chain=input protocol=tcp dst-port=8291 connection-state=new action=add-src-to-address-list address-list=winbox_stage1 address-list-timeout=1m comment="Winbox: Stage 1 detection"`);
    }

    // SSH protection
    if (protectSSH) {
      out.push('# SSH Brute-force Protection');
      out.push(`add chain=input protocol=tcp dst-port=22 src-address-list=ssh_blacklist action=drop comment="Drop SSH Blacklisted"`);
      out.push(`add chain=input protocol=tcp dst-port=22 connection-state=new src-address-list=ssh_stage3 action=add-src-to-address-list address-list=ssh_blacklist address-list-timeout=${blacklistTimeout}`);
      out.push(`add chain=input protocol=tcp dst-port=22 connection-state=new src-address-list=ssh_stage2 action=add-src-to-address-list address-list=ssh_stage3 address-list-timeout=1m`);
      out.push(`add chain=input protocol=tcp dst-port=22 connection-state=new src-address-list=ssh_stage1 action=add-src-to-address-list address-list=ssh_stage2 address-list-timeout=1m`);
      out.push(`add chain=input protocol=tcp dst-port=22 connection-state=new action=add-src-to-address-list address-list=ssh_stage1 address-list-timeout=1m comment="SSH: Stage 1 detection"`);
    }

    // API protection
    if (protectAPI) {
      out.push(`add chain=input protocol=tcp dst-port=8728,8729 in-interface=${wanIface} action=drop comment="Drop MikroTik API from WAN"`);
    }

    // Port scan detection
    if (portScanDetect) {
      out.push('# Port Scan Detection (PSD)');
      out.push(`add chain=input action=add-src-to-address-list address-list=port_scanners address-list-timeout=${blacklistTimeout} protocol=tcp psd=21,3s,3,1 comment="Detect TCP Port Scanners"`);
      out.push('add chain=input action=drop src-address-list=port_scanners comment="Drop Port Scanners"');
    }

    // Drop everything else from WAN
    out.push(`add chain=input in-interface=${wanIface} action=drop comment="Drop everything else from WAN"`);
    out.push('');

    // ===== FORWARD CHAIN =====
    out.push('# --- [3] FORWARD Chain (Control traffic through router) ---');

    // Accept established/related
    out.push('add chain=forward action=accept connection-state=established,related comment="Accept Established/Related Forward"');

    if (dropInvalidPackets) {
      out.push('add chain=forward action=drop connection-state=invalid comment="Drop Invalid Forward"');
    }

    // Client isolation (optional — blocks client-to-client on same LAN)
    if (clientIsolation) {
      out.push(`add chain=forward in-interface=${lanIface} out-interface=${lanIface} action=drop comment="Client Isolation — Block LAN-to-LAN direct traffic"`);
    }

    // UDP flood limit
    if (antiUDPFlood) {
      out.push('add chain=forward protocol=udp limit=2000/5s,100:packet action=accept comment="UDP Flood Limit — allow"');
      out.push('add chain=forward protocol=udp action=drop comment="UDP Flood Limit — drop excess"');
    }

    out.push(`add chain=forward in-interface=${lanIface} action=accept comment="Allow LAN forward to WAN"`);
    out.push(`add chain=forward in-interface=${wanIface} action=drop comment="Drop unsolicited from WAN"`);
    out.push('');

    // ===== NAT PORT FORWARD =====
    if (portForwards && portForwards.length > 0) {
      out.push('# --- [4] NAT Port Forwarding (Dst-NAT) ---');
      out.push('/ip firewall nat');
      portForwards.forEach(pf => {
        out.push(`add chain=dstnat in-interface=${wanIface} protocol=${pf.proto || 'tcp'} dst-port=${pf.wanPort} action=dst-nat to-addresses=${pf.lanIp} to-ports=${pf.lanPort} comment="${pf.name}"`);
        // Also add input filter to allow it
      });
      out.push('');
      out.push('/ip firewall filter');
      portForwards.forEach(pf => {
        out.push(`add chain=forward protocol=${pf.proto || 'tcp'} dst-port=${pf.lanPort} dst-address=${pf.lanIp} action=accept connection-state=new comment="Allow Port Forward: ${pf.name}"`);
      });
      out.push('');
    }

    out.push('# ================================================================');
    out.push('# END OF FIREWALL SCRIPT');
    out.push('# ================================================================');

    return out.join('\n');
  }

  return { generate };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FirewallGen };
}

