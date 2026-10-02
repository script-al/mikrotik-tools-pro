/**
 * LB PCC ULTIMATE Generator - ComitTools PRO
 * MikroTik RouterOS v6.x & v7.x
 * Supports 2-15 ISPs
 * Modes: LOCAL, RECURSIVE, HYBRID
 */

const LB_PCC = (function() {

  const COLORS = ['orange','teal','cyan','amber','rose','emerald','violet','pink','lime','indigo','fuchsia','sky','yellow','red','green'];

  /**
   * Main generator function
   * @param {Object} cfg - full configuration
   * @returns {string} - Complete RouterOS script
   */
  function generate(cfg) {
    const {
      rosVersion = 'v7',       // 'v6' | 'v7'
      mode = 'LOCAL',          // 'LOCAL' | 'RECURSIVE' | 'HYBRID'
      isps = [],               // Array of ISP objects
      lanIface = 'bridge-lan',
      lanSubnet = '192.168.88.0/24',
      lanGateway = '192.168.88.1',
      pccClassifier = 'both-addresses-and-ports',
      checkGateway = true,
      includeNat = true,
      includeAddrList = true,
      includeBypassList = true,
      clampMss = true,
      includeDns = true,
      dnsServers = '1.1.1.1,8.8.8.8',
      includeLoopback = false,
      includeComments = true,
    } = cfg;

    const n = isps.length;
    if (n < 2 || n > 15) {
      return '# Error: ISP count must be between 2 and 15';
    }

    // Critical Paywall Protection ("tidak jebol kecuali pemilik")
    if (typeof Auth !== 'undefined' && Auth.canAccessTool) {
      const access = Auth.canAccessTool('lb-pcc-ultimate');
      if (!access.allowed) {
        return '# ================================================================\n# COMITTOOLS PRO — ACCESS RESTRICTED (SUBSCRIPTION REQUIRED)\n# ' + (access.message || 'Fitur ini memerlukan paket langganan aktif.') + '\n# Silakan SUBSCRIBE untuk membuka fitur LB PCC Ultimate.\n# ================================================================';
      }
    }

    const out = [];
    const comment = includeComments;

    // ===================== HEADER =====================
    out.push('# ================================================================');
    out.push('# ComitTools PRO — LB PCC ULTIMATE Generator');
    out.push(`# Mode         : ${mode} (${modeDesc(mode)})`);
    out.push(`# RouterOS     : ${rosVersion.toUpperCase()}`);
    out.push(`# ISP Count    : ${n}`);
    out.push(`# LAN Interface: ${lanIface} (${lanSubnet})`);
    out.push(`# Generated    : ${new Date().toLocaleString('id-ID')}`);
    out.push(`# Winbox/WebFig Terminal — PASTE & ENTER`);
    out.push('# ================================================================');
    out.push('');

    // ===================== ROUTING TABLES (v7 only) =====================
    if (rosVersion === 'v7' && (mode === 'LOCAL' || mode === 'HYBRID')) {
      if (comment) out.push('# --- [1] Routing Tables (RouterOS v7 FIB) ---');
      out.push('/routing table');
      isps.forEach(isp => {
        out.push(`add disabled=no fib name=to_${safeName(isp.name)} comment="${isp.name}"`);
      });
      out.push('');
    }

    // ===================== IP ADDRESSES =====================
    if (comment) out.push('# --- [2] IP Address Assignment ---');
    isps.forEach(isp => {
      if (isp.ip) {
        out.push(`/ip address add address=${isp.ip} interface=${isp.iface} comment="${isp.name}"`);
      }
    });
    out.push(`/ip address add address=${lanGateway}${subnetToPrefix(lanSubnet)} interface=${lanIface} comment="LAN Gateway"`);
    out.push('');

    // ===================== DNS =====================
    if (includeDns) {
      if (comment) out.push('# --- [3] DNS Configuration ---');
      out.push(`/ip dns set allow-remote-requests=yes servers=${dnsServers}`);
      out.push('');
    }

    // ===================== NAT =====================
    if (includeNat) {
      if (comment) out.push('# --- [4] NAT Masquerade (Srcnat) ---');
      out.push('/ip firewall nat');
      isps.forEach(isp => {
        out.push(`add chain=srcnat out-interface=${isp.iface} action=masquerade comment="NAT ${isp.name}"`);
      });
      out.push('');
    }

    // ===================== FIREWALL ADDRESS LIST =====================
    if (includeAddrList) {
      if (comment) out.push('# --- [5a] Local Subnet Address List ---');
      out.push('/ip firewall address-list');
      out.push('add list=LOCAL_SUBNET address=0.0.0.0/8 comment="RFC 1122 (IANA This Network)"');
      out.push('add list=LOCAL_SUBNET address=10.0.0.0/8 comment="RFC 1918 Private"');
      out.push('add list=LOCAL_SUBNET address=100.64.0.0/10 comment="RFC 6598 Carrier-Grade NAT"');
      out.push('add list=LOCAL_SUBNET address=127.0.0.0/8 comment="RFC 5735 Loopback"');
      out.push('add list=LOCAL_SUBNET address=169.254.0.0/16 comment="RFC 3927 APIPA"');
      out.push('add list=LOCAL_SUBNET address=172.16.0.0/12 comment="RFC 1918 Private"');
      out.push('add list=LOCAL_SUBNET address=192.168.0.0/16 comment="RFC 1918 Private"');
      out.push('add list=LOCAL_SUBNET address=198.18.0.0/15 comment="RFC 2544 Benchmark"');
      out.push('add list=LOCAL_SUBNET address=224.0.0.0/4 comment="RFC 3171 Multicast"');
      out.push('add list=LOCAL_SUBNET address=240.0.0.0/4 comment="RFC 1112 Reserved"');
      out.push('');
    }

    if (includeBypassList) {
      if (comment) out.push('# --- [5b] Direct & Banking Bypass Address List ---');
      out.push('/ip firewall address-list');
      out.push('add list=BYPASS_PCC address=202.6.208.0/20 comment="BCA KlikPay & API"');
      out.push('add list=BYPASS_PCC address=103.18.116.0/22 comment="Bank Mandiri Livin"');
      out.push('add list=BYPASS_PCC address=103.3.68.0/22 comment="BRImo"');
      out.push('add list=BYPASS_PCC address=103.247.116.0/22 comment="BNI"');
      out.push('add list=BYPASS_PCC address=103.153.72.0/22 comment="Bank Syariah Indonesia"');
      out.push('add list=BYPASS_PCC address=157.240.0.0/16 comment="WhatsApp / Meta Direct"');
      out.push('');
    }

    // ===================== MANGLE RULES =====================
    if (comment) out.push('# --- [6] Mangle Rules ---');
    out.push('/ip firewall mangle');

    // Accept established/related at start (performance)
    out.push('add chain=prerouting action=accept connection-state=established,related comment="Accept Established/Related"');

    // Bypass local traffic
    out.push(`add chain=prerouting action=accept dst-address-list=LOCAL_SUBNET in-interface=${lanIface} comment="Bypass LAN to LAN Traffic"`);

    // Bypass special destinations (banking & whatsapp)
    if (includeBypassList) {
      out.push(`add chain=prerouting action=accept dst-address-list=BYPASS_PCC in-interface=${lanIface} comment="Bypass PCC for Banking & WhatsApp"`);
    }

    // MSS Clamping
    if (clampMss) {
      out.push('add chain=forward protocol=tcp tcp-flags=syn action=change-mss new-mss=clamp-to-pmtu comment="Clamp TCP MSS to PMTU"');
    }

    // Mark incoming connections from each WAN
    if (comment) out.push('# Mark-connection per ISP input');
    isps.forEach(isp => {
      out.push(`add chain=input in-interface=${isp.iface} action=mark-connection new-connection-mark=${connMark(isp)}_in passthrough=yes comment="Mark Input ${isp.name}"`);
      out.push(`add chain=output connection-mark=${connMark(isp)}_in action=mark-routing new-routing-mark=to_${safeName(isp.name)} passthrough=no comment="Route Reply ${isp.name}"`);
    });

    out.push('');

    // Calculate weights & distribution
    let totalWeight = 0;
    const weights = isps.map(isp => {
      const w = parseInt(isp.weight) || 1;
      totalWeight += Math.max(1, w);
      return Math.max(1, w);
    });

    // PCC classification
    if (comment) out.push(`# PCC Classification — distribute connections across ISPs (Total Ratio: ${totalWeight})`);
    let currentRemainder = 0;
    isps.forEach((isp, ispIdx) => {
      const w = weights[ispIdx];
      for (let r = 0; r < w; r++) {
        out.push(`add chain=prerouting dst-address-type=!local in-interface=${lanIface} action=mark-connection \\`);
        out.push(`    per-connection-classifier=${pccClassifier}:${totalWeight}/${currentRemainder} new-connection-mark=${connMark(isp)} \\`);
        out.push(`    passthrough=yes comment="PCC ${totalWeight}/${currentRemainder} -> ${isp.name}${w > 1 ? ` (Ratio ${r + 1}/${w})` : ''}"`);
        currentRemainder++;
      }
    });

    out.push('');

    // Apply routing marks
    if (comment) out.push('# Apply routing-mark from connection-mark');
    isps.forEach(isp => {
      out.push(`add chain=prerouting in-interface=${lanIface} connection-mark=${connMark(isp)} action=mark-routing \\`);
      out.push(`    new-routing-mark=to_${safeName(isp.name)} passthrough=no comment="Routing ${isp.name}"`);
    });

    out.push('');

    // ===================== RECURSIVE ROUTING ENTRIES =====================
    if (mode === 'RECURSIVE' || mode === 'HYBRID') {
      if (comment) out.push('# --- [7a] Recursive Gateway Check IPs ---');
      if (comment) out.push('# These entries check gateway reachability via ICMP recursively');
      out.push('/ip route');
      isps.forEach((isp, idx) => {
        const checkIp = isp.checkIp || (idx === 0 ? '8.8.8.8' : (idx === 1 ? '1.1.1.1' : `208.67.22.${idx * 10}`));
        const scope = 10 + idx;
        out.push(`add dst-address=${checkIp}/32 gateway=${isp.gateway} scope=${scope} target-scope=11 comment="Recursive check ${isp.name}"`);
      });
      out.push('');
    }

    // ===================== IP ROUTES =====================
    if (comment) out.push('# --- [7b] IP Routes (Default + Per-Table) ---');
    const checkGwStr = checkGateway ? ' check-gateway=ping' : '';

    out.push('/ip route');

    if (mode === 'RECURSIVE' || mode === 'HYBRID') {
      // Recursive mode: use recursive check IPs as gateway
      isps.forEach((isp, idx) => {
        const checkIp = isp.checkIp || (idx === 0 ? '8.8.8.8' : (idx === 1 ? '1.1.1.1' : `208.67.22.${idx * 10}`));
        out.push(`add disabled=no distance=${idx + 1} dst-address=0.0.0.0/0 gateway=${checkIp} target-scope=11 comment="Default Route ${isp.name} (Recursive)"`);
      });
    } else {
      // LOCAL mode: standard check-gateway
      isps.forEach((isp, idx) => {
        out.push(`add disabled=no distance=${idx + 1} dst-address=0.0.0.0/0 gateway=${isp.gateway}${checkGwStr} comment="Default Route ${isp.name}"`);
      });
    }

    out.push('');

    // Per-ISP routing table routes
    isps.forEach((isp, idx) => {
      if (rosVersion === 'v7' && (mode === 'LOCAL' || mode === 'HYBRID')) {
        out.push(`add disabled=no distance=1 dst-address=0.0.0.0/0 gateway=${isp.gateway}${checkGwStr} routing-table=to_${safeName(isp.name)} comment="Table Route ${isp.name}"`);
      } else {
        // v6 style
        if (mode === 'RECURSIVE' || mode === 'HYBRID') {
          const checkIp = isp.checkIp || (idx === 0 ? '8.8.8.8' : (idx === 1 ? '1.1.1.1' : `208.67.22.${idx * 10}`));
          out.push(`add disabled=no distance=1 dst-address=0.0.0.0/0 gateway=${checkIp} target-scope=11 routing-mark=to_${safeName(isp.name)} comment="Table Route ${isp.name} (Recursive)"`);
        } else {
          out.push(`add disabled=no distance=1 dst-address=0.0.0.0/0 gateway=${isp.gateway}${checkGwStr} routing-mark=to_${safeName(isp.name)} comment="Table Route ${isp.name}"`);
        }
      }
    });

    out.push('');

    // ===================== OPTIONAL DHCP SERVER =====================
    if (cfg.includeDhcp) {
      const [netAddr] = lanSubnet.split('/');
      const cidr = parseInt(lanSubnet.split('/')[1]);
      const hostBits = 32 - cidr;
      const poolStart = ipOffset(netAddr, 10);
      const poolEnd = ipOffset(netAddr, Math.min(250, (1 << hostBits) - 2));

      if (comment) out.push('# --- [8] DHCP Server & Pool ---');
      out.push(`/ip pool add name=pool-lan ranges=${poolStart}-${poolEnd}`);
      out.push(`/ip dhcp-server add address-pool=pool-lan disabled=no interface=${lanIface} lease-time=1h name=dhcp-lan`);
      out.push(`/ip dhcp-server network add address=${lanSubnet} dns-server=${dnsServers.split(',')[0]} gateway=${lanGateway} comment="LAN DHCP Network"`);
      out.push('');
    }

    // ===================== FOOTER =====================
    out.push('# ================================================================');
    out.push('# SCRIPT SELESAI — Paste di Winbox > New Terminal atau WebFig > Terminal');
    out.push(`# Mode: ${mode} | RouterOS: ${rosVersion.toUpperCase()} | ISPs: ${isps.map(i=>i.name).join(', ')}`);
    out.push('# TIPS: Aktifkan Safe Mode (Ctrl+X di Winbox) sebelum paste!');
    out.push('# ================================================================');

    return out.join('\n');
  }

  // =========== HELPERS ===========

  function safeName(name) {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_').toUpperCase();
  }

  function connMark(isp) {
    return `CONN_${safeName(isp.name)}`;
  }

  function modeDesc(mode) {
    switch (mode) {
      case 'LOCAL': return 'Standard PCC with check-gateway';
      case 'RECURSIVE': return 'Recursive routing with IP reachability check';
      case 'HYBRID': return 'PCC + Recursive check for best failover';
      default: return '';
    }
  }

  function subnetToPrefix(subnet) {
    if (subnet.includes('/')) {
      const cidr = subnet.split('/')[1];
      return `/${cidr}`;
    }
    return '/24';
  }

  function ipOffset(baseIp, offset) {
    const parts = baseIp.split('.').map(Number);
    let val = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
    val = (val + offset) >>> 0;
    return [
      (val >>> 24) & 255,
      (val >>> 16) & 255,
      (val >>> 8) & 255,
      val & 255
    ].join('.');
  }

  // Build default ISP list for given count
  function buildDefaultISPs(count) {
    const result = [];
    for (let i = 1; i <= count; i++) {
      result.push({
        name: `ISP${i}`,
        iface: `ether${i}`,
        gateway: `192.168.${i}.1`,
        ip: `192.168.${i}.2/24`,
        checkIp: i === 1 ? '8.8.8.8' : (i === 2 ? '1.1.1.1' : `8.8.4.${i}`)
      });
    }
    return result;
  }

  return { generate, buildDefaultISPs, safeName, COLORS };

})();

// Export for browser & Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LB_PCC };
}

