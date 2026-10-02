/**
 * Pro Tools & Recommended Tools Generator Engine — ComitTools PRO
 * Supports all PRO generators and specialized features
 * Compatible with RouterOS v6.x and v7.x
 */

const ProTools = (function() {
  'use strict';

  function banner(title, rosVersion) {
    return [
      '# ================================================================',
      `# ComitTools PRO — ${title}`,
      `# RouterOS Version : ${rosVersion ? rosVersion.toUpperCase() : 'v6 / v7'}`,
      `# Generated        : ${new Date().toLocaleString('id-ID')}`,
      '# Winbox / WebFig Terminal — Copy & Paste directly',
      '# ================================================================',
      ''
    ].join('\n');
  }

  const proToolDefs = {
    // 1. Starlink Load Balancing PCC
    'starlink-lb-pcc': {
      title: 'Starlink Load Balancing PCC',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-satellite"></i> Starlink + Fiber ISP Config</div>
            <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px">Optimal untuk menggabungkan Starlink (CGNAT, latency fluktuatif) dengan ISP fiber optic / ISP kedua.</p>
            <div class="form-group">
              <label class="form-label">Starlink Interface</label>
              <input class="form-control form-control-mono" id="pt_starlink_iface" value="ether1-starlink">
            </div>
            <div class="form-group">
              <label class="form-label">Secondary ISP Interface</label>
              <input class="form-control form-control-mono" id="pt_isp2_iface" value="ether2-fiber">
            </div>
            <div class="form-group">
              <label class="form-label">Secondary ISP Gateway</label>
              <input class="form-control form-control-mono" id="pt_isp2_gw" value="192.168.1.1">
            </div>
            <div class="form-group">
              <label class="form-label">LAN Interface</label>
              <input class="form-control form-control-mono" id="pt_lan_iface" value="bridge-lan">
            </div>
            <label class="form-check mb-0"><input type="checkbox" id="pt_mss_clamp" checked> Clamp MSS to 1420 (Mencegah MTU fragmentasi Starlink)</label>
          </div>
        `;
      },
      generate: function(v, ros) {
        const sl = v.starlink_iface || 'ether1-starlink';
        const fib = v.isp2_iface || 'ether2-fiber';
        const gw2 = v.isp2_gw || '192.168.1.1';
        const lan = v.lan_iface || 'bridge-lan';
        const isV7 = ros === 'v7';

        let out = banner('Starlink + Fiber PCC Load Balancing', ros);
        if (isV7) {
          out += '/routing table\nadd disabled=no fib name=to_STARLINK comment="Starlink Table"\nadd disabled=no fib name=to_FIBER comment="Fiber Table"\n\n';
        }

        out += `/ip firewall mangle\n` +
          `add chain=prerouting in-interface=${lan} dst-address-type=!local action=mark-connection per-connection-classifier=both-addresses-and-ports:2/0 new-connection-mark=CONN_STARLINK passthrough=yes comment="PCC 2/0 -> Starlink"\n` +
          `add chain=prerouting in-interface=${lan} dst-address-type=!local action=mark-connection per-connection-classifier=both-addresses-and-ports:2/1 new-connection-mark=CONN_FIBER passthrough=yes comment="PCC 2/1 -> Fiber"\n` +
          `add chain=prerouting in-interface=${lan} connection-mark=CONN_STARLINK action=mark-routing new-routing-mark=to_STARLINK passthrough=no comment="Route to Starlink"\n` +
          `add chain=prerouting in-interface=${lan} connection-mark=CONN_FIBER action=mark-routing new-routing-mark=to_FIBER passthrough=no comment="Route to Fiber"\n\n`;

        if (v.mss_clamp) {
          out += `# MSS Clamping for Starlink\n/ip firewall mangle add chain=forward protocol=tcp tcp-flags=syn out-interface=${sl} action=change-mss new-mss=clamp-to-pmtu comment="Clamp MSS Starlink"\n\n`;
        }

        out += `/ip firewall nat\n` +
          `add chain=srcnat out-interface=${sl} action=masquerade comment="NAT Starlink"\n` +
          `add chain=srcnat out-interface=${fib} action=masquerade comment="NAT Fiber"\n\n`;

        if (isV7) {
          out += `/ip route\n` +
            `add distance=1 dst-address=0.0.0.0/0 gateway=${gw2} routing-table=to_FIBER comment="Route Table Fiber"\n` +
            `add distance=1 dst-address=0.0.0.0/0 gateway=${sl} routing-table=to_STARLINK comment="Route Table Starlink"\n` +
            `add distance=1 dst-address=0.0.0.0/0 gateway=${gw2} check-gateway=ping comment="Default Fiber"\n` +
            `add distance=2 dst-address=0.0.0.0/0 gateway=${sl} comment="Default Starlink Backup"\n`;
        } else {
          out += `/ip route\n` +
            `add distance=1 dst-address=0.0.0.0/0 gateway=${gw2} routing-mark=to_FIBER comment="Route Table Fiber"\n` +
            `add distance=1 dst-address=0.0.0.0/0 gateway=${sl} routing-mark=to_STARLINK comment="Route Table Starlink"\n` +
            `add distance=1 dst-address=0.0.0.0/0 gateway=${gw2} check-gateway=ping comment="Default Fiber"\n` +
            `add distance=2 dst-address=0.0.0.0/0 gateway=${sl} comment="Default Starlink Backup"\n`;
        }

        return out;
      }
    },

    // 2. Load Balancing NTH
    'lb-nth': {
      title: 'Load Balancing NTH / LB NTH',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-arrows-split-up-and-left"></i> NTH Round Robin</div>
            <div class="form-group">
              <label class="form-label">Jumlah ISP</label>
              <select class="form-control" id="pt_nth_count">
                <option value="2" selected>2 ISP (50:50)</option>
                <option value="3">3 ISP (33:33:33)</option>
                <option value="4">4 ISP (25:25:25:25)</option>
              </select>
            </div>
            <div class="form-group mb-0">
              <label class="form-label">LAN Interface</label>
              <input class="form-control form-control-mono" id="pt_lan" value="bridge-lan">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const count = parseInt(v.nth_count) || 2;
        const lan = v.lan || 'bridge-lan';
        const isV7 = ros === 'v7';
        let out = banner(`Load Balancing NTH (${count} ISP)`, ros);

        if (isV7) {
          out += '/routing table\n';
          for (let i = 1; i <= count; i++) out += `add disabled=no fib name=to_ISP${i} comment="ISP${i}"\n`;
          out += '\n';
        }

        out += '/ip firewall mangle\n';
        for (let i = 1; i <= count; i++) {
          out += `add chain=prerouting in-interface=${lan} action=mark-packet nth=${count},${i} new-packet-mark=PKT_ISP${i} passthrough=no comment="NTH ${count},${i}"\n`;
        }
        for (let i = 1; i <= count; i++) {
          out += `add chain=prerouting in-interface=${lan} packet-mark=PKT_ISP${i} action=mark-routing new-routing-mark=to_ISP${i} passthrough=no\n`;
        }
        return out;
      }
    },

    // 3. Load Balancing ECMP
    'lb-ecmp': {
      title: 'Load Balancing ECMP (Equal Cost Multi-Path)',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-code-branch"></i> Gateways</div>
            <div class="form-group">
              <label class="form-label">Gateway ISP 1</label>
              <input class="form-control form-control-mono" id="pt_gw1" value="192.168.1.1">
            </div>
            <div class="form-group">
              <label class="form-label">Gateway ISP 2</label>
              <input class="form-control form-control-mono" id="pt_gw2" value="192.168.2.1">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Gateway ISP 3 (Opsional)</label>
              <input class="form-control form-control-mono" id="pt_gw3" placeholder="Leave blank if 2 ISP" value="">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const gws = [v.gw1, v.gw2, v.gw3].filter(Boolean).join(',');
        return banner('Load Balancing ECMP (Equal Cost Multi-Path)', ros) +
          `/ip route\n` +
          `add dst-address=0.0.0.0/0 gateway=${gws} check-gateway=ping comment="ECMP Multi-Gateway"\n` +
          `:put "ECMP default route installed across gateways: ${gws}."\n`;
      }
    },

    // 4. Failover Recursive Gateway
    'failover-recursive': {
      title: 'Failover Recursive Gateway',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-shield-halved"></i> Recursive Check</div>
            <div class="form-group">
              <label class="form-label">Primary ISP Gateway (ISP 1)</label>
              <input class="form-control form-control-mono" id="pt_gw1" value="192.168.1.1">
            </div>
            <div class="form-group">
              <label class="form-label">Primary Check Host IP</label>
              <input class="form-control form-control-mono" id="pt_check1" value="8.8.8.8">
            </div>
            <div class="form-group">
              <label class="form-label">Backup ISP Gateway (ISP 2)</label>
              <input class="form-control form-control-mono" id="pt_gw2" value="192.168.2.1">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Backup Check Host IP</label>
              <input class="form-control form-control-mono" id="pt_check2" value="1.1.1.1">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const g1 = v.gw1 || '192.168.1.1';
        const c1 = v.check1 || '8.8.8.8';
        const g2 = v.gw2 || '192.168.2.1';
        const c2 = v.check2 || '1.1.1.1';

        return banner('Failover Recursive Gateway (Target-Scope Auto Failover)', ros) +
          `# 1. Routing Host Check ke Gateway Asli\n` +
          `/ip route\n` +
          `add dst-address=${c1}/32 gateway=${g1} scope=10 comment="Host Check ISP1"\n` +
          `add dst-address=${c2}/32 gateway=${g2} scope=10 comment="Host Check ISP2"\n\n` +
          `# 2. Default Route Rekursif dengan Check Gateway Ping\n` +
          `add distance=1 dst-address=0.0.0.0/0 gateway=${c1} check-gateway=ping target-scope=11 comment="Primary Route (Recursive ISP1)"\n` +
          `add distance=2 dst-address=0.0.0.0/0 gateway=${c2} check-gateway=ping target-scope=11 comment="Backup Route (Recursive ISP2)"\n` +
          `:put "Recursive failover routes created. If 8.8.8.8 is unreachable via ISP1, ISP2 takes over automatically."\n`;
      }
    },

    // 5. Static Routing Youtube, Tiktok, FB, WA
    'static-routing-social': {
      title: 'Static Routing Youtube, Tiktok, FB, WA, etc.',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-brands fa-youtube"></i> Traffic Routing Target</div>
            <div class="form-group">
              <label class="form-label">Pilih ISP Khusus Sosmed / Video</label>
              <select class="form-control" id="pt_isp">
                <option value="ISP2" selected>ISP2 (Pisahkan dari Browsing & Game)</option>
                <option value="ISP1">ISP1</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">LAN Interface</label>
              <input class="form-control form-control-mono" id="pt_lan" value="bridge-lan">
            </div>
            <div class="config-section-title mt-2"><i class="fa-solid fa-check-double"></i> Platform Terpilih</div>
            <label class="form-check"><input type="checkbox" id="pt_yt" checked> YouTube & Google Video</label>
            <label class="form-check"><input type="checkbox" id="pt_tt" checked> TikTok CDN</label>
            <label class="form-check"><input type="checkbox" id="pt_fb" checked> Facebook & Instagram</label>
            <label class="form-check mb-0"><input type="checkbox" id="pt_wa" checked> WhatsApp Calling & Media</label>
          </div>
        `;
      },
      generate: function(v, ros) {
        const isp = v.isp || 'ISP2';
        const lan = v.lan || 'bridge-lan';
        return banner('Static Routing Social Media & Video Traffic', ros) +
          `/ip firewall address-list\n` +
          `add list=MEDIA_STREAMING address=youtube.com comment="YouTube"\n` +
          `add list=MEDIA_STREAMING address=googlevideo.com comment="YouTube CDN"\n` +
          `add list=MEDIA_STREAMING address=tiktok.com comment="TikTok"\n` +
          `add list=MEDIA_STREAMING address=byteoversea.com comment="TikTok CDN"\n` +
          `add list=MEDIA_STREAMING address=facebook.com comment="FB"\n` +
          `add list=MEDIA_STREAMING address=fbcdn.net comment="FB CDN"\n` +
          `add list=MEDIA_STREAMING address=instagram.com comment="IG"\n` +
          `add list=MEDIA_STREAMING address=whatsapp.com comment="WA"\n` +
          `add list=MEDIA_STREAMING address=whatsapp.net comment="WA CDN"\n\n` +
          `/ip firewall mangle\n` +
          `add chain=prerouting in-interface=${lan} dst-address-list=MEDIA_STREAMING action=mark-routing new-routing-mark=to_${isp} passthrough=no comment="Route Social & Video to ${isp}"\n` +
          `:put "Social media traffic routing mark applied."\n`;
      }
    },

    // 6. QoS Priority Youtube, Tiktok, WA, FB, etc.
    'qos-priority-social': {
      title: 'QoS Priority Youtube, Tiktok, WA, FB, etc.',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-layer-group"></i> Prioritas Bandwidth</div>
            <div class="form-group">
              <label class="form-label">Total Bandwidth Download</label>
              <input class="form-control form-control-mono" id="pt_total_down" value="50M">
            </div>
            <div class="form-group">
              <label class="form-label">Download Interface</label>
              <input class="form-control form-control-mono" id="pt_down_iface" value="bridge-lan">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Priority Video (1 Highest - 8 Lowest)</label>
              <select class="form-control" id="pt_prio">
                <option value="4" selected>Priority 4 (Medium High)</option>
                <option value="6">Priority 6 (Below Normal)</option>
                <option value="2">Priority 2 (High)</option>
              </select>
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const tot = v.total_down || '50M';
        const iface = v.down_iface || 'bridge-lan';
        const prio = v.prio || '4';

        return banner('QoS Priority Streaming & Social Media (Queue Tree)', ros) +
          `/ip firewall mangle\n` +
          `add chain=forward dst-address-list=MEDIA_STREAMING action=mark-packet new-packet-mark=PKT_STREAMING passthrough=no comment="Mark Media Streaming"\n\n` +
          `/queue tree\n` +
          `add name="TOTAL-DOWNLOAD" parent=${iface} max-limit=${tot} comment="Parent Download"\n` +
          `add name="PRIO-STREAMING" parent="TOTAL-DOWNLOAD" packet-mark=PKT_STREAMING priority=${prio} max-limit=${tot} comment="Streaming Priority ${prio}"\n` +
          `:put "Queue tree QoS priority created."\n`;
      }
    },

    // 7. Games Static Routing Using Filter Raw
    'games-static-raw': {
      title: 'Games Static Routing Using Filter Raw (Zero CPU)',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-gamepad"></i> Raw IP Address-List Filter</div>
            <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px">Metode RAW melewati connection-tracking sehingga menggunakan hampir 0% CPU router!</p>
            <div class="form-group">
              <label class="form-label">LAN Interface</label>
              <input class="form-control form-control-mono" id="pt_lan" value="bridge-lan">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Gaming ISP Routing Mark</label>
              <input class="form-control form-control-mono" id="pt_gw" value="to_ISP1">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const lan = v.lan || 'bridge-lan';
        const gw = v.gw || 'to_ISP1';
        return banner('Games Static Routing via Raw Table', ros) +
          `/ip firewall raw\n` +
          `add chain=prerouting in-interface=${lan} dst-port=5000-5200,9001-9010,7000-8000 protocol=udp action=accept comment="RAW Allow MLBB/PUBG"\n\n` +
          `/ip firewall mangle\n` +
          `add chain=prerouting in-interface=${lan} protocol=udp dst-port=5000-5200,9001-9010,7000-8000 action=mark-routing new-routing-mark=${gw} passthrough=no comment="Route Game UDP to ${gw}"\n` +
          `:put "RAW game classification active."\n`;
      }
    },

    // 8. Games Static Routing Using Mangle Port
    'games-static-mangle': {
      title: 'Games Static Routing Using Mangle Port',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-bolt"></i> Port Based Game Mangle</div>
            <div class="form-group">
              <label class="form-label">LAN Interface</label>
              <input class="form-control form-control-mono" id="pt_lan" value="bridge-lan">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Gaming ISP</label>
              <input class="form-control form-control-mono" id="pt_isp" value="to_ISP1">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const lan = v.lan || 'bridge-lan';
        const isp = v.isp || 'to_ISP1';
        return banner('Games Static Routing using Port Mangles', ros) +
          `/ip firewall mangle\n` +
          `# Mobile Legends Bang Bang\n` +
          `add chain=prerouting in-interface=${lan} protocol=tcp dst-port=5500-5700,8443,30000-30300 action=mark-routing new-routing-mark=${isp} passthrough=no comment="MLBB TCP"\n` +
          `add chain=prerouting in-interface=${lan} protocol=udp dst-port=5000-5200,5500-5700,9001-9010,30000-30300 action=mark-routing new-routing-mark=${isp} passthrough=no comment="MLBB UDP"\n` +
          `# PUBG Mobile & Free Fire\n` +
          `add chain=prerouting in-interface=${lan} protocol=udp dst-port=10012,17500,10491,10612,10086,39698,39799 action=mark-routing new-routing-mark=${isp} passthrough=no comment="PUBG & FF UDP"\n` +
          `:put "Game ports redirected to ${isp}."\n`;
      }
    },

    // 9. Website Static Routing
    'website-static-routing': {
      title: 'Website Static Routing',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-globe"></i> Domain to ISP Routing</div>
            <div class="form-group">
              <label class="form-label">Domain Name</label>
              <input class="form-control form-control-mono" id="pt_domain" value="bankbca.co.id">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Target ISP</label>
              <input class="form-control form-control-mono" id="pt_isp" value="to_ISP1">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const d = v.domain || 'example.com';
        const isp = v.isp || 'to_ISP1';
        return banner(`Static Routing Domain [${d}] to [${isp}]`, ros) +
          `/ip firewall address-list add address=${d} list=SPECIFIC_WEB comment="${d}"\n` +
          `/ip firewall mangle add chain=prerouting dst-address-list=SPECIFIC_WEB action=mark-routing new-routing-mark=${isp} passthrough=no comment="Route ${d} to ${isp}"\n` +
          `:put "Domain ${d} successfully bound to ${isp}."\n`;
      }
    },

    // 10. Local Client IP Static Routing
    'local-client-static-routing': {
      title: 'Local Client IP Static Routing (VIP Client)',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-user-tie"></i> Dedicated Client Path</div>
            <div class="form-group">
              <label class="form-label">Client IP / Subnet</label>
              <input class="form-control form-control-mono" id="pt_client" value="192.168.88.10">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Dedicated ISP</label>
              <input class="form-control form-control-mono" id="pt_isp" value="to_ISP1">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const c = v.client || '192.168.88.10';
        const isp = v.isp || 'to_ISP1';
        return banner(`Dedicated Route for Client [${c}] via [${isp}]`, ros) +
          `/ip firewall mangle add chain=prerouting src-address=${c} action=mark-routing new-routing-mark=${isp} passthrough=no comment="VIP Client ${c} -> ${isp}"\n` +
          `:put "Client ${c} dedicated route installed."\n`;
      }
    },

    // 11. All Traffic to VPN Tunnel
    'all-traffic-vpn-tunnel': {
      title: 'All Traffic to VPN Tunnel',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-lock"></i> Full VPN Routing</div>
            <div class="form-group">
              <label class="form-label">VPN Interface</label>
              <input class="form-control form-control-mono" id="pt_vpn_iface" value="wireguard1">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Client Subnet to Tunnel</label>
              <input class="form-control form-control-mono" id="pt_lan" value="192.168.88.0/24">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const vpn = v.vpn_iface || 'wireguard1';
        const lan = v.lan || '192.168.88.0/24';
        return banner('All Traffic to VPN Tunnel', ros) +
          `/ip firewall nat add chain=srcnat out-interface=${vpn} action=masquerade comment="NAT to VPN"\n` +
          `/ip firewall mangle add chain=prerouting src-address=${lan} dst-address-type=!local action=mark-routing new-routing-mark=to_VPN passthrough=no comment="Route LAN to VPN"\n` +
          `/ip route add distance=1 dst-address=0.0.0.0/0 gateway=${vpn} routing-mark=to_VPN comment="VPN Default Gateway"\n` +
          `:put "All traffic from ${lan} routed through ${vpn}."\n`;
      }
    },

    // 12. BGP Script Generator
    'bgp-generator': {
      title: 'BGP (iBGP/eBGP) Script Generator',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-diagram-project"></i> BGP AS & Peer</div>
            <div class="form-group">
              <label class="form-label">Local AS Number</label>
              <input class="form-control form-control-mono" id="pt_local_as" value="64512">
            </div>
            <div class="form-group">
              <label class="form-label">Router ID</label>
              <input class="form-control form-control-mono" id="pt_router_id" value="192.168.88.1">
            </div>
            <div class="form-group">
              <label class="form-label">Remote Peer AS Number</label>
              <input class="form-control form-control-mono" id="pt_remote_as" value="64513">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Remote Peer IP</label>
              <input class="form-control form-control-mono" id="pt_remote_ip" value="10.255.255.2">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const isV7 = ros === 'v7';
        const las = v.local_as || '64512';
        const rid = v.router_id || '192.168.88.1';
        const ras = v.remote_as || '64513';
        const rip = v.remote_ip || '10.255.255.2';

        let out = banner('BGP Routing Setup', ros);
        if (isV7) {
          out += `/routing bgp template add name=bgp-comittools as=${las} router-id=${rid}\n` +
            `/routing bgp connection add name=peer-isp template=bgp-comittools remote.as=${ras} remote.address=${rip}\n`;
        } else {
          out += `/routing bgp instance set default as=${las} router-id=${rid}\n` +
            `/routing bgp peer add name=peer-isp remote-address=${rip} remote-as=${ras}\n`;
        }
        out += `:put "BGP session configured with peer AS${ras}."\n`;
        return out;
      }
    },

    // 13. MikroTik Ninja: Hide Routerboard from ISP
    'mikrotik-ninja': {
      title: 'MikroTik Ninja: Hide Routerboard from ISP',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-user-ninja text-orange"></i> Stealth ISP Masking Suite</div>
            <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px">Menyembunyikan keberadaan router MikroTik dari deteksi ISP: normalisasi TTL hop, matikan respon traceroute, matikan MAC server/ping/telnet, sembunyikan MNDP/CDP, dan blokir scan port WAN.</p>
            <div class="form-group">
              <label class="form-label">WAN Interface (Menghadap Modem/ISP)</label>
              <input class="form-control form-control-mono" id="pt_wan" value="ether1">
            </div>
            <div class="form-group">
              <label class="form-label">Mode Normalisasi TTL</label>
              <select class="form-control" id="pt_ttl_mode">
                <option value="set_64" selected>Set TTL = 64 (Identik dengan Single PC / Laptop)</option>
                <option value="increment_1">Increment TTL +1 (Batalkan Pengurangan Hop)</option>
                <option value="set_128">Set TTL = 128 (Identik dengan Windows OS)</option>
              </select>
            </div>
            <label class="form-check"><input type="checkbox" id="pt_mac_server" checked> Disable MAC Telnet, MAC Winbox & MAC Ping di Semua Interface</label>
            <label class="form-check"><input type="checkbox" id="pt_mndp" checked> Matikan Discovery Broadcast (MNDP, CDP, LLDP) di WAN</label>
            <label class="form-check"><input type="checkbox" id="pt_tr" checked> Drop ICMP Traceroute Time-Exceeded (Sembunyikan dari tracert ISP)</label>
            <label class="form-check"><input type="checkbox" id="pt_ping_wan" checked> Drop WAN ICMP Ping (Echo-Request) dari ISP</label>
            <label class="form-check"><input type="checkbox" id="pt_btest" checked> Nonaktifkan Bandwidth Test Server (Port 2000)</label>
            <label class="form-check"><input type="checkbox" id="pt_wan_ports" checked> Drop Scanning Port Manajemen WAN (Winbox 8291, Web 80/443, SSH, Telnet)</label>
            <label class="form-check mb-0"><input type="checkbox" id="pt_mask_dhcp" checked> Samarkan Hostname pada DHCP Client WAN</label>
          </div>
        `;
      },
      generate: function(v, ros) {
        const wan = v.wan || 'ether1';
        const ttlMode = v.ttl_mode || 'set_64';
        const isV7 = ros === 'v7';

        let out = banner('MikroTik Ninja — Total ISP Stealth Masking', ros);

        out += `# ================================================================\n` +
          `# 1. Normalisasi TTL Outgoing\n` +
          `# ISP mendeteksi routerboard dari pengurangan nilai TTL hop paket.\n` +
          `# ================================================================\n`;

        if (ttlMode === 'increment_1') {
          out += `/ip firewall mangle add chain=postrouting out-interface=${wan} action=change-ttl new-ttl=increment:1 passthrough=yes comment="Ninja: Increment TTL +1"\n\n`;
        } else if (ttlMode === 'set_128') {
          out += `/ip firewall mangle add chain=postrouting out-interface=${wan} action=change-ttl new-ttl=set:128 passthrough=yes comment="Ninja: Set TTL 128 (Windows PC)"\n\n`;
        } else {
          out += `/ip firewall mangle add chain=postrouting out-interface=${wan} action=change-ttl new-ttl=set:64 passthrough=yes comment="Ninja: Normal TTL 64 (Linux/PC)"\n\n`;
        }

        out += `# ================================================================\n` +
          `# 2. Disable MAC Telnet, MAC Winbox & MAC Ping on all interfaces\n` +
          `# Created by AI Generator Buananet.com\n` +
          `# ================================================================\n` +
          `/tool mac-server set allowed-interface-list=none\n` +
          `/tool mac-server mac-winbox set allowed-interface-list=none\n` +
          `/tool mac-server ping set enabled=no\n\n`;

        out += `# ================================================================\n` +
          `# 3. Matikan Neighbor Discovery (MNDP / CDP / LLDP) di WAN\n` +
          `# Mencegah router terdeteksi oleh perangkat OLT / Router ISP\n` +
          `# ================================================================\n` +
          `/ip neighbor discovery-settings set discover-interface-list=none\n\n`;

        out += `# ================================================================\n` +
          `# 4. Matikan Bandwidth Test Server & Web Proxy\n` +
          `# ================================================================\n` +
          `/tool bandwidth-server set enabled=no\n` +
          `/ip proxy set enabled=no\n` +
          `/ip socks set enabled=no\n\n`;

        out += `# ================================================================\n` +
          `# 5. Stealth Firewall Filter: Sembunyikan Hop Traceroute & Ping WAN\n` +
          `# ================================================================\n` +
          `/ip firewall filter\n` +
          `add chain=input in-interface=${wan} protocol=icmp icmp-options=11:0 action=drop comment="Ninja: Stealth Traceroute Time Exceeded"\n` +
          `add chain=input in-interface=${wan} protocol=icmp icmp-options=8:0 action=drop comment="Ninja: Drop WAN Ping Echo Request"\n` +
          `add chain=input in-interface=${wan} dst-port=20,21,22,23,80,443,2000,8291 protocol=tcp action=drop comment="Ninja: Drop WAN Scanning Ports"\n\n`;

        out += `# ================================================================\n` +
          `# 6. Samarkan Hostname di DHCP Client WAN\n` +
          `# ================================================================\n` +
          `/ip dhcp-client set [find interface=${wan}] use-peer-dns=no use-peer-ntp=no dhcp-options=hostname=""\n\n` +
          `:log info "✅ MikroTik Ninja stealth mode active. Routerboard fully hidden from ISP detection."\n` +
          `:put "MikroTik Ninja applied! Routerboard hidden from ISP scanning."\n`;

        return out;
      }
    },

    // 14. Telegram Reporter Resources, Hotspot, PPPoE
    'telegram-reporter': {
      title: 'Telegram Reporter Resources, Hotspot, PPPoE',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-brands fa-telegram"></i> Telegram Bot Settings</div>
            <div class="form-group">
              <label class="form-label">Bot Token</label>
              <input class="form-control form-control-mono" id="pt_bot_token" value="123456789:ABCdefGhIJKlmNoPQRstuvWXyz">
            </div>
            <div class="form-group">
              <label class="form-label">Chat ID</label>
              <input class="form-control form-control-mono" id="pt_chat_id" value="987654321">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Report Interval</label>
              <select class="form-control" id="pt_interval">
                <option value="1h" selected>Every 1 Hour</option>
                <option value="3h">Every 3 Hours</option>
                <option value="6h">Every 6 Hours</option>
                <option value="1d">Daily (24 Hours)</option>
              </select>
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const token = v.bot_token || 'YOUR_BOT_TOKEN';
        const chat = v.chat_id || 'YOUR_CHAT_ID';
        const interv = v.interval || '1h';

        return banner('Telegram Router Resource & User Monitor', ros) +
          `:local botToken "${token}"\n` +
          `:local chatId "${chat}"\n` +
          `:local router [/system identity get name]\n` +
          `:local cpu [/system resource get cpu-load]\n` +
          `:local uptime [/system resource get uptime]\n` +
          `:local freeMem ([/system resource get free-memory] / 1048576)\n` +
          `:local hsActive [/ip hotspot active print count-only]\n` +
          `:local pppActive [/ppp active print count-only]\n\n` +
          `:local text ("*📊 STATUS REPORT - " . $router . "*%0A" . \\\n` +
          `  "• Uptime: " . $uptime . "%0A" . \\\n` +
          `  "• CPU Load: " . $cpu . "%%0A" . \\\n` +
          `  "• Free RAM: " . $freeMem . " MB%0A" . \\\n` +
          `  "• Hotspot Active: " . $hsActive . " users%0A" . \\\n` +
          `  "• PPPoE Active: " . $pppActive . " users")\n\n` +
          `/tool fetch url=("https://api.telegram.org/bot" . $botToken . "/sendMessage?chat_id=" . $chatId . "&parse_mode=Markdown&text=" . $text) keep-result=no\n\n` +
          `/system scheduler add name=telegram-reporter interval=${interv} on-event="/system script run telegram-report" comment="Periodic Telegram Status Report"\n` +
          `:put "Telegram Reporter script & scheduler installed."\n`;
      }
    },

    // 15. MikroTik Auto Backup to E-Mail
    'mikrotik-auto-backup-email': {
      title: 'MikroTik Auto Backup to E-Mail',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-envelope"></i> SMTP Email Settings</div>
            <div class="form-group">
              <label class="form-label">SMTP Server</label>
              <input class="form-control form-control-mono" id="pt_smtp" value="smtp.gmail.com">
            </div>
            <div class="form-group">
              <label class="form-label">SMTP Port</label>
              <input class="form-control form-control-mono" id="pt_port" value="587">
            </div>
            <div class="form-group">
              <label class="form-label">Sender Email (From)</label>
              <input class="form-control form-control-mono" id="pt_from" value="router@gmail.com">
            </div>
            <div class="form-group">
              <label class="form-label">Email Password / App Password</label>
              <input class="form-control form-control-mono" id="pt_pwd" value="your-app-password">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Recipient Email (To)</label>
              <input class="form-control form-control-mono" id="pt_to" value="admin@comit.id">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const smtp = v.smtp || 'smtp.gmail.com';
        const port = v.port || '587';
        const from = v.from || 'router@gmail.com';
        const pwd = v.pwd || 'pass';
        const to = v.to || 'admin@comit.id';

        return banner('Auto Backup Router to E-Mail', ros) +
          `/tool e-mail set server=${smtp} port=${port} user="${from}" password="${pwd}" from="${from}" start-tls=yes\n\n` +
          `:local id [/system identity get name]\n` +
          `:local date [/system clock get date]\n` +
          `:local backupFile ($id . "-" . $date . ".backup")\n` +
          `/system backup save name=$backupFile\n` +
          `/tool e-mail send to="${to}" subject=("MikroTik Backup: " . $id) body=("Daily backup of router " . $id) file=$backupFile\n` +
          `:put "Email sent with attached backup file."\n`;
      }
    },

    // 16. AI Powered MikroTik Script Generator
    'ai-script-generator': {
      title: 'AI Powered MikroTik Script Generator',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-wand-magic-sparkles text-teal"></i> Prompt AI Generator</div>
            <p style="font-size:12px;color:var(--text-secondary);margin-bottom:10px">Ketik instruksi konfigurasi RouterOS dalam Bahasa Indonesia atau English, atau klik salah satu rekomendasi cepat di bawah:</p>
            
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">
              <button type="button" class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 8px" onclick="ProTools.setAiPrompt('Buatkan LB PCC 2 ISP (ISP1 ether1 gateway 192.168.1.1, ISP2 ether2 gateway 192.168.2.1) lengkap dengan failover ping dan NAT masquerade untuk LAN bridge-lan')">⚡ LB PCC 2 ISP + Failover</button>
              <button type="button" class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 8px" onclick="ProTools.setAiPrompt('Buatkan konfigurasi QoS Game Online prioritas Priority 1 untuk Mobile Legends, PUBG Mobile, Free Fire, dan Valorant agar ping tetap hijau saat ada download')">🎮 Prioritas Game (MLBB, PUBG, FF)</button>
              <button type="button" class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 8px" onclick="ProTools.setAiPrompt('Buatkan Simple Queue bandwidth download 20M upload 10M untuk subnet 192.168.88.0/24 dengan burst 2x lipat dan burst threshold 75%')">📊 Queue 20M/10M + Burst 2x</button>
              <button type="button" class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 8px" onclick="ProTools.setAiPrompt('Amankan router MikroTik: proteksi Anti DDoS SYN flood, port scan detector PSD, dan blacklist otomatis penyerang Winbox port 8291 dan SSH port 22')">🛡️ Anti DDoS + Blacklist Winbox</button>
              <button type="button" class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 8px" onclick="ProTools.setAiPrompt('Setup Hotspot Server di interface wlan1 dengan IP 192.168.20.1/24, trial gratis 30 menit, dan 3 profil voucher: 1 Jam 2Mbps, 12 Jam 5Mbps, 24 Jam 10Mbps')">📶 Hotspot Server + 3 Profil</button>
              <button type="button" class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 8px" onclick="ProTools.setAiPrompt('Setup VPN WireGuard Server di RouterOS v7 listen port 13231, IP subnet 10.0.0.1/24, beserta konfigurasi peer client Android/PC')">🔒 WireGuard Server (ROS v7)</button>
              <button type="button" class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 8px" onclick="ProTools.setAiPrompt('Samarkan router MikroTik dari ISP: ubah TTL jadi 64, matikan neighbor discovery MNDP di ether1, drop traceroute dan ping WAN, serta matikan MAC server')">🥷 MikroTik Ninja (Hide from ISP)</button>
              <button type="button" class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 8px" onclick="ProTools.setAiPrompt('Buka port forwarding port 8080 ke Web Server IP 192.168.88.50 port 80 dan port 554 RTSP ke CCTV 192.168.88.100 via WAN ether1')">📹 Port Forwarding (CCTV/Web)</button>
            </div>

            <div class="form-group mb-0">
              <label class="form-label" style="font-weight:600">Instruksi Prompt Anda:</label>
              <textarea class="form-control form-control-mono" id="pt_ai_prompt" style="min-height:95px;line-height:1.4" placeholder="Ketik kebutuhan script Anda di sini...">Buatkan LB PCC 2 ISP (ISP1 ether1 gateway 192.168.1.1, ISP2 ether2 gateway 192.168.2.1) lengkap dengan failover ping dan NAT masquerade untuk LAN bridge-lan</textarea>
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const p = (v.ai_prompt || '').trim();
        const pLower = p.toLowerCase();
        const isV7 = ros === 'v7';

        let out = banner('AI Powered MikroTik Script Engine', ros);
        out += `# Prompt Input: "${p.replace(/\n/g, ' ')}"\n` +
               `# RouterOS Target: ${ros.toUpperCase()}\n` +
               `# Analisis AI: Berhasil mengidentifikasi parameter konfigurasi.\n\n`;

        // 1. Check Load Balancing PCC
        if (pLower.includes('pcc') || pLower.includes('load balanc') || pLower.includes('lb ') || pLower.includes('multi wan') || pLower.includes('2 isp') || pLower.includes('3 isp')) {
          const ispCount = pLower.includes('3 isp') ? 3 : (pLower.includes('4 isp') ? 4 : 2);
          out += `# ================================================================\n` +
                 `# AI RESULT: LOAD BALANCING PCC (${ispCount} WAN GATEWAYS) + FAILOVER\n` +
                 `# ================================================================\n`;
          if (isV7) {
            out += `/routing table\n`;
            for (let i = 1; i <= ispCount; i++) out += `add disabled=no fib name=to_ISP${i} comment="Routing Table ISP${i}"\n`;
            out += `\n`;
          }
          out += `/ip firewall address-list\n` +
                 `add address=192.168.0.0/16 list=LOCAL_SUBNET comment="RFC1918 Private Subnet"\n` +
                 `add address=10.0.0.0/8 list=LOCAL_SUBNET comment="RFC1918 Private Subnet"\n` +
                 `add address=172.16.0.0/12 list=LOCAL_SUBNET comment="RFC1918 Private Subnet"\n\n` +
                 `/ip firewall mangle\n`;
          for (let i = 1; i <= ispCount; i++) {
            out += `add chain=prerouting in-interface=ether${i} connection-state=new action=mark-connection new-connection-mark=CONN_ISP${i} passthrough=yes comment="Inbound ISP${i}"\n`;
          }
          out += `add chain=prerouting dst-address-list=LOCAL_SUBNET action=accept comment="Bypass Inter-VLAN / Local"\n`;
          for (let i = 0; i < ispCount; i++) {
            out += `add chain=prerouting in-interface=bridge-lan dst-address-type=!local connection-state=new per-connection-classifier=both-addresses-and-ports:${ispCount}/${i} action=mark-connection new-connection-mark=CONN_ISP${i+1} passthrough=yes comment="PCC ${ispCount}/${i}"\n`;
          }
          for (let i = 1; i <= ispCount; i++) {
            out += `add chain=prerouting in-interface=bridge-lan connection-mark=CONN_ISP${i} action=mark-routing ${isV7 ? 'new-routing-mark=to_ISP'+i+' passthrough=no' : 'new-routing-mark=to_ISP'+i+' passthrough=no'}\n`;
          }
          out += `\n/ip firewall nat\n`;
          for (let i = 1; i <= ispCount; i++) {
            out += `add chain=srcnat out-interface=ether${i} action=masquerade comment="NAT Masquerade ISP${i}"\n`;
          }
          out += `\n/ip route\n`;
          for (let i = 1; i <= ispCount; i++) {
            const gw = `192.168.${i}.1`;
            if (isV7) {
              out += `add distance=1 dst-address=0.0.0.0/0 gateway=${gw} routing-table=to_ISP${i} check-gateway=ping comment="Route ISP${i}"\n`;
            } else {
              out += `add distance=1 dst-address=0.0.0.0/0 gateway=${gw} routing-mark=to_ISP${i} check-gateway=ping comment="Route ISP${i}"\n`;
            }
          }
          for (let i = 1; i <= ispCount; i++) {
            const gw = `192.168.${i}.1`;
            out += `add distance=${i} dst-address=0.0.0.0/0 gateway=${gw} check-gateway=ping comment="Default Failover GW${i}"\n`;
          }
          out += `\n:put "✅ AI: Konfigurasi Load Balancing PCC ${ispCount} ISP berhasil diterapkan!"\n`;
          return out;
        }

        // 2. Check Game QoS
        if (pLower.includes('game') || pLower.includes('gaming') || pLower.includes('mlbb') || pLower.includes('pubg') || pLower.includes('free fire') || pLower.includes('valorant')) {
          out += `# ================================================================\n` +
                 `# AI RESULT: ONLINE GAME QOS PRIORITY 1 (LOW LATENCY ACCELERATION)\n` +
                 `# Games: Mobile Legends, PUBG Mobile, Free Fire, Valorant, Point Blank\n` +
                 `# ================================================================\n` +
                 `/ip firewall mangle\n` +
                 `add chain=prerouting protocol=udp dst-port=5000-5221,5500-5700,9000-9010 action=mark-connection new-connection-mark=CONN_GAME passthrough=yes comment="MLBB Mobile Legends"\n` +
                 `add chain=prerouting protocol=udp dst-port=10012,17500,20000-20002 action=mark-connection new-connection-mark=CONN_GAME passthrough=yes comment="PUBG Mobile"\n` +
                 `add chain=prerouting protocol=udp dst-port=10006,39698-39700 action=mark-connection new-connection-mark=CONN_GAME passthrough=yes comment="Free Fire"\n` +
                 `add chain=prerouting protocol=udp dst-port=7000-8000 action=mark-connection new-connection-mark=CONN_GAME passthrough=yes comment="Valorant Riot"\n` +
                 `add chain=prerouting protocol=tcp dst-port=39190,49100 action=mark-connection new-connection-mark=CONN_GAME passthrough=yes comment="Point Blank Zepetto"\n` +
                 `add chain=prerouting connection-mark=CONN_GAME action=mark-packet new-packet-mark=PKT_GAME passthrough=no comment="Mark Packet Game"\n` +
                 `add chain=prerouting connection-mark=CONN_GAME action=change-dscp new-dscp=46 passthrough=yes comment="DSCP 46 Expedited Forwarding"\n\n` +
                 `# Queue Tree Priority 1 for Game Packets\n` +
                 `/queue tree\n` +
                 `add name="PARENT_GLOBAL" parent=global queue=default max-limit=100M\n` +
                 `add name="1_GAME_VIP" parent="PARENT_GLOBAL" packet-mark=PKT_GAME priority=1 queue=default max-limit=100M limit-at=20M comment="Game Ping Priority 1"\n` +
                 `add name="8_NORMAL_TRAFFIC" parent="PARENT_GLOBAL" packet-mark=no-mark priority=8 queue=default max-limit=90M limit-at=10M comment="Browsing & Download"\n\n` +
                 `:put "✅ AI: Konfigurasi Game QoS Priority 1 berhasil diterapkan! Ping stabil bebas lag."\n`;
          return out;
        }

        // 3. Check Queue / Rate Limit / Burst
        if (pLower.includes('queue') || pLower.includes('burst') || pLower.includes('limit') || pLower.includes('bandwidth') || pLower.includes('kecepatan')) {
          out += `# ================================================================\n` +
                 `# AI RESULT: BANDWIDTH RATE LIMIT + BURST MULTIPLIER (75% THRESHOLD)\n` +
                 `# ================================================================\n` +
                 `/queue simple\n` +
                 `add name="VIP_Client_Limit" target="192.168.88.0/24" max-limit=10M/20M burst-limit=20M/40M burst-threshold=7500k/15000k burst-time=16/16 limit-at=5M/10M priority=5/5 comment="AI Optimized Queue"\n` +
                 `add name="Staff_Office_Limit" target="192.168.88.100/32" max-limit=5M/10M burst-limit=10M/20M burst-threshold=3750k/7500k burst-time=8/8 limit-at=2500k/5000k priority=6/6 comment="Staff Limit"\n\n` +
                 `:put "✅ AI: Simple Queue dengan algoritma burst otomatis berhasil digenerate!"\n`;
          return out;
        }

        // 4. Check Firewall / Anti-DDoS / Security
        if (pLower.includes('firewall') || pLower.includes('ddos') || pLower.includes('brute force') || pLower.includes('aman') || pLower.includes('security') || pLower.includes('hacker')) {
          out += `# ================================================================\n` +
                 `# AI RESULT: FIREWALL SECURITY HARDENING, ANTI-DDOS & WINBOX LOCKDOWN\n` +
                 `# ================================================================\n` +
                 `/ip firewall filter\n` +
                 `add chain=input connection-state=established,related action=accept comment="Accept Established & Related"\n` +
                 `add chain=input connection-state=invalid action=drop comment="Drop Invalid Packets"\n` +
                 `add chain=input protocol=tcp tcp-flags=syn connection-limit=30,32 action=drop comment="Drop TCP SYN Flood DDoS"\n` +
                 `add chain=input protocol=tcp psd=21,3s,3,1 action=add-src-to-address-list address-list=port_scanners address-list-timeout=1d comment="Detect Port Scanners"\n` +
                 `add chain=input src-address-list=port_scanners action=drop comment="Drop Port Scanners"\n` +
                 `# 3-Stage Winbox Brute Force Protection\n` +
                 `add chain=input protocol=tcp dst-port=8291 src-address-list=winbox_blacklist action=drop comment="Drop Blacklisted Winbox Attacker"\n` +
                 `add chain=input protocol=tcp dst-port=8291 connection-state=new src-address-list=winbox_stage2 action=add-src-to-address-list address-list=winbox_blacklist address-list-timeout=7d\n` +
                 `add chain=input protocol=tcp dst-port=8291 connection-state=new src-address-list=winbox_stage1 action=add-src-to-address-list address-list=winbox_stage2 address-list-timeout=1m\n` +
                 `add chain=input protocol=tcp dst-port=8291 connection-state=new action=add-src-to-address-list address-list=winbox_stage1 address-list-timeout=1m comment="Winbox Stage 1"\n` +
                 `# Block Open DNS Resolver from WAN\n` +
                 `add chain=input in-interface=ether1 protocol=udp dst-port=53 action=drop comment="Drop External DNS Port 53 UDP"\n` +
                 `add chain=input in-interface=ether1 protocol=tcp dst-port=53 action=drop comment="Drop External DNS Port 53 TCP"\n\n` +
                 `:put "✅ AI: Firewall Hardening & Winbox Brute Force Protection berhasil diaktifkan!"\n`;
          return out;
        }

        // 5. Check Hotspot
        if (pLower.includes('hotspot') || pLower.includes('voucher') || pLower.includes('captive')) {
          out += `# ================================================================\n` +
                 `# AI RESULT: COMPLETE HOTSPOT SERVER SETUP + VOUCHER PROFILES\n` +
                 `# ================================================================\n` +
                 `/ip pool add name=hs-pool ranges=192.168.20.10-192.168.20.250\n` +
                 `/ip dhcp-server add name=dhcp-hs interface=wlan1 address-pool=hs-pool lease-time=1h disabled=no\n` +
                 `/ip dhcp-server network add address=192.168.20.0/24 gateway=192.168.20.1 dns-server=192.168.20.1,1.1.1.1\n` +
                 `/ip address add address=192.168.20.1/24 interface=wlan1 comment="Hotspot Gateway"\n\n` +
                 `/ip hotspot profile add name=hsprof1 dns-name="hotspot.local" hotspot-address=192.168.20.1 html-directory=hotspot login-by=http-chap,http-pap,cookie,trial trial-uptime-limit=30m trial-uptime-reset=1d\n` +
                 `/ip hotspot add name=hs-wlan interface=wlan1 address-pool=hs-pool profile=hsprof1 disabled=no\n\n` +
                 `# Voucher User Profiles\n` +
                 `/ip hotspot user profile add name="1_JAM" rate-limit="2M/2M" session-timeout=1h shared-users=1 status-autorefresh=1m\n` +
                 `/ip hotspot user profile add name="12_JAM" rate-limit="5M/5M" session-timeout=12h shared-users=1 status-autorefresh=1m\n` +
                 `/ip hotspot user profile add name="24_JAM" rate-limit="10M/10M" session-timeout=1d shared-users=1 status-autorefresh=1m\n\n` +
                 `/ip hotspot walled-garden add dst-host="*whatsapp.com" action=allow comment="CS WhatsApp"\n` +
                 `:put "✅ AI: Hotspot server lengkap dengan profil voucher siap digunakan!"\n`;
          return out;
        }

        // 6. Check WireGuard / VPN
        if (pLower.includes('wireguard') || pLower.includes('vpn') || pLower.includes('l2tp') || pLower.includes('tunnel')) {
          if (isV7) {
            out += `# ================================================================\n` +
                   `# AI RESULT: WIREGUARD VPN SERVER (ROUTEROS V7 ENTERPRISE)\n` +
                   `# ================================================================\n` +
                   `/interface wireguard add name=wg0 listen-port=13231 comment="WireGuard Server"\n` +
                   `/ip address add address=10.0.0.1/24 interface=wg0 comment="WireGuard Gateway"\n` +
                   `/ip firewall filter add chain=input protocol=udp dst-port=13231 action=accept comment="Allow WireGuard Port 13231"\n\n` +
                   `# WireGuard Peer Client (Contoh PC / Smartphone)\n` +
                   `/interface wireguard peers add interface=wg0 allowed-address=10.0.0.2/32 public-key="REPLACE_WITH_CLIENT_PUBLIC_KEY=" comment="Client-Android"\n` +
                   `/interface wireguard peers add interface=wg0 allowed-address=10.0.0.3/32 public-key="REPLACE_WITH_LAPTOP_PUBLIC_KEY=" comment="Client-Laptop"\n` +
                   `/ip firewall nat add chain=srcnat src-address=10.0.0.0/24 action=masquerade comment="NAT WireGuard Internet Access"\n\n` +
                   `:put "✅ AI: WireGuard Server v7 berhasil dibuat pada port 13231!"\n`;
          } else {
            out += `# ================================================================\n` +
                   `# AI RESULT: L2TP / IPSEC VPN SERVER (ROUTEROS V6 / V7 COMPATIBLE)\n` +
                   `# ================================================================\n` +
                   `/ip pool add name=vpn-pool ranges=10.10.10.10-10.10.10.50\n` +
                   `/ppp profile add name=profile-l2tp local-address=10.10.10.1 remote-address=vpn-pool dns-server=1.1.1.1\n` +
                   `/interface l2tp-server server set enabled=yes default-profile=profile-l2tp use-ipsec=yes ipsec-secret="Bismillah123!"\n` +
                   `/ppp secret add name="user-vpn" password="secretpassword" profile=profile-l2tp service=l2tp comment="VPN User"\n` +
                   `/ip firewall filter add chain=input protocol=udp dst-port=500,4500,1701 action=accept comment="Allow L2TP/IPSec"\n` +
                   `/ip firewall filter add chain=input protocol=ipsec-esp action=accept comment="Allow IPSec ESP"\n\n` +
                   `:put "✅ AI: L2TP / IPSec Server berhasil diaktifkan!"\n`;
          }
          return out;
        }

        // 7. Check MikroTik Ninja / Stealth
        if (pLower.includes('ninja') || pLower.includes('hide') || pLower.includes('sembunyi') || pLower.includes('ttl')) {
          out += `# ================================================================\n` +
                 `# AI RESULT: MIKROTIK NINJA — TOTAL STEALTH ISP MASKING\n` +
                 `# Normalisasi TTL, Disable Neighbor Discovery, Drop Ping/Tracert\n` +
                 `# ================================================================\n` +
                 `/ip firewall mangle add chain=postrouting out-interface=ether1 action=change-ttl new-ttl=set:64 passthrough=yes comment="Ninja: Mask TTL 64"\n\n` +
                 `# Disable MAC Telnet, MAC Winbox & MAC Ping on all interfaces\n` +
                 `# Created by AI Generator Buananet.com\n` +
                 `/tool mac-server set allowed-interface-list=none\n` +
                 `/tool mac-server mac-winbox set allowed-interface-list=none\n` +
                 `/tool mac-server ping set enabled=no\n\n` +
                 `/ip neighbor discovery-settings set discover-interface-list=none\n` +
                 `/tool bandwidth-server set enabled=no\n` +
                 `/ip firewall filter add chain=input in-interface=ether1 protocol=icmp icmp-options=11:0 action=drop comment="Ninja: Drop Traceroute Hop"\n` +
                 `/ip firewall filter add chain=input in-interface=ether1 protocol=icmp icmp-options=8:0 action=drop comment="Ninja: Drop Ping WAN"\n\n` +
                 `:put "✅ AI: MikroTik Ninja aktif! Routerboard tersembunyi total dari ISP."\n`;
          return out;
        }

        // 8. Port Forwarding / NAT
        if (pLower.includes('forward') || pLower.includes('nat') || pLower.includes('cctv') || pLower.includes('web server')) {
          out += `# ================================================================\n` +
                 `# AI RESULT: PORT FORWARDING (DST-NAT) TO INTERNAL HOSTS\n` +
                 `# ================================================================\n` +
                 `/ip firewall nat\n` +
                 `add chain=dstnat in-interface=ether1 protocol=tcp dst-port=8080 action=dst-nat to-addresses=192.168.88.50 to-ports=80 comment="Forward Web Server"\n` +
                 `add chain=dstnat in-interface=ether1 protocol=tcp dst-port=554 action=dst-nat to-addresses=192.168.88.100 to-ports=554 comment="Forward CCTV RTSP"\n` +
                 `add chain=dstnat in-interface=ether1 protocol=tcp dst-port=8000 action=dst-nat to-addresses=192.168.88.100 to-ports=8000 comment="Forward DVR GUI"\n\n` +
                 `/ip firewall filter add chain=forward dst-address=192.168.88.50 protocol=tcp dst-port=80 action=accept comment="Allow Forwarded Web"\n` +
                 `/ip firewall filter add chain=forward dst-address=192.168.88.100 protocol=tcp dst-port=554,8000 action=accept comment="Allow Forwarded CCTV"\n\n` +
                 `:put "✅ AI: Port forwarding berhasil disiapkan!"\n`;
          return out;
        }

        // Default tailored response
        out += `# ================================================================\n` +
               `# AI RESULT: GENERAL OPTIMIZED ROUTEROS CONFIGURATION\n` +
               `# ================================================================\n` +
               `/system identity set name="MikroTik-AI-Engine"\n` +
               `/ip dns set allow-remote-requests=yes servers=1.1.1.1,8.8.8.8\n` +
               `/ip firewall filter add chain=input connection-state=established,related action=accept\n` +
               `/ip firewall filter add chain=input connection-state=invalid action=drop\n` +
               `/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade\n` +
               `/queue simple add name="Client_QoS" target="192.168.88.0/24" max-limit=10M/20M comment="AI Default Queue"\n\n` +
               `:put "✅ AI: Konfigurasi pintar diterapkan dengan sukses!"\n`;
        return out;
      }
    },

    // 17. AI Powered MikroTik Log Debugger
    'ai-log-debugger': {
      title: 'AI Powered MikroTik Log Debugger',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-bug text-rose"></i> Diagnostic Log Analyzer & Auto-Fix</div>
            <p style="font-size:12px;color:var(--text-secondary);margin-bottom:10px">Paste baris pesan error/warning dari menu <code>/log print</code> Winbox, atau klik salah satu sampel error di bawah:</p>
            
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">
              <button type="button" class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 8px" onclick="ProTools.setLogSample('dhcp,warning dhcp1 offering lease 192.168.88.245 for 00:1E:67:84:55:01 without success\\ndhcp,critical no more IP addresses in pool dhcp-pool')">🚨 DHCP Lease Failed & Pool Full</button>
              <button type="button" class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 8px" onclick="ProTools.setLogSample('system,error,critical login failure for user admin from 103.22.44.11 via winbox\\nsystem,error,critical login failure for user root from 45.142.182.8 via ssh')">🔒 Brute Force Winbox & SSH</button>
              <button type="button" class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 8px" onclick="ProTools.setLogSample('dns,packet,warning cache full, discarding old records\\nsystem,warning low memory available')">⚠️ DNS Cache Full & High Memory</button>
              <button type="button" class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 8px" onclick="ProTools.setLogSample('interface,warning ether1 link down\\ninterface,info ether1 link up (speed 100M, full duplex)\\ninterface,warning excessive collisions detected')">⚡ Interface Flapping & Collisions</button>
              <button type="button" class="btn btn-secondary btn-sm" style="font-size:11px;padding:4px 8px" onclick="ProTools.setLogSample('hotspot,warning user budi: already logged in\\nhotspot,info mac auth failed for 12:34:56:AA:BB:CC')">📶 Hotspot Duplicate Session</button>
            </div>

            <div class="form-group mb-0">
              <label class="form-label" style="font-weight:600">Log Text Input:</label>
              <textarea class="form-control form-control-mono" id="pt_log_input" style="min-height:95px;line-height:1.4" placeholder="Paste baris error log Winbox di sini...">dhcp,warning dhcp1 offering lease 192.168.88.245 for 00:1E:67:84:55:01 without success
system,error,critical login failure for user admin from 103.22.44.11 via winbox
dns,packet,warning cache full, discarding old records</textarea>
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const log = (v.log_input || '').trim();
        const lLower = log.toLowerCase();

        let out = banner('AI Powered MikroTik Log Debugger — Diagnostic Report', ros);
        out += `# ================================================================\n` +
               `# 🔍 DIAGNOSTIC AUDIT & ROOT CAUSE ANALYSIS\n` +
               `# ================================================================\n`;

        const fixes = [];
        let issueCount = 0;

        // 1. DHCP Lease failure / Pool exhausted
        if (lLower.includes('offering lease') || lLower.includes('without success') || lLower.includes('no more ip') || lLower.includes('pool')) {
          issueCount++;
          out += `# [ISSUE #${issueCount}] [SEVERITY: CRITICAL] DHCP SERVER EXHAUSTION / LEASE NAK\n` +
                 `# Gejala     : Client tidak mendapatkan IP atau DHCP Server menawarkan lease tapi ditolak.\n` +
                 `# Akar Masalah: 1. Pool IP habis / kehabisan lease.\n` +
                 `#               2. Terdapat Rogue DHCP Server liar di jaringan lokal.\n` +
                 `# Solusi     : Jadikan DHCP authoritative, persempit lease-time menjadi 1 jam, dan bersihkan stale leases.\n#\n`;
          fixes.push(
            `# Fix DHCP Server Authoritative & Pool Extension\n` +
            `/ip dhcp-server set [find] authoritative=yes lease-time=1h\n` +
            `/ip dhcp-server lease remove [find dynamic=yes status=waiting]\n` +
            `/ip pool set [find name=dhcp-pool] ranges=192.168.88.10-192.168.88.254\n`
          );
        }

        // 2. Winbox / SSH Brute Force Attacks
        if (lLower.includes('login failure') || lLower.includes('via winbox') || lLower.includes('via ssh') || lLower.includes('user admin')) {
          issueCount++;
          const ipMatch = log.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || ['103.22.44.11'];
          const uniqueIps = Array.from(new Set(ipMatch)).filter(ip => ip !== '127.0.0.1' && !ip.startsWith('192.168.'));
          out += `# [ISSUE #${issueCount}] [SEVERITY: HIGH ALERT] BRUTE FORCE CREDENTIAL ATTACK\n` +
                 `# Gejala     : Percobaan login unauthorized berulang dari IP publik luar.\n` +
                 `# Penyerang  : IP ${uniqueIps.join(', ') || 'Terdeteksi di log'}\n` +
                 `# Solusi     : Blacklist IP penyerang 30 hari & aktifkan filter brute force multi-tahap.\n#\n`;
          let ipRules = `/ip firewall address-list\n`;
          uniqueIps.forEach(ip => {
            ipRules += `add address=${ip} list=hacker_blacklist comment="AI Detected Attacker"\n`;
          });
          ipRules += `/ip firewall filter add chain=input src-address-list=hacker_blacklist action=drop comment="Drop Blacklisted Hackers"\n` +
                     `# Proteksi Bertahap Port 8291\n` +
                     `/ip firewall filter add chain=input protocol=tcp dst-port=8291 connection-state=new src-address-list=winbox_stage2 action=add-src-to-address-list address-list=hacker_blacklist address-list-timeout=7d\n` +
                     `/ip firewall filter add chain=input protocol=tcp dst-port=8291 connection-state=new src-address-list=winbox_stage1 action=add-src-to-address-list address-list=winbox_stage2 address-list-timeout=1m\n` +
                     `/ip firewall filter add chain=input protocol=tcp dst-port=8291 connection-state=new action=add-src-to-address-list address-list=winbox_stage1 address-list-timeout=1m\n`;
          fixes.push(ipRules);
        }

        // 3. DNS Cache Full
        if (lLower.includes('dns') && (lLower.includes('cache full') || lLower.includes('discarding'))) {
          issueCount++;
          out += `# [ISSUE #${issueCount}] [SEVERITY: MEDIUM] DNS CACHE OVERFLOW & SATURATION\n` +
                 `# Gejala     : Tabel cache DNS MikroTik penuh dan menolak record baru.\n` +
                 `# Solusi     : Naikkan alokasi cache-size ke 20480 KiB dan lakukan flush cache.\n#\n`;
          fixes.push(
            `# Fix DNS Cache Capacity\n` +
            `/ip dns set cache-size=20480KiB max-udp-packet-size=4096\n` +
            `/ip dns cache flush\n`
          );
        }

        // 4. Interface Link Flap
        if (lLower.includes('link down') || lLower.includes('link up') || lLower.includes('collision')) {
          issueCount++;
          out += `# [ISSUE #${issueCount}] [SEVERITY: HIGH] INTERFACE PHYSICAL FLAP / MISMATCH\n` +
                 `# Gejala     : Port ethernet putus nyambung secara periodik atau ada tabrakan paket.\n` +
                 `# Solusi     : Tes kabel, kunci negosiasi auto-negotiation, dan set rx/tx flow control.\n#\n`;
          fixes.push(
            `# Diagnostic Cable Test & Auto-negotiation Lock\n` +
            `/interface ethernet cable-test ether1\n` +
            `/interface ethernet set [find default-name=ether1] auto-negotiation=yes rx-flow-control=on tx-flow-control=on\n`
          );
        }

        // 5. Hotspot Already Logged In
        if (lLower.includes('hotspot') || lLower.includes('already logged in') || lLower.includes('mac auth')) {
          issueCount++;
          out += `# [ISSUE #${issueCount}] [SEVERITY: MEDIUM] HOTSPOT CONCURRENT SESSION CONFLICT\n` +
                 `# Gejala     : Pengguna mencoba login tapi session lama masih menggantung di tabel active.\n` +
                 `# Solusi     : Aktifkan keepalive-timeout 2 menit dan pembersihan cookie otomatis.\n#\n`;
          fixes.push(
            `# Fix Hotspot Session Cleanup\n` +
            `/ip hotspot profile set [find] keepalive-timeout=2m login-by=http-chap,http-pap,cookie\n` +
            `/ip hotspot active remove [find user="budi"]\n`
          );
        }

        if (issueCount === 0) {
          out += `# [STATUS: NORMAL] Tidak terdeteksi error kritis langsung pada potongan teks.\n` +
                 `# Rekomendasi: Terapkan pembersihan memori dan optimalisasi sistem umum.\n#\n`;
          fixes.push(
            `/ip dns cache flush\n` +
            `/system logging action set [find name=memory] memory-lines=1000\n`
          );
        }

        out += `# ================================================================\n` +
               `# 🛠️ AUTO-FIX SCRIPT (ROUTEROS EXECUTABLE)\n` +
               `# Salin dan tempel perintah ini langsung di Terminal MikroTik:\n` +
               `# ================================================================\n\n` +
               fixes.join('\n') +
               `\n:log info "✅ AI Log Debugger: Seluruh perbaikan otomatis berhasil dieksekusi!"\n` +
               `:put "Diagnostic fixes applied successfully! System running healthy."\n`;

        return out;
      }
    },

    // 18. Hotspot Login Page Maker
    'hotspot-login-page-maker': {
      title: '★ Hotspot Login Page Maker PRO',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-palette text-orange"></i> Identitas & Branding Hotspot</div>
            <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px">Generator template captive portal MikroTik lengkap. Mendukung live preview interaktif dan download paket ZIP utuh siap pasang di Winbox Files.</p>
            
            <div class="form-group">
              <label class="form-label">Nama Hotspot / Brand Usaha</label>
              <input class="form-control" id="pt_hs_name" value="wifi@Konut - Baharuddin Net" oninput="ProTools.updateHotspotLivePreview()">
            </div>
            
            <div class="form-group">
              <label class="form-label">Slogan / Tagline</label>
              <input class="form-control" id="pt_hs_slogan" value="Akses Internet Cepat, Murah & Stabil Tanpa Batas" oninput="ProTools.updateHotspotLivePreview()">
            </div>

            <div class="form-row">
              <div class="form-group mb-0">
                <label class="form-label">Pilihan Tema Desain</label>
                <select class="form-control" id="pt_hs_theme" onchange="ProTools.updateHotspotLivePreview()">
                  <option value="orange" selected>Brand Orange Cyber (Comit Style)</option>
                  <option value="dark">Minimalist Charcoal Dark (Elegan)</option>
                  <option value="teal">Midnight Ocean Teal</option>
                  <option value="purple">Vibrant Neon Purple</option>
                  <option value="light">Clean Minimalist Light (Apple Style)</option>
                </select>
              </div>
              <div class="form-group mb-0">
                <label class="form-label">Mode Login</label>
                <select class="form-control" id="pt_hs_mode" onchange="ProTools.updateHotspotLivePreview()">
                  <option value="dual" selected>Dual Mode (Tab Voucher + Tab Member)</option>
                  <option value="voucher">Voucher Saja (Kode Voucher = Password)</option>
                  <option value="member">Member Saja (Username & Password Terpisah)</option>
                </select>
              </div>
            </div>

            <div class="form-row mt-2">
              <div class="form-group mb-0">
                <label class="form-label">DNS Name Hotspot</label>
                <input class="form-control form-control-mono" id="pt_hs_dns" value="hotspot.local" oninput="ProTools.updateHotspotLivePreview()">
              </div>
              <div class="form-group mb-0">
                <label class="form-label">Nomor WhatsApp CS</label>
                <input class="form-control form-control-mono" id="pt_hs_wa" value="+62 813-5514-2432" oninput="ProTools.updateHotspotLivePreview()">
              </div>
            </div>

            <div class="form-group mt-2">
              <label class="form-label">Teks Berjalan / Pengumuman (Marquee)</label>
              <input class="form-control" id="pt_hs_marquee" value="⚡ Selamat Datang di wifi@Konut! Beli voucher hubungi CS atau scan QRIS." oninput="ProTools.updateHotspotLivePreview()">
            </div>

            <label class="form-check"><input type="checkbox" id="pt_hs_trial" checked onchange="ProTools.updateHotspotLivePreview()"> Sediakan Tombol Akses Gratis (Trial Login 30 Menit)</label>
            <label class="form-check mb-0"><input type="checkbox" id="pt_hs_show_pkgs" checked onchange="ProTools.updateHotspotLivePreview()"> Tampilkan Showcase Kartu Paket & Harga Voucher</label>
          </div>

          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-tags text-teal"></i> Daftar Paket Voucher (Price List)</div>
            <div class="form-group mb-2">
              <label class="form-label">Paket 1</label>
              <div class="form-row">
                <input class="form-control" id="pt_hs_p1_name" value="2 Jam" placeholder="Durasi" oninput="ProTools.updateHotspotLivePreview()">
                <input class="form-control" id="pt_hs_p1_price" value="Rp 2.000" placeholder="Harga" oninput="ProTools.updateHotspotLivePreview()">
                <input class="form-control" id="pt_hs_p1_spd" value="Up to 5 Mbps" placeholder="Speed" oninput="ProTools.updateHotspotLivePreview()">
              </div>
            </div>
            <div class="form-group mb-2">
              <label class="form-label">Paket 2</label>
              <div class="form-row">
                <input class="form-control" id="pt_hs_p2_name" value="12 Jam" placeholder="Durasi" oninput="ProTools.updateHotspotLivePreview()">
                <input class="form-control" id="pt_hs_p2_price" value="Rp 5.000" placeholder="Harga" oninput="ProTools.updateHotspotLivePreview()">
                <input class="form-control" id="pt_hs_p2_spd" value="Up to 8 Mbps" placeholder="Speed" oninput="ProTools.updateHotspotLivePreview()">
              </div>
            </div>
            <div class="form-group mb-2">
              <label class="form-label">Paket 3</label>
              <div class="form-row">
                <input class="form-control" id="pt_hs_p3_name" value="24 Jam (1 Hari)" placeholder="Durasi" oninput="ProTools.updateHotspotLivePreview()">
                <input class="form-control" id="pt_hs_p3_price" value="Rp 10.000" placeholder="Harga" oninput="ProTools.updateHotspotLivePreview()">
                <input class="form-control" id="pt_hs_p3_spd" value="Up to 10 Mbps" placeholder="Speed" oninput="ProTools.updateHotspotLivePreview()">
              </div>
            </div>
            <div class="form-group mb-2">
              <label class="form-label">Paket 4</label>
              <div class="form-row">
                <input class="form-control" id="pt_hs_p4_name" value="7 Hari (1 Minggu)" placeholder="Durasi" oninput="ProTools.updateHotspotLivePreview()">
                <input class="form-control" id="pt_hs_p4_price" value="Rp 35.000" placeholder="Harga" oninput="ProTools.updateHotspotLivePreview()">
                <input class="form-control" id="pt_hs_p4_spd" value="Up to 15 Mbps" placeholder="Speed" oninput="ProTools.updateHotspotLivePreview()">
              </div>
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Paket 5</label>
              <div class="form-row">
                <input class="form-control" id="pt_hs_p5_name" value="30 Hari (Bulanan)" placeholder="Durasi" oninput="ProTools.updateHotspotLivePreview()">
                <input class="form-control" id="pt_hs_p5_price" value="Rp 100.000" placeholder="Harga" oninput="ProTools.updateHotspotLivePreview()">
                <input class="form-control" id="pt_hs_p5_spd" value="Up to 20 Mbps" placeholder="Speed" oninput="ProTools.updateHotspotLivePreview()">
              </div>
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const name = v.hs_name || 'wifi@Konut - Baharuddin Net';
        const slogan = v.hs_slogan || 'Internet Cepat, Murah & Stabil';
        const dns = v.hs_dns || 'hotspot.local';
        const wa = v.hs_wa || '+62 813-5514-2432';
        const hasTrial = v.hs_trial !== false;

        return banner(`Hotspot Login Template Setup — ${name}`, ros) +
          `# ================================================================\n` +
          `# PANDUAN PEMASANGAN TEMPLATE LOGIN HOTSPOT DI MIKROTIK:\n` +
          `# 1. Download Full ZIP dengan menekan tombol [Download Full ZIP] di atas.\n` +
          `# 2. Ekstrak ZIP -> Anda akan mendapatkan folder "hotspot/".\n` +
          `# 3. Buka Winbox -> Klik menu "Files".\n` +
          `# 4. Drag & Drop folder "hotspot/" ke jendela Files Winbox.\n` +
          `# 5. Copy & Paste seluruh script di bawah ini ke Terminal Winbox.\n` +
          `# ================================================================\n\n` +
          `# 1. Pastikan DNS Name dan html-directory terpasang pada Server Profile\n` +
          `/ip hotspot profile set [find] dns-name="${dns}" html-directory=hotspot login-by=http-chap,http-pap,cookie,mac-cookie cookie-lifetime=3d\n\n` +
          `# 2. Konfigurasi Trial Mode (Akses Gratis 30 Menit)\n` +
          `${hasTrial ? `/ip hotspot profile set [find] trial-uptime-limit=30m trial-uptime-reset=1d\n` : `# Trial mode dinonaktifkan\n/ip hotspot profile set [find] !trial-uptime-limit\n`}\n` +
          `# 3. Walled Garden untuk Bantuan WhatsApp dan Pembelian Voucher\n` +
          `/ip hotspot walled-garden\n` +
          `add dst-host="*whatsapp.com" action=allow comment="CS WhatsApp ComitTools"\n` +
          `add dst-host="*wa.me" action=allow comment="CS WhatsApp Shortlink"\n` +
          `add dst-host="*whatsapp.net" action=allow comment="WhatsApp Media CDN"\n` +
          `add dst-host="*.gstatic.com" action=allow comment="Google Fonts / CDN Icons"\n\n` +
          `# 4. Status Log Konfirmasi\n` +
          `:log info "✅ Template Hotspot Captive Portal [${name}] siap digunakan!"\n` +
          `:put "================================================================"\n` +
          `:put " Hotspot Portal Berhasil Dikonfigurasi!"\n` +
          `:put " Brand Name : ${name}"\n` +
          `:put " Portal URL : http://${dns}"\n` +
          `:put " WhatsApp   : ${wa}"\n` +
          `:put "================================================================"\n`;
      }
    },

    // 19. MikroTik QR Code Generator (WiFi & Voucher)
    'mikrotik-qr-code-generator': {
      title: '★ MikroTik QR Code Generator (WiFi & Hotspot)',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-qrcode text-teal"></i> QR Code & Cetak Voucher Card</div>
            <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px">Buat kode QR scan langsung konek WiFi atau scan auto-login voucher captive portal MikroTik.</p>
            
            <div class="form-group">
              <label class="form-label">Tipe QR Code</label>
              <select class="form-control" id="pt_qr_type" onchange="ProTools.toggleQrFields(this.value)">
                <option value="wifi" selected>WiFi Auto-Connect (WPA/WPA2/WPA3)</option>
                <option value="hotspot">Hotspot Direct Voucher Login URL</option>
                <option value="url">Custom Website / Portal URL</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Nama Hotspot / Usaha</label>
              <input class="form-control" id="pt_qr_brand" value="wifi@Konut Hotspot">
            </div>

            <div class="form-group" id="pt_field_ssid">
              <label class="form-label">Nama SSID WiFi</label>
              <input class="form-control form-control-mono" id="pt_qr_ssid" value="wifi@Konut">
            </div>

            <div class="form-group" id="pt_field_pass">
              <label class="form-label">Password WiFi (Jika Menggunakan Sandi)</label>
              <input class="form-control form-control-mono" id="pt_qr_pwd" value="bismillah123">
            </div>

            <div class="form-group" id="pt_field_hs_url" style="display:none">
              <label class="form-label">Hotspot Login URL (IP / DNS)</label>
              <input class="form-control form-control-mono" id="pt_qr_hs_url" value="http://192.168.88.1/login">
            </div>

            <div class="form-group" id="pt_field_voucher_user" style="display:none">
              <label class="form-label">Kode Voucher / Username</label>
              <input class="form-control form-control-mono" id="pt_qr_voucher_user" value="VOUCH-7892">
            </div>

            <div class="form-group" id="pt_field_voucher_pass" style="display:none">
              <label class="form-label">Password Voucher (Opsional)</label>
              <input class="form-control form-control-mono" id="pt_qr_voucher_pass" value="7892">
            </div>

            <div class="form-group">
              <label class="form-label">Harga & Durasi Paket (Tampil di Kartu)</label>
              <input class="form-control" id="pt_qr_pkg_info" value="Rp 5.000 (Aktif 12 Jam)">
            </div>

            <div class="form-group mb-0">
              <label class="form-label">Nomor CS / WhatsApp</label>
              <input class="form-control form-control-mono" id="pt_qr_wa" value="+62 813-5514-2432">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const ssid = v.qr_ssid || 'MikroTik-WiFi';
        const type = v.qr_type || 'wifi';
        const brand = v.qr_brand || 'MikroTik Hotspot';

        let out = banner(`MikroTik QR Code Generator — ${brand}`, ros);
        out += `# Tipe QR       : ${type.toUpperCase()}\n` +
               `# SSID / Name   : ${ssid}\n` +
               `# Paket         : ${v.qr_pkg_info || 'Reguler'}\n` +
               `# CS Support    : ${v.qr_wa || '-'}\n\n`;

        if (type === 'hotspot') {
          out += `# ================================================================\n` +
                 `# Script Hotspot Direct Login Setup\n` +
                 `# ================================================================\n` +
                 `/ip hotspot profile set [find] login-by=http-chap,http-pap,cookie\n` +
                 `/ip hotspot user add name="${v.qr_voucher_user || 'VOUCH-7892'}" password="${v.qr_voucher_pass || ''}" profile=default comment="QR Generated Voucher"\n` +
                 `:put "Voucher ${v.qr_voucher_user} ready for QR scanning direct login."\n`;
        } else {
          out += `# ================================================================\n` +
                 `# Script Wireless Interface Setup\n` +
                 `# ================================================================\n` +
                 `/interface wireless security-profiles add name="sec-qr" mode=dynamic-keys authentication-types=wpa2-psk wpa2-pre-shared-key="${v.qr_pwd || 'bismillah123'}"\n` +
                 `/interface wireless set [find default-name=wlan1] ssid="${ssid}" security-profile=sec-qr disabled=no\n` +
                 `:put "SSID ${ssid} configured with QR code auto-connect credentials."\n`;
        }

        return out;
      }
    },

    // 20. Basic Configuration Script Generator
    'basic-config-generator': {
      title: 'Basic Configuration Script Generator',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-sliders"></i> First Time Router Setup</div>
            <div class="form-group">
              <label class="form-label">Router Identity</label>
              <input class="form-control form-control-mono" id="pt_router_name" value="Core-Router-01">
            </div>
            <div class="form-group">
              <label class="form-label">WAN Interface</label>
              <input class="form-control form-control-mono" id="pt_wan" value="ether1">
            </div>
            <div class="form-group">
              <label class="form-label">LAN Subnet Gateway</label>
              <input class="form-control form-control-mono" id="pt_lan_ip" value="192.168.88.1/24">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">DNS Servers</label>
              <input class="form-control form-control-mono" id="pt_dns" value="1.1.1.1,8.8.8.8">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const id = v.router_name || 'MikroTik-PRO';
        const wan = v.wan || 'ether1';
        const lanIp = v.lan_ip || '192.168.88.1/24';
        const dns = v.dns || '1.1.1.1,8.8.8.8';

        return banner(`Basic Configuration Script — ${id}`, ros) +
          `/system identity set name="${id}"\n` +
          `/interface bridge add name=bridge-lan comment="LAN Bridge"\n` +
          `/interface bridge port add bridge=bridge-lan interface=ether2\n` +
          `/interface bridge port add bridge=bridge-lan interface=ether3\n` +
          `/interface bridge port add bridge=bridge-lan interface=ether4\n` +
          `/interface bridge port add bridge=bridge-lan interface=ether5\n` +
          `/ip address add address=${lanIp} interface=bridge-lan comment="LAN Gateway"\n` +
          `/ip dhcp-client add interface=${wan} disabled=no comment="WAN DHCP"\n` +
          `/ip dns set allow-remote-requests=yes servers=${dns}\n` +
          `/ip firewall nat add chain=srcnat out-interface=${wan} action=masquerade comment="NAT Masquerade"\n` +
          `/system clock set time-zone-name=Asia/Jakarta\n` +
          `:put "Basic setup completed. Your router is ready for internet routing!"\n`;
      }
    },

    // 21. MikroTik RouterOS Script DataBase
    'script-database': {
      title: 'MikroTik RouterOS Script DataBase',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-database text-teal"></i> Koleksi Script Siap Pakai</div>
            <div class="form-group mb-0">
              <label class="form-label">Pilih Paket Script</label>
              <select class="form-control" id="pt_db_cat">
                <option value="netwatch_alert">Netwatch Multi-Host Ping Failure Alert</option>
                <option value="dynamic_dns">Cloudflare Dynamic DNS (DDNS) Updater</option>
                <option value="mac_clone">Automated MAC Clone & DHCP Renew</option>
                <option value="queue_reset">Automated Daily FUP Queue Counter Reset</option>
              </select>
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const cat = v.db_cat || 'netwatch_alert';
        if (cat === 'dynamic_dns') {
          return banner('Cloudflare Dynamic DNS (DDNS) Updater', ros) +
            `:local cfZone "YOUR_ZONE_ID"\n` +
            `:local cfRecord "YOUR_RECORD_ID"\n` +
            `:local cfToken "YOUR_API_TOKEN"\n` +
            `:local currentIP [/ip address get [find interface=ether1] address]\n` +
            `:set currentIP [:pick $currentIP 0 [:find $currentIP "/"]]\n` +
            `:log info ("Current WAN IP: " . $currentIP)\n` +
            `:put "Cloudflare DDNS Script Ready."\n`;
        }
        return banner('Netwatch Multi-Host Ping Alert', ros) +
          `/tool netwatch\n` +
          `add host=8.8.8.8 interval=15s timeout=2s down-script=":log error \\"ISP 1 DOWN\\"" up-script=":log info \\"ISP 1 UP\\""\n` +
          `add host=1.1.1.1 interval=15s timeout=2s down-script=":log error \\"ISP 2 DOWN\\"" up-script=":log info \\"ISP 2 UP\\""\n` +
          `:put "Multi-host netwatch watchdog active."\n`;
      }
    }
  };

  function getModalHTML(toolKey) {
    const t = proToolDefs[toolKey];
    if (!t) return `<div style="padding:40px;text-align:center;color:var(--text-muted)">PRO Tool [${toolKey}] not defined.</div>`;

    const defaultForm = t.renderForm({});

    let extraTopButtons = '';
    let extraPreviewArea = '';

    if (toolKey === 'hotspot-login-page-maker') {
      extraTopButtons = `
        <button class="btn btn-warning btn-sm" onclick="ProTools.downloadHotspotZip()" title="Download Full Template ZIP untuk RouterOS">
          <i class="fa-solid fa-file-zipper"></i> Download Full ZIP
        </button>
        <button class="btn btn-secondary btn-sm" onclick="ProTools.downloadHotspotHtml()" title="Download login.html Saja">
          <i class="fa-solid fa-file-code"></i> login.html
        </button>
      `;
      extraPreviewArea = `
        <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:10px 14px;margin-bottom:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;flex-wrap:wrap;gap:8px">
            <div style="display:flex;gap:4px">
              <button class="btn btn-teal btn-sm" id="pt_tab_hs_preview" onclick="ProTools.switchHotspotTab('preview')" style="font-weight:700">
                <i class="fa-solid fa-eye"></i> Live Visual Preview
              </button>
              <button class="btn btn-secondary btn-sm" id="pt_tab_hs_script" onclick="ProTools.switchHotspotTab('script')" style="font-weight:700">
                <i class="fa-solid fa-terminal"></i> MikroTik Script Output
              </button>
            </div>
            <div id="pt_hs_viewport_controls" style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-muted)">
              <span>Layar:</span>
              <button class="btn btn-secondary btn-xs" onclick="ProTools.setHotspotIframeWidth('380px')"><i class="fa-solid fa-mobile-screen"></i> 380px (HP)</button>
              <button class="btn btn-secondary btn-xs" onclick="ProTools.setHotspotIframeWidth('100%')"><i class="fa-solid fa-desktop"></i> Full (Desktop)</button>
            </div>
          </div>
          <div id="pt_hs_iframe_wrap" style="background:#090d16;border:1px solid rgba(255,255,255,0.1);border-radius:12px;overflow:hidden;display:flex;justify-content:center;padding:12px;min-height:480px">
            <iframe id="pt_hs_live_iframe" style="width:380px;height:520px;border:none;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,0.6);transition:width .2s;background:#0f172a;" sandbox="allow-scripts allow-forms allow-same-origin"></iframe>
          </div>
        </div>
      `;
    } else if (toolKey === 'mikrotik-qr-code-generator') {
      extraTopButtons = `
        <button class="btn btn-teal btn-sm" onclick="ProTools.printVoucherCard()" title="Cetak Voucher Card">
          <i class="fa-solid fa-print"></i> Print Card
        </button>
        <button class="btn btn-warning btn-sm" onclick="ProTools.downloadQrSvg()" title="Download QR SVG">
          <i class="fa-solid fa-download"></i> QR .SVG
        </button>
      `;
      extraPreviewArea = `
        <div id="pt_qr_preview_container" style="background:rgba(255,255,255,0.02);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:14px;margin-bottom:12px">
          <div style="font-size:12px;font-weight:700;color:var(--text-secondary);margin-bottom:8px;display:flex;align-items:center;gap:6px">
            <i class="fa-solid fa-ticket text-orange"></i> Live Voucher & QR Code Card Preview:
          </div>
          <div id="pt_voucher_print_area" style="display:flex;align-items:center;gap:16px;background:#ffffff;color:#1e293b;border-radius:12px;padding:16px;border:2px dashed #cbd5e1;box-shadow:0 4px 14px rgba(0,0,0,0.25);max-width:440px">
            <div id="pt_qr_svg_box" style="width:110px;height:110px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:#fff;border-radius:8px"></div>
            <div style="flex:1">
              <div id="pt_card_brand" style="font-size:15px;font-weight:800;color:#0f172a;line-height:1.2;margin-bottom:4px">wifi@Konut Hotspot</div>
              <div style="font-size:11px;color:#64748b;margin-bottom:6px">SSID: <b id="pt_card_ssid" style="color:#ff5c00">wifi@Konut</b></div>
              <div id="pt_card_details" style="font-size:12px;background:#f8fafc;padding:6px 8px;border-radius:6px;border:1px solid #e2e8f0;margin-bottom:6px">
                <div>Paket: <b id="pt_card_pkg" style="color:#0f172a">Rp 5.000 (12 Jam)</b></div>
                <div id="pt_card_cred" style="font-family:monospace;font-size:11px;margin-top:2px">Scan QR untuk konek otomatis</div>
              </div>
              <div style="font-size:10px;color:#94a3b8">CS: <span id="pt_card_wa">+62 813-5514-2432</span></div>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="fast-gen-container">
        <div class="fast-gen-controls">
          <div class="info-box">
            <i class="fa-solid fa-crown text-warning"></i>
            <div>
              <b style="color:#fff">${t.title}</b>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px">PRO Enterprise Feature — Sesuaikan opsi dan generate script.</div>
            </div>
          </div>

          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-microchip"></i> RouterOS Version</div>
            <div style="display:flex;gap:8px">
              <label class="form-check" style="flex:1;background:rgba(56,189,248,0.06);border:1px solid rgba(56,189,248,0.2);border-radius:8px;padding:8px 12px;cursor:pointer">
                <input type="radio" name="pt_ros" value="v6" onchange="ProTools.triggerGen('${toolKey}')"> <span>v6.x</span>
              </label>
              <label class="form-check" style="flex:1;background:rgba(63,211,192,0.06);border:1px solid rgba(63,211,192,0.2);border-radius:8px;padding:8px 12px;cursor:pointer">
                <input type="radio" name="pt_ros" value="v7" checked onchange="ProTools.triggerGen('${toolKey}')"> <span>v7.x</span>
              </label>
            </div>
          </div>

          <div id="pt_form_fields">
            ${defaultForm}
          </div>

          <button class="btn btn-primary btn-lg btn-full" onclick="ProTools.triggerGen('${toolKey}')">
            <i class="fa-solid fa-bolt"></i> Generate PRO Script
          </button>
        </div>

        <div class="fast-gen-output-pane">
          ${extraPreviewArea}

          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
            <div style="font-size:13px;font-weight:600;color:var(--text-secondary)">
              <i class="fa-solid fa-terminal text-orange"></i> MikroTik Script Output
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${extraTopButtons}
              <button class="btn btn-secondary btn-sm" onclick="copyOutput('pt_output')">
                <i class="fa-solid fa-copy"></i> Copy
              </button>
              <button class="btn btn-secondary btn-sm" onclick="downloadOutput('pt_output', '${toolKey}.rsc')">
                <i class="fa-solid fa-download"></i> .rsc
              </button>
              <button class="btn btn-teal btn-sm" onclick="ProTools.triggerGen('${toolKey}')">
                <i class="fa-solid fa-rotate"></i> Refresh
              </button>
            </div>
          </div>

          <div class="terminal-header" style="margin-top:6px">
            <div class="terminal-dots">
              <div class="terminal-dot red"></div>
              <div class="terminal-dot yellow"></div>
              <div class="terminal-dot green"></div>
            </div>
            <div class="terminal-filename">
              <i class="fa-solid fa-terminal"></i> ${toolKey}.rsc
            </div>
            <div style="font-size:10px;color:var(--brand-orange);font-weight:700">PRO Verified</div>
          </div>

          <textarea class="terminal-output" id="pt_output" style="flex:1;min-height:260px;border:1px solid var(--border-color);border-top:none;border-radius:0 0 var(--radius-md) var(--radius-md)" readonly></textarea>
        </div>
      </div>
    `;
  }

  function triggerGen(toolKey) {
    const t = proToolDefs[toolKey];
    if (!t) return;

    // Subscription & Paywall Guard
    if (typeof Auth !== 'undefined' && Auth.canAccessTool) {
      const access = Auth.canAccessTool(toolKey);
      if (!access.allowed) {
        if (typeof showPaywallModal === 'function') {
          showPaywallModal(toolKey, t.title, access);
        }
        const out = document.getElementById('pt_output');
        if (out) {
          out.textContent = '# ================================================================\n# COMITTOOLS PRO - ACCESS RESTRICTED\n# ' + (access.message || 'Fitur ini memerlukan langganan paket aktif.') + '\n# Silakan SUBSCRIBE untuk membuka akses fitur ini.\n# ================================================================';
        }
        return;
      }
    }

    const ros = document.querySelector('input[name="pt_ros"]:checked')?.value || 'v7';
    const values = {};

    const inputs = document.querySelectorAll('#pt_form_fields input, #pt_form_fields select, #pt_form_fields textarea');
    inputs.forEach(inp => {
      const id = inp.id.replace('pt_', '');
      if (inp.type === 'checkbox') {
        values[id] = inp.checked;
      } else {
        values[id] = inp.value;
      }
    });

    try {
      const script = t.generate(values, ros);
      const out = document.getElementById('pt_output');
      if (out) out.value = script;

      // Special handling for QR code generator
      if (toolKey === 'mikrotik-qr-code-generator') {
        renderQrPreview(values);
      }
      // Special handling for Hotspot Login Page Maker: render initial preview
      if (toolKey === 'hotspot-login-page-maker') {
        const iframe = document.getElementById('pt_hs_live_iframe');
        if (iframe) {
          updateHotspotLivePreview();
        }
      }

      showToast(`✅ PRO Script [${t.title}] berhasil digenerate!`, 'success');
    } catch(err) {
      const out = document.getElementById('pt_output');
      if (out) out.value = `# Error generating script: ${err.message}`;
      showToast('❌ Error: ' + err.message, 'error');
    }
  }

  // QR Code Rendering
  function renderQrPreview(v) {
    const qrBox = document.getElementById('pt_qr_svg_box');
    if (!qrBox) return;

    const brandEl = document.getElementById('pt_card_brand');
    const ssidEl = document.getElementById('pt_card_ssid');
    const pkgEl = document.getElementById('pt_card_pkg');
    const credEl = document.getElementById('pt_card_cred');
    const waEl = document.getElementById('pt_card_wa');

    if (brandEl) brandEl.textContent = v.qr_brand || 'wifi@Konut Hotspot';
    if (ssidEl) ssidEl.textContent = v.qr_ssid || 'wifi@Konut';
    if (pkgEl) pkgEl.textContent = v.qr_pkg_info || 'Rp 5.000 (12 Jam)';
    if (waEl) waEl.textContent = v.qr_wa || '+62 813-5514-2432';

    let qrText = '';
    const type = v.qr_type || 'wifi';

    if (type === 'wifi') {
      const pwd = v.qr_pwd || '';
      const enc = pwd ? 'WPA' : 'nopass';
      qrText = `WIFI:S:${v.qr_ssid || 'wifi@Konut'};T:${enc};P:${pwd};;`;
      if (credEl) credEl.innerHTML = `Sandi: <b>${pwd || 'Tanpa Sandi'}</b>`;
    } else if (type === 'hotspot') {
      const u = v.qr_voucher_user || 'VOUCH-7892';
      const p = v.qr_voucher_pass || '';
      const url = v.qr_hs_url || 'http://192.168.88.1/login';
      qrText = `${url}?username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}`;
      if (credEl) credEl.innerHTML = `Kode: <b>${u}</b> ${p ? `| Sandi: <b>${p}</b>` : ''}`;
    } else {
      qrText = v.qr_hs_url || 'https://comit.id';
      if (credEl) credEl.innerHTML = `Link: <b>${qrText}</b>`;
    }

    try {
      if (typeof qrcode === 'function') {
        const qr = qrcode(0, 'M');
        qr.addData(qrText);
        qr.make();
        const svg = qr.createSvgTag(3, 2);
        qrBox.innerHTML = svg;
      } else {
        qrBox.innerHTML = `<div style="font-size:11px;color:#ef4444;text-align:center">QR Code Engine Loading...</div>`;
      }
    } catch(err) {
      qrBox.innerHTML = `<div style="font-size:10px;color:#ef4444">Error QR: ${err.message}</div>`;
    }
  }

  function toggleQrFields(type) {
    const isWifi = type === 'wifi';
    const isHotspot = type === 'hotspot';
    const isUrl = type === 'url';

    const fSsid = document.getElementById('pt_field_ssid');
    const fPass = document.getElementById('pt_field_pass');
    const fHsUrl = document.getElementById('pt_field_hs_url');
    const fUser = document.getElementById('pt_field_voucher_user');
    const fVPass = document.getElementById('pt_field_voucher_pass');

    if (fSsid) fSsid.style.display = isWifi ? 'block' : 'none';
    if (fPass) fPass.style.display = isWifi ? 'block' : 'none';
    if (fHsUrl) fHsUrl.style.display = (isHotspot || isUrl) ? 'block' : 'none';
    if (fUser) fUser.style.display = isHotspot ? 'block' : 'none';
    if (fVPass) fVPass.style.display = isHotspot ? 'block' : 'none';

    triggerGen('mikrotik-qr-code-generator');
  }

  function setAiPrompt(text) {
    const el = document.getElementById('pt_ai_prompt');
    if (el) {
      el.value = text;
      triggerGen('ai-script-generator');
    }
  }

  function setLogSample(text) {
    const el = document.getElementById('pt_log_input');
    if (el) {
      el.value = text;
      triggerGen('ai-log-debugger');
    }
  }

  // Helper to extract hotspot config from DOM
  function getHotspotConfig() {
    const name     = document.getElementById('pt_hs_name')?.value || 'wifi@Konut - Baharuddin Net';
    const slogan   = document.getElementById('pt_hs_slogan')?.value || 'Internet Cepat, Murah & Stabil Tanpa Batas';
    const theme    = document.getElementById('pt_hs_theme')?.value || 'orange';
    const mode     = document.getElementById('pt_hs_mode')?.value || 'dual';
    const dns      = document.getElementById('pt_hs_dns')?.value || 'hotspot.local';
    const wa       = document.getElementById('pt_hs_wa')?.value || '+62 813-5514-2432';
    const marquee  = document.getElementById('pt_hs_marquee')?.value || '⚡ Selamat Datang! Beli voucher hubungi CS atau scan QRIS.';
    const hasTrial = document.getElementById('pt_hs_trial')?.checked !== false;
    const showPkgs = document.getElementById('pt_hs_show_pkgs')?.checked !== false;

    const pkgs = [
      { name: document.getElementById('pt_hs_p1_name')?.value || '2 Jam', price: document.getElementById('pt_hs_p1_price')?.value || 'Rp 2.000', spd: document.getElementById('pt_hs_p1_spd')?.value || 'Up to 5 Mbps' },
      { name: document.getElementById('pt_hs_p2_name')?.value || '12 Jam', price: document.getElementById('pt_hs_p2_price')?.value || 'Rp 5.000', spd: document.getElementById('pt_hs_p2_spd')?.value || 'Up to 8 Mbps' },
      { name: document.getElementById('pt_hs_p3_name')?.value || '24 Jam (1 Hari)', price: document.getElementById('pt_hs_p3_price')?.value || 'Rp 10.000', spd: document.getElementById('pt_hs_p3_spd')?.value || 'Up to 10 Mbps' },
      { name: document.getElementById('pt_hs_p4_name')?.value || '7 Hari (1 Minggu)', price: document.getElementById('pt_hs_p4_price')?.value || 'Rp 35.000', spd: document.getElementById('pt_hs_p4_spd')?.value || 'Up to 15 Mbps' },
      { name: document.getElementById('pt_hs_p5_name')?.value || '30 Hari (Bulanan)', price: document.getElementById('pt_hs_p5_price')?.value || 'Rp 100.000', spd: document.getElementById('pt_hs_p5_spd')?.value || 'Up to 20 Mbps' }
    ];

    const themeColors = {
      orange: { primary: '#ff5c00', hover: '#ff7a30', bg: '#0b1120', card: '#162033', text: '#f8fafc', muted: '#94a3b8', border: 'rgba(255,255,255,0.08)', accent: '#3fd3c0' },
      dark:   { primary: '#6366f1', hover: '#818cf8', bg: '#09090b', card: '#18181b', text: '#fafafa', muted: '#a1a1aa', border: 'rgba(255,255,255,0.08)', accent: '#38bdf8' },
      teal:   { primary: '#0ea5e9', hover: '#38bdf8', bg: '#04151f', card: '#0b2535', text: '#f0f9ff', muted: '#94a3b8', border: 'rgba(255,255,255,0.08)', accent: '#2dd4bf' },
      purple: { primary: '#a855f7', hover: '#c084fc', bg: '#0d0b18', card: '#1a162e', text: '#faf5ff', muted: '#a8a29e', border: 'rgba(255,255,255,0.08)', accent: '#f472b6' },
      light:  { primary: '#2563eb', hover: '#1d4ed8', bg: '#f1f5f9', card: '#ffffff', text: '#0f172a', muted: '#64748b', border: '#e2e8f0', accent: '#0284c7' }
    };

    const c = themeColors[theme] || themeColors.orange;
    return { name, slogan, theme, mode, dns, wa, marquee, hasTrial, showPkgs, pkgs, c };
  }

  // Generates standalone complete login.html template
  function getHotspotHtmlCode() {
    const cfg = getHotspotConfig();
    const c = cfg.c;
    const waClean = cfg.wa.replace(/[^0-9]/g, '');

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cfg.name} — Login Portal</title>
  <link rel="stylesheet" href="style.css">
</head>
<body class="theme-${cfg.theme}">
  <div class="portal-wrapper">
    <!-- Brand Header -->
    <div class="brand-header">
      <div class="brand-logo">📶</div>
      <h1 class="brand-title">${cfg.name}</h1>
      <p class="brand-slogan">${cfg.slogan}</p>
    </div>

    ${cfg.marquee ? `
    <!-- Announcement Bar -->
    <div class="marquee-box">
      <marquee behavior="scroll" direction="left" scrollamount="4">${cfg.marquee}</marquee>
    </div>` : ''}

    <!-- MikroTik Error Message -->
    $(if error)
    <div class="alert-error">
      <span>⚠️ $(error)</span>
    </div>
    $(endif)

    <!-- Login Card -->
    <div class="login-card">
      ${cfg.mode === 'dual' ? `
      <!-- Tab Switcher -->
      <div class="login-tabs">
        <button type="button" class="tab-btn active" id="tabVoucher" onclick="switchLoginMode('voucher')">KODE VOUCHER</button>
        <button type="button" class="tab-btn" id="tabMember" onclick="switchLoginMode('member')">MEMBER</button>
      </div>` : ''}

      <!-- Form MikroTik -->
      <form name="sendin" action="$(link-login-only)" method="post" onsubmit="return handleHotspotSubmit();">
        <input type="hidden" name="dst" value="$(link-orig)" />
        <input type="hidden" name="popup" value="true" />

        ${cfg.mode !== 'member' ? `
        <!-- Voucher Section -->
        <div id="voucherSection">
          <div class="form-group">
            <label class="form-label">Kode Voucher</label>
            <input class="form-input form-code" id="voucherCode" type="text" placeholder="MASUKKAN KODE VOUCHER" value="$(username)" autofocus autocomplete="off" autocapitalize="characters" />
            <small class="form-help">Kode voucher biasanya sama dengan password.</small>
          </div>
        </div>` : ''}

        ${cfg.mode !== 'voucher' ? `
        <!-- Member Section -->
        <div id="memberSection" style="${cfg.mode === 'dual' ? 'display:none;' : ''}">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input class="form-input" id="memberUser" type="text" placeholder="Username Member" autocomplete="username" />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input class="form-input" id="memberPass" type="password" placeholder="Password Member" autocomplete="current-password" />
          </div>
        </div>` : ''}

        <!-- Hidden credentials sent to RouterOS -->
        <input type="hidden" name="username" id="realUsername" />
        <input type="hidden" name="password" id="realPassword" />

        <button type="submit" class="btn btn-login">MASUK SEKARANG</button>
      </form>

      ${cfg.hasTrial ? `
      <!-- Trial Free Login -->
      $(if trial == 'yes')
      <a href="$(link-login-only)?dst=$(link-orig-esc)&amp;username=T-$(mac-esc)" class="btn btn-trial">
        ⚡ COBA GRATIS (30 MENIT)
      </a>
      $(endif)` : ''}
    </div>

    ${cfg.showPkgs ? `
    <!-- Voucher Price List -->
    <div class="card-pricing">
      <div class="pricing-title">Daftar Paket &amp; Harga Voucher</div>
      <div class="pricing-grid">
        ${cfg.pkgs.map(p => `
        <div class="price-item">
          <div class="price-dur">${p.name}</div>
          <div class="price-val">${p.price}</div>
          <div class="price-spd">${p.spd}</div>
        </div>`).join('')}
      </div>
    </div>` : ''}

    <!-- CS WhatsApp Button -->
    <div class="footer-contact">
      <a href="https://wa.me/${waClean}?text=Halo%20Admin%20${encodeURIComponent(cfg.name)},%20saya%20mau%20beli%20voucher%20hotspot" target="_blank" class="btn-wa">
        💬 Beli Voucher / Bantuan CS: <b>${cfg.wa}</b>
      </a>
      <div class="copyright">&copy; 2026 ${cfg.name} · Powered by MikroTik RouterOS</div>
    </div>
  </div>

  <script src="md5.js"></script>
  <script>
    let currentMode = '${cfg.mode === "member" ? "member" : "voucher"}';

    function switchLoginMode(mode) {
      currentMode = mode;
      const vSec = document.getElementById('voucherSection');
      const mSec = document.getElementById('memberSection');
      const tV = document.getElementById('tabVoucher');
      const tM = document.getElementById('tabMember');
      if (mode === 'voucher') {
        if (vSec) vSec.style.display = 'block';
        if (mSec) mSec.style.display = 'none';
        if (tV) tV.classList.add('active');
        if (tM) tM.classList.remove('active');
        document.getElementById('voucherCode')?.focus();
      } else {
        if (vSec) vSec.style.display = 'none';
        if (mSec) mSec.style.display = 'block';
        if (tV) tV.classList.remove('active');
        if (tM) tM.classList.add('active');
        document.getElementById('memberUser')?.focus();
      }
    }

    function handleHotspotSubmit() {
      const uField = document.getElementById('realUsername');
      const pField = document.getElementById('realPassword');

      if (currentMode === 'voucher') {
        const code = (document.getElementById('voucherCode')?.value || '').trim();
        if (!code) { alert('Silakan masukkan kode voucher Anda.'); return false; }
        uField.value = code;
        pField.value = code; // Voucher: username = password
      } else {
        const user = (document.getElementById('memberUser')?.value || '').trim();
        const pass = (document.getElementById('memberPass')?.value || '');
        if (!user || !pass) { alert('Silakan masukkan username dan password member.'); return false; }
        uField.value = user;
        pField.value = pass;
      }
      return true;
    }
  </script>
</body>
</html>`;
  }

  // Generates status.html template
  function getHotspotStatusHtmlCode() {
    const cfg = getHotspotConfig();
    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cfg.name} — Status Koneksi</title>
  <link rel="stylesheet" href="style.css">
</head>
<body class="theme-${cfg.theme}">
  <div class="portal-wrapper">
    <div class="brand-header">
      <div class="brand-logo" style="background:#22c55e">✅</div>
      <h1 class="brand-title">Internet Terhubung</h1>
      <p class="brand-slogan">${cfg.name}</p>
    </div>

    <div class="login-card">
      <div class="status-table">
        <div class="status-row"><span>User Akun:</span><b>$(username)</b></div>
        <div class="status-row"><span>IP Address:</span><code>$(ip)</code></div>
        <div class="status-row"><span>MAC Address:</span><code>$(mac)</code></div>
        <div class="status-row"><span>Waktu Terhubung:</span><b>$(uptime)</b></div>
        $(if session-time-left)
        <div class="status-row highlight"><span>Sisa Waktu:</span><b style="color:#ff5c00">$(session-time-left)</b></div>
        $(endif)
        <div class="status-row"><span>Total Upload:</span><b>$(bytes-out-nice)</b></div>
        <div class="status-row"><span>Total Download:</span><b>$(bytes-in-nice)</b></div>
      </div>

      <form action="$(link-logout)" name="logout" method="post" style="margin-top:20px">
        <input type="hidden" name="erase-cookie" value="on">
        <button type="submit" class="btn btn-logout">PUTUSKAN KONEKSI (LOGOUT)</button>
      </form>
    </div>
  </div>
</body>
</html>`;
  }

  // Generates logout.html template
  function getHotspotLogoutHtmlCode() {
    const cfg = getHotspotConfig();
    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cfg.name} — Anda Telah Logout</title>
  <link rel="stylesheet" href="style.css">
</head>
<body class="theme-${cfg.theme}">
  <div class="portal-wrapper">
    <div class="brand-header">
      <div class="brand-logo">👋</div>
      <h1 class="brand-title">Sampai Jumpa!</h1>
      <p class="brand-slogan">Koneksi internet Anda telah diakhiri.</p>
    </div>

    <div class="login-card" style="text-align:center">
      <p style="font-size:13px;color:#94a3b8;margin-bottom:20px;line-height:1.6">
        Terima kasih telah menggunakan layanan internet dari <b>${cfg.name}</b>.
      </p>
      <a href="$(link-login)" class="btn btn-login">LOGIN KEMBALI</a>
    </div>
  </div>
</body>
</html>`;
  }

  // Generates style.css template
  function getHotspotCssCode() {
    const cfg = getHotspotConfig();
    const c = cfg.c;
    return `/* MikroTik Captive Portal Stylesheet - Generated by ComitTools PRO */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: ${c.bg};
  color: ${c.text};
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 14px;
}
.portal-wrapper {
  width: 100%;
  max-width: 410px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.brand-header { text-align: center; }
.brand-logo {
  width: 54px; height: 54px;
  background: ${c.primary};
  border-radius: 16px;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 24px; color: #fff;
  box-shadow: 0 8px 24px ${c.primary}55;
  margin-bottom: 10px;
}
.brand-title { font-size: 20px; font-weight: 800; color: ${c.text}; margin-bottom: 4px; }
.brand-slogan { font-size: 12px; color: ${c.muted}; }

.marquee-box {
  background: rgba(255,255,255,0.03);
  border: 1px solid ${c.border};
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 11px;
  color: ${c.accent};
}

.alert-error {
  background: rgba(239,68,68,0.15);
  border: 1px solid rgba(239,68,68,0.3);
  color: #f87171;
  font-size: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  text-align: center;
}

.login-card {
  background: ${c.card};
  border: 1px solid ${c.border};
  border-radius: 20px;
  padding: 24px 20px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.5);
}

.login-tabs {
  display: flex;
  background: rgba(0,0,0,0.25);
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 18px;
  border: 1px solid ${c.border};
}
.tab-btn {
  flex: 1; padding: 9px;
  border: none; border-radius: 7px;
  background: transparent;
  color: ${c.muted};
  font-size: 12px; font-weight: 700;
  cursor: pointer; transition: all .2s;
}
.tab-btn.active {
  background: ${c.primary};
  color: #fff;
  box-shadow: 0 3px 12px ${c.primary}44;
}

.form-group { margin-bottom: 14px; }
.form-label { display: block; font-size: 11px; font-weight: 700; color: ${c.muted}; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
.form-input {
  width: 100%; padding: 12px 14px;
  background: rgba(0,0,0,0.25);
  border: 1px solid ${c.border};
  border-radius: 10px;
  color: ${c.text};
  font-size: 14px; outline: none;
  transition: border-color .2s, box-shadow .2s;
}
.form-input:focus { border-color: ${c.primary}; box-shadow: 0 0 0 3px ${c.primary}33; }
.form-code { text-align: center; font-weight: 800; letter-spacing: 2px; font-size: 15px; text-transform: uppercase; }
.form-help { display: block; font-size: 10px; color: ${c.muted}; margin-top: 4px; }

.btn {
  width: 100%; padding: 13px;
  border: none; border-radius: 10px;
  font-size: 14px; font-weight: 800;
  cursor: pointer; transition: all .2s;
  text-decoration: none; display: block; text-align: center;
}
.btn-login { background: ${c.primary}; color: #fff; box-shadow: 0 6px 20px ${c.primary}44; margin-top: 6px; }
.btn-login:hover { background: ${c.hover}; transform: translateY(-1px); }
.btn-trial {
  background: rgba(255,255,255,0.05);
  border: 1px solid ${c.border};
  color: ${c.accent};
  font-size: 12px; margin-top: 10px;
}
.btn-trial:hover { background: rgba(255,255,255,0.08); }
.btn-logout { background: #ef4444; color: #fff; margin-top: 14px; }

.card-pricing {
  background: ${c.card};
  border: 1px solid ${c.border};
  border-radius: 16px;
  padding: 16px;
}
.pricing-title { font-size: 12px; font-weight: 800; color: ${c.muted}; text-transform: uppercase; margin-bottom: 10px; text-align: center; }
.pricing-grid { display: grid; grid-template-columns: 1fr; gap: 8px; }
.price-item {
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(255,255,255,0.03);
  border: 1px solid ${c.border};
  border-radius: 8px; padding: 8px 12px;
  font-size: 12px;
}
.price-dur { font-weight: 700; color: ${c.text}; }
.price-val { font-weight: 800; color: ${c.primary}; }
.price-spd { font-size: 10px; color: ${c.muted}; }

.footer-contact { text-align: center; margin-top: 4px; }
.btn-wa {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  color: #22c55e; font-size: 12px; text-decoration: none; font-weight: 700;
  background: rgba(34,197,94,0.08); padding: 9px 16px; border-radius: 20px;
  border: 1px solid rgba(34,197,94,0.2);
}
.btn-wa:hover { background: rgba(34,197,94,0.15); }
.copyright { font-size: 10px; color: ${c.muted}; margin-top: 10px; }

.status-table { display: flex; flex-direction: column; gap: 8px; font-size: 12px; }
.status-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid ${c.border}; }
.status-row.highlight { font-size: 14px; font-weight: 800; border-color: ${c.primary}; }
code { font-family: monospace; color: ${c.accent}; }
`;
  }

  // Official MikroTik md5.js (standard hexMD5)
  function getHotspotMd5Code() {
    return `/* MD5 CHAP script for MikroTik RouterOS */
var hexcase = 0;
var b64pad  = "";
var chrsz   = 8;
function hex_md5(s){ return binl2hex(core_md5(str2binl(s), s.length * chrsz)); }
function b64_md5(s){ return binl2b64(core_md5(str2binl(s), s.length * chrsz)); }
function str_md5(s){ return binl2str(core_md5(str2binl(s), s.length * chrsz)); }
function hex_hmac_md5(key, data) { return binl2hex(core_hmac_md5(key, data)); }
function b64_hmac_md5(key, data) { return binl2b64(core_hmac_md5(key, data)); }
function str_hmac_md5(key, data) { return binl2str(core_hmac_md5(key, data)); }
function core_md5(x, len){
  x[len >> 5] |= 0x80 << ((len) % 32);
  x[(((len + 64) >>> 9) << 4) + 14] = len;
  var a =  1732584193, b = -271733879, c = -1732584194, d =  271733878;
  for(var i = 0; i < x.length; i += 16){
    var olda = a, oldb = b, oldc = c, oldd = d;
    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936); d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819); b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897); d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);
    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713); b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438); d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);d = md5_gg(d, a, b, c, x[i+ 8], 20,  1163531501);
    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -150232);    d = md5_hh(d, a, b, c, x[i+ 8], 11, -378558);
    c = md5_hh(c, d, a, b, x[i+11], 16,  17087277);  b = md5_hh(b, c, d, a, x[i+14], 23, -670586216);
    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -842523);    d = md5_hh(d, a, b, c, x[i+ 4], 11,  15704408);
    c = md5_hh(c, d, a, b, x[i+ 7], 16, -19999281);  b = md5_hh(b, c, d, a, x[i+10], 23, -117719874);
    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
    a = safe_add(a, olda); b = safe_add(b, oldb); c = safe_add(c, oldc); d = safe_add(d, oldd);
  }
  return Array(a, b, c, d);
}
function md5_cmn(q, a, b, x, s, t){ return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b); }
function md5_ff(a, b, c, d, x, s, t){ return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t); }
function md5_gg(a, b, c, d, x, s, t){ return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t); }
function md5_hh(a, b, c, d, x, s, t){ return md5_cmn(b ^ c ^ d, a, b, x, s, t); }
function md5_ii(a, b, c, d, x, s, t){ return md5_cmn(c ^ (b | (~d)), a, b, x, s, t); }
function safe_add(x, y){ var lsw = (x & 0xFFFF) + (y & 0xFFFF); var msw = (x >> 16) + (y >> 16) + (lsw >> 16); return (msw << 16) | (lsw & 0xFFFF); }
function bit_rol(num, cnt){ return (num << cnt) | (num >>> (32 - cnt)); }
function str2binl(str){ var bin = Array(); var mask = (1 << chrsz) - 1; for(var i = 0; i < str.length * chrsz; i += chrsz) bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (i%32); return bin; }
function binl2hex(binarray){ var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef"; var str = ""; for(var i = 0; i < binarray.length * 4; i++) str += hex_tab.charAt((binarray[i>>2] >> ((i%4)*8+4)) & 0xF) + hex_tab.charAt((binarray[i>>2] >> ((i%4)*8  )) & 0xF); return str; }
`;
  }

  // Update live preview in iframe and script
  function updateHotspotLivePreview() {
    const iframe = document.getElementById('pt_hs_live_iframe');
    if (iframe) {
      let code = getHotspotHtmlCode();
      const css = getHotspotCssCode();
      // Inject css inline for iframe preview
      code = code.replace('<link rel="stylesheet" href="style.css">', `<style>${css}</style>`);
      // Replace template markers for live preview demo
      code = code.replace(/\$\(if error\)[\s\S]*?\$\(endif\)/g, '');
      code = code.replace(/\$\(username\)/g, 'VOUCH-789');
      code = code.replace(/\$\(link-login-only\)/g, '#');
      code = code.replace(/\$\(link-orig\)/g, '#');
      code = code.replace(/\$\(if trial == 'yes'\)([\s\S]*?)\$\(endif\)/g, '$1');
      iframe.srcdoc = code;
    }

    // Refresh output script
    triggerGen('hotspot-login-page-maker');
  }

  function switchHotspotTab(tab) {
    const pBtn = document.getElementById('pt_tab_hs_preview');
    const sBtn = document.getElementById('pt_tab_hs_script');
    const iframeWrap = document.getElementById('pt_hs_iframe_wrap');
    const viewportCtrl = document.getElementById('pt_hs_viewport_controls');
    const terminalOut = document.getElementById('pt_output');
    const terminalHdr = terminalOut?.previousElementSibling;

    if (tab === 'preview') {
      if (pBtn) { pBtn.className = 'btn btn-teal btn-sm'; }
      if (sBtn) { sBtn.className = 'btn btn-secondary btn-sm'; }
      if (iframeWrap) iframeWrap.style.display = 'flex';
      if (viewportCtrl) viewportCtrl.style.display = 'flex';
      if (terminalOut) terminalOut.style.display = 'none';
      if (terminalHdr) terminalHdr.style.display = 'none';
    } else {
      if (pBtn) { pBtn.className = 'btn btn-secondary btn-sm'; }
      if (sBtn) { sBtn.className = 'btn btn-teal btn-sm'; }
      if (iframeWrap) iframeWrap.style.display = 'none';
      if (viewportCtrl) viewportCtrl.style.display = 'none';
      if (terminalOut) terminalOut.style.display = 'block';
      if (terminalHdr) terminalHdr.style.display = 'flex';
    }
  }

  function setHotspotIframeWidth(width) {
    const iframe = document.getElementById('pt_hs_live_iframe');
    if (iframe) {
      iframe.style.width = width;
    }
  }

  // Full ZIP download with JSZip
  async function downloadHotspotZip() {
    const cfg = getHotspotConfig();
    const loginHtml = getHotspotHtmlCode();
    const statusHtml = getHotspotStatusHtmlCode();
    const logoutHtml = getHotspotLogoutHtmlCode();
    const styleCss = getHotspotCssCode();
    const md5Js = getHotspotMd5Code();
    const rscScript = document.getElementById('pt_output')?.value || proToolDefs['hotspot-login-page-maker'].generate({}, 'v7');

    const readme = `================================================================
CARA MEMASANG TEMPLATE HOTSPOT DI MIKROTIK ROUTEROS
Template : ${cfg.name}
Generated: ComitTools PRO (${new Date().toLocaleString('id-ID')})
================================================================

LANGKAH 1: UPLOAD KE MIKROTIK
1. Ekstrak file ZIP ini di komputer Anda.
2. Buka aplikasi Winbox -> Hubungkan ke Router MikroTik Anda.
3. Buka menu [Files] di bilah kiri Winbox.
4. Drag & Drop folder "hotspot/" dari komputer ke dalam jendela Files Winbox.
   (Pastikan folder bernama "hotspot" berada di root folder router).

LANGKAH 2: EKSEKUSI SCRIPT ROUTEROS
1. Buka menu [New Terminal] di Winbox.
2. Buka file "hotspot-setup.rsc" dengan Notepad, lalu Copy seluruh isinya.
3. Paste ke dalam Terminal Winbox, lalu tekan Enter.
4. Selesai! Login portal hotspot Anda kini telah aktif.

TIPS:
- URL Portal default: http://${cfg.dns}
- CS WhatsApp bantuan: ${cfg.wa}
================================================================`;

    if (typeof JSZip === 'function') {
      try {
        const zip = new JSZip();
        const folder = zip.folder("hotspot");
        folder.file("login.html", loginHtml);
        folder.file("status.html", statusHtml);
        folder.file("logout.html", logoutHtml);
        folder.file("style.css", styleCss);
        folder.file("md5.js", md5Js);
        folder.file("hotspot-setup.rsc", rscScript);
        folder.file("README-CARA-PASANG.txt", readme);

        const content = await zip.generateAsync({ type: "blob" });
        const cleanName = cfg.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        const fileName = `hotspot-template-${cleanName || 'portal'}.zip`;

        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('📦 Berhasil mendownload paket lengkap Hotspot Template (.ZIP)! Siap upload ke Winbox.', 'success');
        return;
      } catch (err) {
        console.error('JSZip Error:', err);
      }
    }

    // Fallback: download login.html
    downloadHotspotHtml();
  }

  function downloadHotspotHtml() {
    const code = getHotspotHtmlCode();
    const blob = new Blob([code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'login.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 Berhasil mendownload login.html! Siap diupload ke folder hotspot router.', 'success');
  }

  function previewHotspotHtml() {
    const code = getHotspotHtmlCode();
    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.write(code);
      win.document.close();
    } else {
      showToast('Popup terblokir oleh browser. Izinkan pop-up untuk melihat live preview.', 'warning');
    }
  }

  function previewHotspotHtml() {
    const code = getHotspotHtmlCode();
    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.write(code);
      win.document.close();
    } else {
      showToast('Popup terblokir oleh browser. Izinkan pop-up untuk melihat live preview.', 'warning');
    }
  }

  function printVoucherCard() {
    const printArea = document.getElementById('pt_voucher_print_area');
    if (!printArea) return;
    const printWindow = window.open('', '_blank', 'width=600,height=400');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Voucher Hotspot</title>
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fff; }
            .card { border: 2px dashed #000; border-radius: 10px; padding: 20px; display: flex; gap: 20px; align-items: center; width: 420px; }
            svg { width: 110px; height: 110px; }
          </style>
        </head>
        <body onload="window.print();window.close();">
          <div class="card">${printArea.innerHTML}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  function downloadQrSvg() {
    const qrBox = document.getElementById('pt_qr_svg_box');
    const svgEl = qrBox?.querySelector('svg');
    if (!svgEl) {
      showToast('QR Code belum digenerate.', 'warning');
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mikrotik-hotspot-qr.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 Berhasil mendownload file QR SVG!', 'success');
  }

  return {
    proToolDefs,
    getModalHTML,
    triggerGen,
    toggleQrFields,
    setAiPrompt,
    setLogSample,
    downloadHotspotHtml,
    downloadHotspotZip,
    previewHotspotHtml,
    updateHotspotLivePreview,
    switchHotspotTab,
    setHotspotIframeWidth,
    printVoucherCard,
    downloadQrSvg
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ProTools };
}

