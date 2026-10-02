/**
 * Fast Tools Generator Engine — ComitTools PRO
 * Supports all 60 Fast Free MikroTik Script Generator tools
 * Compatible with RouterOS v6.x and v7.x
 */

const FastTools = (function() {
  'use strict';

  // Helper for comment banner
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

  // Registry of 60 Fast Tool Generators
  const tools = {
    'add-admin-user': {
      title: 'Add Admin User',
      renderForm: function(cfg) {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-user-shield"></i> User Credentials</div>
            <div class="form-group">
              <label class="form-label">Username</label>
              <input class="form-control form-control-mono" id="ft_user" value="${cfg.user || 'admin2'}">
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input class="form-control form-control-mono" id="ft_pass" value="${cfg.pass || 'StrongPass#2026'}" type="text">
            </div>
            <div class="form-group">
              <label class="form-label">Group Permission</label>
              <select class="form-control" id="ft_group">
                <option value="full" selected>full (Read, Write, Policy)</option>
                <option value="write">write (Read & Write)</option>
                <option value="read">read (Read Only)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Allowed IP Address (Optional)</label>
              <input class="form-control form-control-mono" id="ft_allowed" placeholder="e.g. 192.168.88.0/24 or leave empty" value="${cfg.allowed || ''}">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Comment</label>
              <input class="form-control" id="ft_comment" value="Created via ComitTools PRO">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const u = v.user || 'admin2';
        const p = v.pass || 'Admin@123';
        const g = v.group || 'full';
        const a = v.allowed ? ` allowed-address=${v.allowed}` : '';
        const c = v.comment ? ` comment="${v.comment}"` : '';
        return banner('Add Admin User', ros) +
          `/user add name="${u}" password="${p}" group=${g}${a}${c}\n` +
          `:put "Admin user [${u}] successfully created with [${g}] permissions."\n`;
      }
    },

    'add-ip-address': {
      title: 'Add IP Address',
      renderForm: function(cfg) {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-network-wired"></i> IP Assignment</div>
            <div class="form-group">
              <label class="form-label">IP Address / CIDR</label>
              <input class="form-control form-control-mono" id="ft_ip" value="${cfg.ip || '192.168.88.1/24'}">
            </div>
            <div class="form-group">
              <label class="form-label">Interface</label>
              <input class="form-control form-control-mono" id="ft_iface" value="${cfg.iface || 'bridge-lan'}">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Comment</label>
              <input class="form-control" id="ft_comment" value="LAN Gateway">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        return banner('Add IP Address', ros) +
          `/ip address add address=${v.ip || '192.168.88.1/24'} interface=${v.iface || 'bridge'} comment="${v.comment || 'LAN'}"\n`;
      }
    },

    'add-ip-pool': {
      title: 'Add IP Pool',
      renderForm: function(cfg) {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-layer-group"></i> Pool Settings</div>
            <div class="form-group">
              <label class="form-label">Pool Name</label>
              <input class="form-control form-control-mono" id="ft_poolname" value="${cfg.name || 'pool-dhcp-lan'}">
            </div>
            <div class="form-group">
              <label class="form-label">IP Range</label>
              <input class="form-control form-control-mono" id="ft_range" value="${cfg.range || '192.168.88.10-192.168.88.250'}">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Next Pool (Optional)</label>
              <input class="form-control form-control-mono" id="ft_nextpool" placeholder="none" value="${cfg.nextpool || 'none'}">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const next = v.nextpool && v.nextpool !== 'none' ? ` next-pool=${v.nextpool}` : '';
        return banner('Add IP Pool', ros) +
          `/ip pool add name="${v.poolname || 'pool1'}" ranges=${v.range || '192.168.88.10-192.168.88.254'}${next}\n`;
      }
    },

    'anti-ddos-attacks': {
      title: 'Anti DDoS Attacks',
      renderForm: function(cfg) {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-shield-virus"></i> DDoS Thresholds</div>
            <div class="form-group">
              <label class="form-label">SYN Flood Rate Limit</label>
              <input class="form-control form-control-mono" id="ft_syn" value="200/5s,10:packet">
            </div>
            <div class="form-group">
              <label class="form-label">UDP Flood Rate Limit</label>
              <input class="form-control form-control-mono" id="ft_udp" value="2000/5s,100:packet">
            </div>
            <div class="form-group">
              <label class="form-label">Blacklist Timeout</label>
              <select class="form-control" id="ft_timeout">
                <option value="1h">1 Hour</option>
                <option value="1d" selected>1 Day</option>
                <option value="7d">7 Days</option>
              </select>
            </div>
            <label class="form-check mb-0"><input type="checkbox" id="ft_bogon" checked> Include Bogon IP Filter</label>
          </div>
        `;
      },
      generate: function(v, ros) {
        return banner('Anti DDoS Protection', ros) +
          '/ip firewall filter\n' +
          `add chain=input action=jump jump-target=ddos-check connection-state=new comment="Jump to DDoS Check"\n` +
          `add chain=forward action=jump jump-target=ddos-check connection-state=new comment="Jump to DDoS Check"\n` +
          `add chain=ddos-check protocol=tcp tcp-flags=syn limit=${v.syn || '200/5s,10:packet'} action=return comment="Allow normal SYN rate"\n` +
          `add chain=ddos-check protocol=tcp tcp-flags=syn action=add-src-to-address-list address-list=ddos_attackers address-list-timeout=${v.timeout || '1d'} comment="Blacklist SYN Flooders"\n` +
          `add chain=ddos-check protocol=udp limit=${v.udp || '2000/5s,100:packet'} action=return comment="Allow normal UDP rate"\n` +
          `add chain=ddos-check protocol=udp action=add-src-to-address-list address-list=ddos_attackers address-list-timeout=${v.timeout || '1d'} comment="Blacklist UDP Flooders"\n` +
          `add chain=input src-address-list=ddos_attackers action=drop comment="Drop DDoS Attackers"\n` +
          `add chain=forward src-address-list=ddos_attackers action=drop comment="Drop DDoS Attackers"\n`;
      }
    },

    'anti-hack-exploit-user-dat': {
      title: 'Anti Hack Exploit (user.dat)',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-bug-slash"></i> Vulnerability Mitigation</div>
            <p style="font-size:12px;color:var(--text-secondary);margin-bottom:10px">Melindungi bug MikroTik lama (Chimay-Red, CVE-2018-14847 Winbox user.dat extraction exploit) yang menargetkan port 8291.</p>
            <div class="form-group mb-0">
              <label class="form-label">WAN Interface</label>
              <input class="form-control form-control-mono" id="ft_wan" value="ether1">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const wan = v.wan || 'ether1';
        return banner('Anti Hack Exploit (user.dat - CVE-2018-14847)', ros) +
          `/ip firewall filter\n` +
          `add chain=input in-interface=${wan} protocol=tcp dst-port=8291 action=drop comment="Block WAN Winbox (Prevent user.dat Exploit)"\n` +
          `add chain=input in-interface=${wan} protocol=tcp dst-port=2000-2005 action=drop comment="Block Bandwidth-test brute force"\n` +
          `:put "Winbox WAN lockdown applied. Ensure you manage your router from LAN."\n`;
      }
    },

    'anti-hack-mikrotik': {
      title: 'Anti Hack MikroTik',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-shield-halved"></i> Security Hardening</div>
            <label class="form-check"><input type="checkbox" id="ft_distelnet" checked> Disable Telnet (port 23)</label>
            <label class="form-check"><input type="checkbox" id="ft_disftp" checked> Disable FTP (port 21)</label>
            <label class="form-check"><input type="checkbox" id="ft_diswww" checked> Disable Insecure HTTP Webfig (port 80)</label>
            <label class="form-check"><input type="checkbox" id="ft_disapi" checked> Disable Plain API (port 8728)</label>
            <div class="form-group mt-2 mb-0">
              <label class="form-label">Change SSH Port (Default: 22)</label>
              <input class="form-control form-control-mono" id="ft_sshport" value="2222">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        return banner('Anti Hack MikroTik Security Lockdown', ros) +
          `/ip service set telnet disabled=yes\n` +
          `/ip service set ftp disabled=yes\n` +
          `/ip service set www disabled=yes\n` +
          `/ip service set api disabled=yes\n` +
          `/ip service set ssh port=${v.sshport || '2222'}\n` +
          `/tool mac-server set allowed-interface-list=none\n` +
          `/tool mac-server mac-winbox set allowed-interface-list=none\n` +
          `:put "Insecure services disabled and SSH moved to custom port."\n`;
      }
    },

    'anti-netcut': {
      title: 'Anti Netcut (ARP Poisoning)',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-scissors"></i> ARP Security</div>
            <div class="form-group">
              <label class="form-label">LAN / Hotspot Interface</label>
              <input class="form-control form-control-mono" id="ft_iface" value="bridge-lan">
            </div>
            <label class="form-check"><input type="checkbox" id="ft_replyonly" checked> Set ARP Mode to 'reply-only'</label>
            <label class="form-check mb-0"><input type="checkbox" id="ft_dhcpadd" checked> Enable DHCP Server 'Add ARP For Leases'</label>
          </div>
        `;
      },
      generate: function(v, ros) {
        const iface = v.iface || 'bridge-lan';
        return banner('Anti Netcut (ARP Poisoning Protection)', ros) +
          `/interface bridge set [find name="${iface}"] arp=reply-only\n` +
          `/ip dhcp-server set [find] add-arp=yes\n` +
          `/ip firewall filter add chain=forward protocol=udp dst-port=67-68 in-interface=${iface} action=accept comment="Allow DHCP"\n` +
          `:put "ARP set to reply-only. Rogue ARP Spoofing/Netcut is blocked."\n`;
      }
    },

    'anti-tethering-hotspot': {
      title: 'Anti Tethering Hotspot',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-mobile-screen-button"></i> TTL Adjustment</div>
            <p style="font-size:12px;color:var(--text-secondary);margin-bottom:10px">Mengubah TTL (Time-to-Live) menjadi 1 sehingga perangkat client tidak bisa membagikan hotspot (tethering/wifi sharing).</p>
            <div class="form-group">
              <label class="form-label">Hotspot / Client Interface</label>
              <input class="form-control form-control-mono" id="ft_iface" value="bridge-hotspot">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">TTL Value</label>
              <input class="form-control form-control-mono" id="ft_ttl" value="1">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const iface = v.iface || 'bridge-hotspot';
        const ttl = v.ttl || '1';
        return banner('Anti Tethering Hotspot (TTL Clamp)', ros) +
          `/ip firewall mangle\n` +
          `add chain=postrouting out-interface=${iface} action=change-ttl new-ttl=set:${ttl} passthrough=no comment="Anti Tethering Hotspot"\n` +
          `:put "Mangle rule added: TTL set to ${ttl} on ${iface}."\n`;
      }
    },

    'anti-ping-wan': {
      title: 'Anti-Ping WAN',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-eye-slash"></i> WAN Stealth Mode</div>
            <div class="form-group mb-0">
              <label class="form-label">WAN Interface</label>
              <input class="form-control form-control-mono" id="ft_wan" value="ether1">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const wan = v.wan || 'ether1';
        return banner('Anti-Ping WAN (Drop ICMP on WAN)', ros) +
          `/ip firewall filter\n` +
          `add chain=input in-interface=${wan} protocol=icmp action=drop comment="Anti Ping WAN"\n` +
          `:put "Router is now stealth to external ICMP ping requests."\n`;
      }
    },

    'auto-reboot': {
      title: 'Auto Reboot Scheduler',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-clock-rotate-left"></i> Schedule Settings</div>
            <div class="form-group">
              <label class="form-label">Reboot Time (HH:MM:SS)</label>
              <input class="form-control form-control-mono" id="ft_time" value="04:00:00">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Interval</label>
              <input class="form-control form-control-mono" id="ft_interval" value="1d">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const t = v.time || '04:00:00';
        const i = v.interval || '1d';
        return banner('Auto Reboot Scheduler', ros) +
          `/system scheduler add name="daily-reboot" start-time=${t} interval=${i} on-event="/system reboot" comment="Auto Reboot Scheduled by ComitTools PRO"\n` +
          `:put "Scheduler [daily-reboot] scheduled for ${t} every ${i}."\n`;
      }
    },

    'backup-export-file-rsc': {
      title: 'Backup Export File .rsc',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-file-export"></i> Backup Options</div>
            <div class="form-group">
              <label class="form-label">File Name Prefix</label>
              <input class="form-control form-control-mono" id="ft_fname" value="backup-comittools">
            </div>
            <label class="form-check"><input type="checkbox" id="ft_compact" checked> Compact Export Format</label>
            <label class="form-check mb-0"><input type="checkbox" id="ft_hidepass"> Hide Passwords & Sensitive Data</label>
          </div>
        `;
      },
      generate: function(v, ros) {
        const fn = v.fname || 'backup-comittools';
        const hide = v.hidepass ? ' show-sensitive=no' : ' show-sensitive=yes';
        const compact = v.compact ? ' compact' : '';
        return banner('Backup Export File .rsc & .backup', ros) +
          `:local dt [/system clock get date]\n` +
          `:local tm [/system clock get time]\n` +
          `:local id [/system identity get name]\n` +
          `/export file=("${fn}-" . $id . "-" . $dt . ".rsc")${compact}${hide}\n` +
          `/system backup save name=("${fn}-" . $id . "-" . $dt . ".backup")\n` +
          `:put "Backup completed! Download the files from Winbox Files menu."\n`;
      }
    },

    'block-access-modem': {
      title: 'Block Access Modem',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-lock"></i> Modem Isolation</div>
            <div class="form-group">
              <label class="form-label">Modem IP / Subnet</label>
              <input class="form-control form-control-mono" id="ft_modemip" value="192.168.1.1/32">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Client LAN Subnet</label>
              <input class="form-control form-control-mono" id="ft_lan" value="192.168.88.0/24">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const m = v.modemip || '192.168.1.1';
        const lan = v.lan || '192.168.88.0/24';
        return banner('Block Client Access to Modem GUI', ros) +
          `/ip firewall filter\n` +
          `add chain=forward src-address=${lan} dst-address=${m} action=drop comment="Block Client Access to ISP Modem"\n` +
          `:put "Client access to modem [${m}] is blocked."\n`;
      }
    },

    'block-ip-address': {
      title: 'Block IP Address',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-ban"></i> Target IP to Block</div>
            <div class="form-group">
              <label class="form-label">Target IP / CIDR</label>
              <input class="form-control form-control-mono" id="ft_targetip" value="192.168.88.50">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Comment</label>
              <input class="form-control" id="ft_comment" value="Blocked Host">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const ip = v.targetip || '192.168.88.50';
        return banner('Block IP Address', ros) +
          `/ip firewall filter\n` +
          `add chain=forward src-address=${ip} action=drop comment="${v.comment || 'Blocked IP'}"\n` +
          `add chain=forward dst-address=${ip} action=drop comment="${v.comment || 'Blocked IP'}"\n` +
          `add chain=input src-address=${ip} action=drop comment="${v.comment || 'Blocked IP'}"\n` +
          `:put "Host [${ip}] completely blocked."\n`;
      }
    },

    'block-mac-address': {
      title: 'Block MAC Address',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-ethernet"></i> Target MAC</div>
            <div class="form-group mb-0">
              <label class="form-label">MAC Address</label>
              <input class="form-control form-control-mono" id="ft_mac" value="00:11:22:33:44:55">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const mac = v.mac || '00:11:22:33:44:55';
        return banner('Block MAC Address (Bridge Filter)', ros) +
          `/interface bridge filter\n` +
          `add chain=forward src-mac-address=${mac}/FF:FF:FF:FF:FF:FF action=drop comment="Block MAC ${mac}"\n` +
          `add chain=input src-mac-address=${mac}/FF:FF:FF:FF:FF:FF action=drop comment="Block MAC ${mac}"\n` +
          `:put "MAC address [${mac}] blocked at bridge level."\n`;
      }
    },

    'block-open-proxy': {
      title: 'Block Open PROXY',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-globe"></i> Open Proxy Shield</div>
            <div class="form-group mb-0">
              <label class="form-label">WAN Interface</label>
              <input class="form-control form-control-mono" id="ft_wan" value="ether1">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const wan = v.wan || 'ether1';
        return banner('Block External Open Proxy (Ports 8080, 3128, 8000)', ros) +
          `/ip firewall filter\n` +
          `add chain=input in-interface=${wan} protocol=tcp dst-port=8080,3128,8000 action=drop comment="Block External Proxy Access"\n` +
          `:put "External access to proxy ports blocked."\n`;
      }
    },

    'block-open-recursive-dns': {
      title: 'Block Open Recursive DNS',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-server"></i> Anti DNS Amplification</div>
            <div class="form-group mb-0">
              <label class="form-label">WAN Interface</label>
              <input class="form-control form-control-mono" id="ft_wan" value="ether1">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const wan = v.wan || 'ether1';
        return banner('Block Open Recursive DNS (Prevent DDoS Reflection)', ros) +
          `/ip firewall filter\n` +
          `add chain=input in-interface=${wan} protocol=udp dst-port=53 action=drop comment="Drop External UDP DNS"\n` +
          `add chain=input in-interface=${wan} protocol=tcp dst-port=53 action=drop comment="Drop External TCP DNS"\n` +
          `:put "Router protected from DNS Amplification attacks."\n`;
      }
    },

    'block-port': {
      title: 'Block Port',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-door-closed"></i> Port Filter</div>
            <div class="form-group">
              <label class="form-label">Port(s) to Block</label>
              <input class="form-control form-control-mono" id="ft_ports" value="23,445,135,137-139">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Protocol</label>
              <select class="form-control" id="ft_proto">
                <option value="tcp" selected>TCP</option>
                <option value="udp">UDP</option>
                <option value="tcp,udp">TCP & UDP</option>
              </select>
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const p = v.ports || '23,445';
        const proto = v.proto || 'tcp';
        let cmds = '';
        if (proto.includes('tcp')) cmds += `/ip firewall filter add chain=forward protocol=tcp dst-port=${p} action=drop comment="Block TCP ${p}"\n`;
        if (proto.includes('udp')) cmds += `/ip firewall filter add chain=forward protocol=udp dst-port=${p} action=drop comment="Block UDP ${p}"\n`;
        return banner(`Block Port (${p})`, ros) + cmds;
      }
    },

    'block-website-layer-7': {
      title: 'Block Website (Layer 7)',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-filter"></i> Layer 7 Protocol Filter</div>
            <div class="form-group">
              <label class="form-label">Domain Pattern (Regex)</label>
              <input class="form-control form-control-mono" id="ft_regex" value="^.+(facebook.com|tiktok.com|youtube.com).*$">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Rule Name</label>
              <input class="form-control" id="ft_name" value="BLOCK_SOCIAL">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const r = v.regex || '^.+(facebook.com).*$';
        const n = v.name || 'BLOCK_L7';
        return banner('Block Website (Layer 7 Protocol)', ros) +
          `/ip firewall layer7-protocol add name="${n}" regexp="${r}"\n` +
          `/ip firewall filter add chain=forward layer7-protocol="${n}" action=drop comment="Drop ${n}"\n` +
          `:put "Layer 7 block rule applied."\n`;
      }
    },

    'block-website-static-dns': {
      title: 'Block Website (Static DNS)',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-shield"></i> DNS Sinkhole</div>
            <div class="form-group">
              <label class="form-label">Domain Name</label>
              <input class="form-control form-control-mono" id="ft_domain" value="ads.tiktok.com">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Redirect Address</label>
              <input class="form-control form-control-mono" id="ft_redirect" value="127.0.0.1">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const d = v.domain || 'ads.example.com';
        const r = v.redirect || '127.0.0.1';
        return banner('Block Website via Static DNS Sinkhole', ros) +
          `/ip dns static add name="${d}" address=${r} ttl=1d comment="DNS Sinkhole Block"\n` +
          `/ip dns cache flush\n` +
          `:put "Domain [${d}] routed to sinkhole [${r}]."\n`;
      }
    },

    'bootloader-protector': {
      title: 'Bootloader Protector',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-microchip"></i> Hardware Reset Protection</div>
            <p style="font-size:12px;color:var(--text-secondary);margin-bottom:10px">Mengunci bootloader RouterBOARD agar tidak dapat di-reset melalui tombol fisik (hard-reset button) oleh orang tidak berwenang.</p>
          </div>
        `;
      },
      generate: function(v, ros) {
        return banner('Bootloader Hard-Reset Protection', ros) +
          `/system routerboard settings set protected-routerboot=enabled reformat-hold-button=no\n` +
          `:put "Physical reset button disabled. Press reset for 15s to confirm within 1 minute."\n`;
      }
    },

    'bypass-local-traffic': {
      title: 'Bypass Local Traffic',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-arrow-turn-down"></i> Local Network List</div>
            <div class="form-group mb-0">
              <label class="form-label">LAN Interface</label>
              <input class="form-control form-control-mono" id="ft_lan" value="bridge-lan">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const lan = v.lan || 'bridge-lan';
        return banner('Bypass Local Traffic from Mangle & NAT', ros) +
          `/ip firewall address-list\n` +
          `add list=LOCAL_NET address=10.0.0.0/8 comment="Private RFC1918"\n` +
          `add list=LOCAL_NET address=172.16.0.0/12 comment="Private RFC1918"\n` +
          `add list=LOCAL_NET address=192.168.0.0/16 comment="Private RFC1918"\n` +
          `/ip firewall mangle\n` +
          `add chain=prerouting in-interface=${lan} dst-address-list=LOCAL_NET action=accept comment="Bypass Local-to-Local"\n` +
          `:put "Local subnet bypass rules installed."\n`;
      }
    },

    'bypass-hotspot-ip-binding': {
      title: 'Bypass Hotspot IP Binding',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-unlock"></i> Device Bypass</div>
            <div class="form-group">
              <label class="form-label">Device MAC Address</label>
              <input class="form-control form-control-mono" id="ft_mac" value="A4:C3:F0:12:34:56">
            </div>
            <div class="form-group">
              <label class="form-label">Assigned IP (Optional)</label>
              <input class="form-control form-control-mono" id="ft_ip" value="10.5.50.25">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Comment</label>
              <input class="form-control" id="ft_comment" value="CCTV / Printer Bypass">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const mac = v.mac || '00:00:00:00:00:00';
        const ip = v.ip ? ` address=${v.ip}` : '';
        const c = v.comment ? ` comment="${v.comment}"` : '';
        return banner('Bypass Hotspot Login (IP Binding)', ros) +
          `/ip hotspot ip-binding add mac-address=${mac}${ip} type=bypassed${c}\n` +
          `:put "Device [${mac}] is now bypassed from hotspot captive portal."\n`;
      }
    },

    'change-mac-address': {
      title: 'Change MAC Address',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-pen-to-square"></i> MAC Cloning</div>
            <div class="form-group">
              <label class="form-label">Interface</label>
              <input class="form-control form-control-mono" id="ft_iface" value="ether1">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">New MAC Address</label>
              <input class="form-control form-control-mono" id="ft_mac" value="00:1A:2B:3C:4D:5E">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        return banner('Change Interface MAC Address', ros) +
          `/interface ethernet set [find name="${v.iface || 'ether1'}"] mac-address=${v.mac || '00:11:22:33:44:55'}\n` +
          `:put "MAC address for ${v.iface} updated."\n`;
      }
    },

    'clear-hotspot-cookies': {
      title: 'Clear Hotspot Cookies',
      renderForm: function() {
        return `<div class="config-section"><p style="font-size:12px;color:var(--text-secondary)">Menghapus semua cookie sesi aktif hotspot untuk memaksa user login ulang.</p></div>`;
      },
      generate: function(v, ros) {
        return banner('Clear Hotspot Cookies', ros) +
          `/ip hotspot cookie remove [find]\n` +
          `:put "All hotspot active cookies have been purged."\n`;
      }
    },

    'clear-dns-flush': {
      title: 'Clear DNS Flush',
      renderForm: function() {
        return `<div class="config-section"><p style="font-size:12px;color:var(--text-secondary)">Membersihkan seluruh DNS resolver cache di MikroTik.</p></div>`;
      },
      generate: function(v, ros) {
        return banner('DNS Cache Flush', ros) +
          `/ip dns cache flush\n` +
          `:put "MikroTik DNS cache successfully cleared."\n`;
      }
    },

    'clear-log-terminal': {
      title: 'Clear Log Terminal',
      renderForm: function() {
        return `<div class="config-section"><p style="font-size:12px;color:var(--text-secondary)">Mereset buffer log memori di terminal MikroTik.</p></div>`;
      },
      generate: function(v, ros) {
        return banner('Clear Memory Log Buffer', ros) +
          `/system logging action set memory memory-lines=1\n` +
          `/system logging action set memory memory-lines=1000\n` +
          `:put "Memory log buffer flushed."\n`;
      }
    },

    'dns-settings': {
      title: 'DNS Settings',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-dns"></i> Resolver Config</div>
            <div class="form-group">
              <label class="form-label">Primary & Secondary DNS</label>
              <input class="form-control form-control-mono" id="ft_dns" value="1.1.1.1,8.8.8.8,1.0.0.1,8.8.4.4">
            </div>
            <label class="form-check mb-0"><input type="checkbox" id="ft_remote" checked> Allow Remote Requests</label>
          </div>
        `;
      },
      generate: function(v, ros) {
        const rem = v.remote ? 'yes' : 'no';
        return banner('Configure DNS Resolvers', ros) +
          `/ip dns set servers=${v.dns || '1.1.1.1,8.8.8.8'} allow-remote-requests=${rem} max-udp-packet-size=4096 cache-size=10240KiB\n` +
          `/ip dns cache flush\n` +
          `:put "DNS resolvers updated."\n`;
      }
    },

    'drop-invalid-packets': {
      title: 'Drop Invalid Packets',
      renderForm: function() {
        return `<div class="config-section"><p style="font-size:12px;color:var(--text-secondary)">Membuang seluruh paket status 'invalid' di chain input & forward demi stabilitas koneksi.</p></div>`;
      },
      generate: function(v, ros) {
        return banner('Drop Invalid Packets (State Filter)', ros) +
          `/ip firewall filter\n` +
          `add chain=input connection-state=invalid action=drop comment="Drop Invalid Input Packets"\n` +
          `add chain=forward connection-state=invalid action=drop comment="Drop Invalid Forward Packets"\n` +
          `:put "Invalid packet drop filter added."\n`;
      }
    },

    'drop-traceroute': {
      title: 'Drop Traceroute',
      renderForm: function() {
        return `<div class="config-section"><p style="font-size:12px;color:var(--text-secondary)">Menyembunyikan router dari jejak traceroute publik.</p></div>`;
      },
      generate: function(v, ros) {
        return banner('Drop Traceroute Probes', ros) +
          `/ip firewall filter\n` +
          `add chain=input protocol=icmp icmp-options=11:0 action=drop comment="Drop ICMP Time-Exceeded (Hide Traceroute)"\n` +
          `add chain=input protocol=udp dst-port=33434-33534 action=drop comment="Drop UDP Traceroute Probes"\n` +
          `:put "Traceroute hiding rules installed."\n`;
      }
    },

    'enable-fasttrack': {
      title: 'Enable Fasttrack',
      renderForm: function() {
        return `<div class="config-section"><p style="font-size:12px;color:var(--text-secondary)">Mempercepat throughput TCP/UDP dengan mem-bypass CPU packet processing untuk established/related traffic.</p></div>`;
      },
      generate: function(v, ros) {
        return banner('Enable Fasttrack Connection', ros) +
          `/ip firewall filter\n` +
          `add chain=forward action=fasttrack-connection connection-state=established,related comment="FastTrack Established/Related"\n` +
          `add chain=forward action=accept connection-state=established,related comment="Accept Established/Related"\n` +
          `:put "FastTrack acceleration enabled."\n`;
      }
    },

    'generate-vouchers': {
      title: 'Generate Vouchers',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-ticket"></i> Voucher Bulk Generator</div>
            <div class="form-group">
              <label class="form-label">User Prefix</label>
              <input class="form-control form-control-mono" id="ft_prefix" value="USER_">
            </div>
            <div class="form-group">
              <label class="form-label">Jumlah Voucher</label>
              <input class="form-control form-control-mono" id="ft_qty" value="5" type="number" min="1" max="50">
            </div>
            <div class="form-group">
              <label class="form-label">User Profile</label>
              <input class="form-control form-control-mono" id="ft_prof" value="default">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Limit Uptime</label>
              <input class="form-control form-control-mono" id="ft_uptime" value="2h">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const qty = parseInt(v.qty) || 5;
        const prefix = v.prefix || 'VIP';
        const prof = v.prof || 'default';
        const ut = v.uptime || '2h';
        let lines = banner(`Generate ${qty} Hotspot Vouchers`, ros);
        lines += '/ip hotspot user\n';
        for (let i = 1; i <= qty; i++) {
          const pass = Math.random().toString(36).substring(2, 6).toUpperCase();
          lines += `add name="${prefix}${i}" password="${pass}" profile="${prof}" limit-uptime=${ut} comment="Voucher ${i}"\n`;
        }
        lines += `:put "${qty} vouchers successfully generated."\n`;
        return lines;
      }
    },

    'hotspot-ip-binding-mac': {
      title: 'Hotspot IP Binding (MAC)',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-link"></i> IP Binding</div>
            <div class="form-group">
              <label class="form-label">MAC Address</label>
              <input class="form-control form-control-mono" id="ft_mac" value="B8:27:EB:01:02:03">
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select class="form-control" id="ft_type">
                <option value="bypassed" selected>bypassed (Tanpa Login)</option>
                <option value="regular">regular (Wajib Login)</option>
                <option value="blocked">blocked (Blokir Total)</option>
              </select>
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        return banner('Hotspot IP Binding Rule', ros) +
          `/ip hotspot ip-binding add mac-address=${v.mac || '00:00:00:00:00:00'} type=${v.type || 'bypassed'} comment="Binding via ComitTools PRO"\n` +
          `:put "IP binding created."\n`;
      }
    },

    'ip-service-control': {
      title: 'IP Service Control',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-gears"></i> Service Lockdown</div>
            <div class="form-group">
              <label class="form-label">Winbox Custom Port</label>
              <input class="form-control form-control-mono" id="ft_wbport" value="8291">
            </div>
            <div class="form-group">
              <label class="form-label">SSH Custom Port</label>
              <input class="form-control form-control-mono" id="ft_sshport" value="2222">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Restrict Winbox/SSH to Subnet</label>
              <input class="form-control form-control-mono" id="ft_restrict" placeholder="e.g. 192.168.88.0/24 or leave blank" value="">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const wb = v.wbport || '8291';
        const ssh = v.sshport || '2222';
        const res = v.restrict ? ` address=${v.restrict}` : '';
        return banner('IP Service Port & Access Lockdown', ros) +
          `/ip service set winbox port=${wb}${res}\n` +
          `/ip service set ssh port=${ssh}${res}\n` +
          `/ip service set api disabled=yes\n` +
          `/ip service set telnet disabled=yes\n` +
          `/ip service set ftp disabled=yes\n` +
          `:put "Services secured."\n`;
      }
    },

    'interface-name-to-default': {
      title: 'Interface Name to Default',
      renderForm: function() {
        return `<div class="config-section"><p style="font-size:12px;color:var(--text-secondary)">Mengembalikan nama interface port ethernet router ke nama asli bawaan pabrik (ether1, ether2, ...).</p></div>`;
      },
      generate: function(v, ros) {
        return banner('Reset Interface Names to Factory Default', ros) +
          `:for i from=1 to=24 do={\n` +
          `  :do { /interface ethernet set [find default-name=("ether" . $i)] name=("ether" . $i) } on-error={}\n` +
          `}\n` +
          `:put "Interface names restored to default (ether1-ether24)."\n`;
      }
    },

    'ping-tool': {
      title: 'Ping Tool Script',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-satellite-dish"></i> Target Host</div>
            <div class="form-group">
              <label class="form-label">Host / IP to Ping</label>
              <input class="form-control form-control-mono" id="ft_host" value="8.8.8.8">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Count</label>
              <input class="form-control form-control-mono" id="ft_count" value="5">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        return banner('Diagnostic Ping Script', ros) +
          `/ping ${v.host || '8.8.8.8'} count=${v.count || '5'}\n`;
      }
    },

    'port-forward': {
      title: 'Port Forward (DST-NAT)',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-arrows-split-up-and-left"></i> Port Forward Parameters</div>
            <div class="form-group">
              <label class="form-label">WAN Interface</label>
              <input class="form-control form-control-mono" id="ft_wan" value="ether1">
            </div>
            <div class="form-group">
              <label class="form-label">External WAN Port</label>
              <input class="form-control form-control-mono" id="ft_wanport" value="8080">
            </div>
            <div class="form-group">
              <label class="form-label">Internal Destination IP</label>
              <input class="form-control form-control-mono" id="ft_lanip" value="192.168.88.50">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Internal Destination Port</label>
              <input class="form-control form-control-mono" id="ft_lanport" value="80">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const wan = v.wan || 'ether1';
        const wp = v.wanport || '8080';
        const lip = v.lanip || '192.168.88.50';
        const lp = v.lanport || '80';
        return banner('Port Forwarding (DST-NAT & Forward Filter)', ros) +
          `/ip firewall nat add chain=dstnat in-interface=${wan} protocol=tcp dst-port=${wp} action=dst-nat to-addresses=${lip} to-ports=${lp} comment="Port Forward ${wp}->${lp}"\n` +
          `/ip firewall filter add chain=forward protocol=tcp dst-port=${lp} dst-address=${lip} action=accept comment="Allow Port Forward ${lp}"\n` +
          `:put "Port forwarding rule created: WAN:${wp} -> ${lip}:${lp}."\n`;
      }
    },

    'protect-btest-server': {
      title: 'Protect Btest Server',
      renderForm: function() {
        return `<div class="config-section"><p style="font-size:12px;color:var(--text-secondary)">Menonaktifkan / membatasi Bandwidth Test Server agar tidak disalahgunakan untuk menghabiskan CPU dan bandwidth router.</p></div>`;
      },
      generate: function(v, ros) {
        return banner('Protect / Disable Bandwidth Test Server', ros) +
          `/tool bandwidth-server set enabled=no authenticate=yes\n` +
          `:put "Bandwidth-test server disabled to save router resources."\n`;
      }
    },

    'ppp-secret': {
      title: 'PPP Secret (PPPoE / VPN User)',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-key"></i> User Credentials</div>
            <div class="form-group">
              <label class="form-label">Username</label>
              <input class="form-control form-control-mono" id="ft_user" value="user_pppoe1">
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input class="form-control form-control-mono" id="ft_pass" value="Pass@123">
            </div>
            <div class="form-group">
              <label class="form-label">Service</label>
              <select class="form-control" id="ft_service">
                <option value="pppoe" selected>pppoe</option>
                <option value="l2tp">l2tp</option>
                <option value="ovpn">ovpn</option>
                <option value="any">any</option>
              </select>
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Profile</label>
              <input class="form-control form-control-mono" id="ft_profile" value="default">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        return banner('Add PPP User Secret', ros) +
          `/ppp secret add name="${v.user || 'user1'}" password="${v.pass || 'pass1'}" service=${v.service || 'pppoe'} profile="${v.profile || 'default'}" comment="Created via ComitTools PRO"\n` +
          `:put "PPP secret for [${v.user}] created."\n`;
      }
    },

    'protect-mac-server': {
      title: 'Protect Mac Server',
      renderForm: function() {
        return `<div class="config-section"><p style="font-size:12px;color:var(--text-secondary)">Mematikan MAC-Telnet dan MAC-Winbox di semua interface publik agar router tidak terdeteksi via broadcast Layer 2.</p></div>`;
      },
      generate: function(v, ros) {
        return banner('Lock Down MAC Server (Disable on WAN)', ros) +
          `/tool mac-server set allowed-interface-list=none\n` +
          `/tool mac-server mac-winbox set allowed-interface-list=none\n` +
          `:put "MAC Server restricted. Access via IP address only."\n`;
      }
    },

    'protect-neighbors-discovery': {
      title: 'Protect Neighbors Discovery',
      renderForm: function() {
        return `<div class="config-section"><p style="font-size:12px;color:var(--text-secondary)">Mematikan MNDP/CDP/LLDP (Neighbor Discovery) di interface WAN agar identitas router tidak bocor ke ISP/Internet.</p></div>`;
      },
      generate: function(v, ros) {
        return banner('Protect Neighbors Discovery Protocol', ros) +
          `/ip neighbor discovery-settings set discover-interface-list=none\n` +
          `:put "Neighbor discovery broadcasting disabled."\n`;
      }
    },

    'remove-all-firewall': {
      title: 'Remove All Firewall',
      renderForm: function() {
        return `<div class="config-section warning-box"><i class="fa-solid fa-triangle-exclamation"></i> Menghapus SEMUA rule filter, NAT, mangle, raw, dan address-list firewall. Gunakan hati-hati!</div>`;
      },
      generate: function(v, ros) {
        return banner('Remove All Firewall Rules (CLEAN RESET)', ros) +
          `/ip firewall filter remove [find]\n` +
          `/ip firewall nat remove [find]\n` +
          `/ip firewall mangle remove [find]\n` +
          `:do { /ip firewall raw remove [find] } on-error={}\n` +
          `/ip firewall address-list remove [find]\n` +
          `:put "All firewall rules have been cleared."\n`;
      }
    },

    'remove-all-queue': {
      title: 'Remove All Queue',
      renderForm: function() {
        return `<div class="config-section warning-box"><i class="fa-solid fa-triangle-exclamation"></i> Menghapus seluruh Simple Queue dan Queue Tree di router.</div>`;
      },
      generate: function(v, ros) {
        return banner('Remove All Queues', ros) +
          `/queue simple remove [find]\n` +
          `/queue tree remove [find]\n` +
          `:put "All simple queues and queue trees removed."\n`;
      }
    },

    'remove-arp-table': {
      title: 'Remove ARP Table',
      renderForm: function() {
        return `<div class="config-section"><p style="font-size:12px;color:var(--text-secondary)">Membersihkan tabel ARP dynamic untuk menyegarkan cache mapping MAC-IP client.</p></div>`;
      },
      generate: function(v, ros) {
        return banner('Clear Dynamic ARP Table', ros) +
          `/ip arp remove [find dynamic=yes]\n` +
          `:put "Dynamic ARP entries cleared."\n`;
      }
    },

    'remove-dhcp-server-client': {
      title: 'Remove DHCP Server & Client',
      renderForm: function() {
        return `<div class="config-section warning-box"><i class="fa-solid fa-triangle-exclamation"></i> Menghapus semua DHCP Server, network, lease, dan DHCP Client di router.</div>`;
      },
      generate: function(v, ros) {
        return banner('Remove DHCP Server & Client', ros) +
          `/ip dhcp-server remove [find]\n` +
          `/ip dhcp-server network remove [find]\n` +
          `/ip dhcp-client remove [find]\n` +
          `:put "DHCP servers and clients removed."\n`;
      }
    },

    'remove-dns': {
      title: 'Remove DNS',
      renderForm: function() {
        return `<div class="config-section"><p style="font-size:12px;color:var(--text-secondary)">Mereset setting DNS dan menghapus semua static DNS entries.</p></div>`;
      },
      generate: function(v, ros) {
        return banner('Reset DNS Configuration', ros) +
          `/ip dns static remove [find]\n` +
          `/ip dns set servers="" allow-remote-requests=no\n` +
          `/ip dns cache flush\n` +
          `:put "DNS configuration reset."\n`;
      }
    },

    'remove-all-hotspot': {
      title: 'Remove All Hotspot',
      renderForm: function() {
        return `<div class="config-section warning-box"><i class="fa-solid fa-triangle-exclamation"></i> Menghapus total konfigurasi Hotspot: server, profile, user, walled-garden, ip-binding.</div>`;
      },
      generate: function(v, ros) {
        return banner('Remove All Hotspot Components', ros) +
          `/ip hotspot user remove [find name!="default-trial"]\n` +
          `/ip hotspot active remove [find]\n` +
          `/ip hotspot host remove [find]\n` +
          `/ip hotspot ip-binding remove [find]\n` +
          `/ip hotspot walled-garden remove [find]\n` +
          `/ip hotspot walled-garden ip remove [find]\n` +
          `/ip hotspot remove [find]\n` +
          `/ip hotspot profile remove [find name!="default"]\n` +
          `/ip hotspot user profile remove [find name!="default"]\n` +
          `:put "Hotspot configuration completely purged."\n`;
      }
    },

    'remove-all-ip-address': {
      title: 'Remove All IP Address',
      renderForm: function() {
        return `<div class="config-section warning-box"><i class="fa-solid fa-triangle-exclamation"></i> Menghapus semua IP Address di semua interface. Pastikan Anda terkoneksi via MAC Winbox!</div>`;
      },
      generate: function(v, ros) {
        return banner('Remove All IP Addresses (WARNING: Connect via MAC Winbox!)', ros) +
          `/ip address remove [find]\n` +
          `:put "All IP addresses removed."\n`;
      }
    },

    'remove-all-ip-pool': {
      title: 'Remove All IP Pool',
      renderForm: function() {
        return `<div class="config-section"><p style="font-size:12px;color:var(--text-secondary)">Menghapus seluruh IP Pool di menu /ip pool.</p></div>`;
      },
      generate: function(v, ros) {
        return banner('Remove All IP Pools', ros) +
          `/ip pool remove [find]\n` +
          `:put "All IP pools cleared."\n`;
      }
    },

    'remove-interface-bridge': {
      title: 'Remove Interface & Bridge',
      renderForm: function() {
        return `<div class="config-section warning-box"><i class="fa-solid fa-triangle-exclamation"></i> Menghapus semua bridge ports dan interface bridge.</div>`;
      },
      generate: function(v, ros) {
        return banner('Remove Bridges and Bridge Ports', ros) +
          `/interface bridge port remove [find]\n` +
          `/interface bridge remove [find]\n` +
          `:put "Bridges and ports removed."\n`;
      }
    },

    'remove-all-ppp': {
      title: 'Remove All PPP',
      renderForm: function() {
        return `<div class="config-section"><p style="font-size:12px;color:var(--text-secondary)">Menghapus semua koneksi PPP aktif, PPP secrets, dan profil.</p></div>`;
      },
      generate: function(v, ros) {
        return banner('Remove All PPP Connections and Secrets', ros) +
          `/ppp active remove [find]\n` +
          `/ppp secret remove [find]\n` +
          `:put "All PPP entries cleared."\n`;
      }
    },

    'remove-all-routing': {
      title: 'Remove All Routing',
      renderForm: function() {
        return `<div class="config-section warning-box"><i class="fa-solid fa-triangle-exclamation"></i> Menghapus seluruh rute statis di /ip route.</div>`;
      },
      generate: function(v, ros) {
        return banner('Remove All Static Routes', ros) +
          `/ip route remove [find static=yes]\n` +
          `:put "All static routes removed."\n`;
      }
    },

    'reset-all-counters': {
      title: 'Reset All Counters',
      renderForm: function() {
        return `<div class="config-section"><p style="font-size:12px;color:var(--text-secondary)">Mereset semua statistik penghitung paket di Firewall, NAT, Mangle, dan Queue.</p></div>`;
      },
      generate: function(v, ros) {
        return banner('Reset All Packet & Byte Counters', ros) +
          `/ip firewall filter reset-counters-all\n` +
          `/ip firewall nat reset-counters-all\n` +
          `/ip firewall mangle reset-counters-all\n` +
          `/queue simple reset-counters-all\n` +
          `:put "All packet/byte counters reset to zero."\n`;
      }
    },

    'reset-mac-all-interfaces': {
      title: 'Reset MAC All Interfaces',
      renderForm: function() {
        return `<div class="config-section"><p style="font-size:12px;color:var(--text-secondary)">Mengembalikan MAC address semua interface fisik ethernet ke MAC bawaan pabrik.</p></div>`;
      },
      generate: function(v, ros) {
        return banner('Reset MAC Addresses to Factory Default', ros) +
          `/interface ethernet reset-mac-address [find]\n` +
          `:put "Ethernet interfaces MAC restored to factory default."\n`;
      }
    },

    'set-identity-router': {
      title: 'Set Identity Router',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-tag"></i> Router Identity</div>
            <div class="form-group mb-0">
              <label class="form-label">Nama Router Identity</label>
              <input class="form-control form-control-mono" id="ft_identity" value="ComitTools-Router">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const id = v.identity || 'MikroTik-PRO';
        return banner('Set Router Identity', ros) +
          `/system identity set name="${id}"\n` +
          `:put "Router identity changed to: ${id}."\n`;
      }
    },

    'setup-ntp-client': {
      title: 'Setup NTP Client',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-clock"></i> Network Time Protocol</div>
            <div class="form-group">
              <label class="form-label">NTP Server Host / IP</label>
              <input class="form-control form-control-mono" id="ft_ntp" value="id.pool.ntp.org,time.google.com">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Timezone</label>
              <input class="form-control form-control-mono" id="ft_tz" value="Asia/Jakarta">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const ntp = v.ntp || 'id.pool.ntp.org';
        const tz = v.tz || 'Asia/Jakarta';
        const isV7 = ros === 'v7';
        let cmd = '';
        if (isV7) {
          cmd = `/system ntp client set enabled=yes servers="${ntp}"\n`;
        } else {
          cmd = `/system ntp client set enabled=yes primary-ntp=162.159.200.1 secondary-ntp=216.239.35.0\n`;
        }
        cmd += `/system clock set time-zone-name="${tz}"\n`;
        return banner('Setup NTP Client & Timezone', ros) + cmd +
          `:put "NTP Client configured with timezone [${tz}]."\n`;
      }
    },

    'setup-romon': {
      title: 'Setup RoMON',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-network-wired"></i> Router Management Overlay Network</div>
            <div class="form-group mb-0">
              <label class="form-label">RoMON Secret (Optional)</label>
              <input class="form-control form-control-mono" id="ft_secret" placeholder="Enter RoMON secret or leave blank">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const s = v.secret ? ` secrets="${v.secret}"` : '';
        return banner('Setup RoMON (Router Management Overlay Network)', ros) +
          `/tool romon set enabled=yes${s}\n` +
          `:put "RoMON enabled. You can now discover routers behind other MikroTik devices."\n`;
      }
    },

    'shutdown-reset-reboot': {
      title: 'Shutdown / Reset / Reboot',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-power-off"></i> System Action</div>
            <select class="form-control" id="ft_action">
              <option value="reboot" selected>Reboot Router</option>
              <option value="shutdown">Shutdown Router</option>
              <option value="reset-keep">Reset Configuration (Keep User & Password)</option>
              <option value="reset-clean">Reset Configuration (Complete Factory Wipe)</option>
            </select>
          </div>
        `;
      },
      generate: function(v, ros) {
        const act = v.action || 'reboot';
        let cmd = '/system reboot\n';
        if (act === 'shutdown') cmd = '/system shutdown\n';
        if (act === 'reset-keep') cmd = '/system reset-configuration keep-users=yes no-defaults=yes\n';
        if (act === 'reset-clean') cmd = '/system reset-configuration no-defaults=yes skip-backup=yes\n';
        return banner(`System ${act.toUpperCase()}`, ros) + cmd;
      }
    },

    'system-note-terminal': {
      title: 'System Note Terminal',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-message"></i> Welcome Banner</div>
            <div class="form-group mb-0">
              <label class="form-label">Note Message</label>
              <textarea class="form-control form-control-mono" id="ft_note" style="min-height:90px">╔════════════════════════════════════════════════════════════════╗
  AUTHORIZED ACCESS ONLY - ComitTools PRO Management
  Contact: WhatsApp +62 851-6138-6700 | admin@comit.id
╚════════════════════════════════════════════════════════════════╝</textarea>
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const note = v.note || 'ComitTools PRO Managed Router';
        return banner('System Note Terminal Banner', ros) +
          `/system note set show-at-login=yes note="${note.replace(/"/g, '\\"')}"\n` +
          `:put "Terminal welcome note applied."\n`;
      }
    },

    'traceroutetool': {
      title: 'TracerouteTool',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-route"></i> Route Diagnostics</div>
            <div class="form-group">
              <label class="form-label">Target Host</label>
              <input class="form-control form-control-mono" id="ft_host" value="1.1.1.1">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Max Hops</label>
              <input class="form-control form-control-mono" id="ft_hops" value="30">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        return banner('Traceroute Diagnostic Tool', ros) +
          `/tool traceroute ${v.host || '1.1.1.1'} max-hops=${v.hops || '30'}\n`;
      }
    },

    'walled-garden': {
      title: 'Walled Garden (Free Sites Before Login)',
      renderForm: function() {
        return `
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-shield-cat"></i> Walled Garden Domains</div>
            <div class="form-group">
              <label class="form-label">Domain 1</label>
              <input class="form-control form-control-mono" id="ft_d1" value="*.bankmandiri.co.id">
            </div>
            <div class="form-group">
              <label class="form-label">Domain 2</label>
              <input class="form-control form-control-mono" id="ft_d2" value="*.bca.co.id">
            </div>
            <div class="form-group">
              <label class="form-label">Domain 3</label>
              <input class="form-control form-control-mono" id="ft_d3" value="*.midtrans.com">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Domain 4</label>
              <input class="form-control form-control-mono" id="ft_d4" value="*.tripay.co.id">
            </div>
          </div>
        `;
      },
      generate: function(v, ros) {
        const ds = [v.d1, v.d2, v.d3, v.d4].filter(Boolean);
        let lines = banner('Hotspot Walled Garden Entries', ros) + '/ip hotspot walled-garden\n';
        ds.forEach(d => {
          lines += `add dst-host="${d}" action=allow comment="Payment Gateway"\n`;
        });
        lines += ':put "Walled garden rules added."\n';
        return lines;
      }
    }
  };

  // Build the complete interactive modal body for any fast tool
  function getModalHTML(toolKey) {
    const t = tools[toolKey];
    if (!t) return `<div style="padding:40px;text-align:center;color:var(--text-muted)">Tool [${toolKey}] not found.</div>`;

    const defaultForm = t.renderForm({});

    return `
      <div class="fast-gen-container">
        <!-- Controls Column -->
        <div class="fast-gen-controls">
          <div class="info-box">
            <i class="fa-solid fa-circle-check"></i>
            <div>
              <b style="color:#fff">${t.title}</b>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Konfigurasi opsi lalu klik <b>Generate</b> untuk menghasilkan script RouterOS siap pakai.</div>
            </div>
          </div>

          <!-- RouterOS Version Selector -->
          <div class="config-section">
            <div class="config-section-title"><i class="fa-solid fa-microchip"></i> RouterOS Target</div>
            <div style="display:flex;gap:8px">
              <label class="form-check" style="flex:1;background:rgba(56,189,248,0.06);border:1px solid rgba(56,189,248,0.2);border-radius:8px;padding:8px 12px;cursor:pointer">
                <input type="radio" name="ft_ros" value="v6" onchange="FastTools.triggerGen('${toolKey}')"> <span>v6.x</span>
              </label>
              <label class="form-check" style="flex:1;background:rgba(63,211,192,0.06);border:1px solid rgba(63,211,192,0.2);border-radius:8px;padding:8px 12px;cursor:pointer">
                <input type="radio" name="ft_ros" value="v7" checked onchange="FastTools.triggerGen('${toolKey}')"> <span>v7.x</span>
              </label>
            </div>
          </div>

          <!-- Custom Inputs for this tool -->
          <div id="ft_form_fields">
            ${defaultForm}
          </div>

          <button class="btn btn-primary btn-lg btn-full" onclick="FastTools.triggerGen('${toolKey}')">
            <i class="fa-solid fa-bolt"></i> Generate Script
          </button>
        </div>

        <!-- Output Column -->
        <div class="fast-gen-output-pane">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div style="font-size:13px;font-weight:600;color:var(--text-secondary)">
              <i class="fa-solid fa-terminal text-orange"></i> MikroTik Script Output
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-secondary btn-sm" onclick="copyOutput('ft_output')">
                <i class="fa-solid fa-copy"></i> Copy
              </button>
              <button class="btn btn-secondary btn-sm" onclick="downloadOutput('ft_output', '${toolKey}.rsc')">
                <i class="fa-solid fa-download"></i> .rsc
              </button>
              <button class="btn btn-teal btn-sm" onclick="FastTools.triggerGen('${toolKey}')">
                <i class="fa-solid fa-rotate"></i> Refresh
              </button>
            </div>
          </div>

          <div class="terminal-header" style="margin-top:4px">
            <div class="terminal-dots">
              <div class="terminal-dot red"></div>
              <div class="terminal-dot yellow"></div>
              <div class="terminal-dot green"></div>
            </div>
            <div class="terminal-filename">
              <i class="fa-solid fa-terminal"></i> ${toolKey}.rsc
            </div>
            <div style="font-size:10px;color:var(--text-muted)">Auto-Format</div>
          </div>

          <textarea class="terminal-output" id="ft_output" style="flex:1;border:1px solid var(--border-color);border-top:none;border-radius:0 0 var(--radius-md) var(--radius-md)" readonly></textarea>
        </div>
      </div>
    `;
  }

  // Collect form values and run the generator
  function triggerGen(toolKey) {
    const t = tools[toolKey];
    if (!t) return;

    // Subscription & Paywall Guard
    if (typeof Auth !== 'undefined' && Auth.canAccessTool) {
      const access = Auth.canAccessTool(toolKey);
      if (!access.allowed) {
        if (typeof showPaywallModal === 'function') {
          showPaywallModal(toolKey, t.title, access);
        }
        const out = document.getElementById('ft_output');
        if (out) {
          out.textContent = '# ================================================================\n# COMITTOOLS PRO - ACCESS RESTRICTED\n# ' + (access.message || 'Fitur ini memerlukan langganan paket aktif.') + '\n# Silakan SUBSCRIBE untuk membuka akses fitur ini.\n# ================================================================';
        }
        return;
      }
    }

    const ros = document.querySelector('input[name="ft_ros"]:checked')?.value || 'v7';
    const values = {};

    // Collect all inputs inside the modal
    const inputs = document.querySelectorAll('#ft_form_fields input, #ft_form_fields select, #ft_form_fields textarea');
    inputs.forEach(inp => {
      const id = inp.id.replace('ft_', '');
      if (inp.type === 'checkbox') {
        values[id] = inp.checked;
      } else {
        values[id] = inp.value;
      }
    });

    try {
      const script = t.generate(values, ros);
      const out = document.getElementById('ft_output');
      if (out) out.value = script;
      showToast(`✅ Script [${t.title}] berhasil digenerate!`, 'success');
    } catch(err) {
      const out = document.getElementById('ft_output');
      if (out) out.value = `# Error generating script: ${err.message}`;
      showToast('❌ Error: ' + err.message, 'error');
    }
  }

  return {
    tools,
    getModalHTML,
    triggerGen
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FastTools };
}
