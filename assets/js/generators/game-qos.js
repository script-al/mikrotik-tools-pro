/**
 * Online Game QoS Priority Generator
 * Generates MikroTik RouterOS mangle + queue tree rules for gaming QoS
 *
 * Supported Games:
 *   MLBB, PUBG Mobile, Free Fire, Valorant, Point Blank, Genshin Impact,
 *   CODM, Roblox, Dota2, Ragnarok, AOV (Arena of Valor)
 *
 * Options:
 *   - Include streaming (YouTube, Netflix) separation
 *   - Client isolation per SSID
 *
 * @module game-qos
 */

'use strict';

// ---------------------------------------------------------------------------
// Game Port Definitions
// ---------------------------------------------------------------------------

/**
 * Known game server port definitions.
 * Format: { udp: [...], tcp: [...], dst_hosts: [...] }
 */
const GAME_PORTS = {
  mlbb: {
    name:    'Mobile Legends: Bang Bang',
    udp:     [5000, 5003, 5004, 5005, 10012],
    tcp:     [443, 8080, 9999, 10012],
    comment: 'MLBB',
  },
  pubgm: {
    name:    'PUBG Mobile',
    udp:     [10006, 17000, 20001],
    tcp:     [443, 7086, 10000, 10001, 10006],
    comment: 'PUBG Mobile',
  },
  freefire: {
    name:    'Free Fire',
    udp:     [10011, 10012, 10020],
    tcp:     [443, 9090, 9100, 9200],
    comment: 'Free Fire',
  },
  valorant: {
    name:    'Valorant',
    udp:     [7000, 7500, 8088, 8089],
    tcp:     [443, 2099, 5222, 8088],
    comment: 'Valorant',
  },
  pointblank: {
    name:    'Point Blank',
    udp:     [6000, 6001, 6002],
    tcp:     [443, 6000, 7777, 9001],
    comment: 'Point Blank',
  },
  genshin: {
    name:    'Genshin Impact',
    udp:     [22101, 22102],
    tcp:     [443, 22101, 22102, 22301],
    comment: 'Genshin Impact',
  },
  codm: {
    name:    'Call of Duty Mobile',
    udp:     [7002, 7003, 7500, 9305, 10001],
    tcp:     [443, 7002, 9305, 10000],
    comment: 'CODM',
  },
  roblox: {
    name:    'Roblox',
    udp:     [49152, 65535],   // range
    tcp:     [443, 3074, 3075],
    comment: 'Roblox',
    udp_range: true,           // indicates single port range entry
  },
  dota2: {
    name:    'Dota 2',
    udp:     [27000, 27015, 27030, 27031, 27036],
    tcp:     [443, 27015, 27017, 27019, 27021],
    comment: 'Dota2',
  },
  ragnarok: {
    name:    'Ragnarok Online',
    udp:     [5000, 6900, 6901],
    tcp:     [6900, 6901, 5121],
    comment: 'Ragnarok',
  },
  aov: {
    name:    'Arena of Valor (AOV)',
    udp:     [10000, 10010, 10020],
    tcp:     [443, 8080, 10010, 10020, 18888],
    comment: 'AOV',
  },
};

/**
 * Streaming service port definitions.
 */
const STREAMING_PORTS = {
  youtube: {
    name:    'YouTube',
    tcp:     [443, 80, 8080],
    comment: 'YouTube',
  },
  netflix: {
    name:    'Netflix',
    tcp:     [443, 80],
    comment: 'Netflix',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format port list for MikroTik dst-port parameter.
 * @param {number[]} ports
 * @param {boolean} isRange - true if first two elements are a range
 * @returns {string}
 */
function fmtPorts(ports, isRange) {
  if (!ports || ports.length === 0) return '';
  if (isRange) return `${ports[0]}-${ports[1]}`;
  return ports.join(',');
}

/**
 * Sanitize game key to use as mark name.
 * @param {string} key
 * @returns {string}
 */
function markName(key) {
  return key.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
}

// ---------------------------------------------------------------------------
// Mangle Builder
// ---------------------------------------------------------------------------

/**
 * Build mangle rules for a single game.
 * @param {string} key      - Game key (e.g. 'mlbb')
 * @param {Object} game     - Game definition
 * @param {number} priority - Queue priority
 * @returns {string[]} Lines
 */
function buildGameMangleRules(key, game, priority) {
  const mark   = `game_${markName(key)}`;
  const connMk = `conn_${markName(key)}`;
  const lines  = [`# --- ${game.name} ---`];

  // UDP rules
  if (game.udp && game.udp.length > 0) {
    const udpPorts = fmtPorts(game.udp, game.udp_range);
    lines.push(
      `add action=mark-connection chain=prerouting protocol=udp dst-port=${udpPorts} \\`,
      `    new-connection-mark=${connMk} passthrough=yes comment="${game.comment} UDP Conn"`,
      `add action=mark-packet chain=prerouting protocol=udp connection-mark=${connMk} \\`,
      `    new-packet-mark=${mark} passthrough=no comment="${game.comment} UDP Packet"`,
    );
  }

  // TCP rules
  if (game.tcp && game.tcp.length > 0) {
    const tcpPorts = fmtPorts(game.tcp);
    lines.push(
      `add action=mark-connection chain=prerouting protocol=tcp dst-port=${tcpPorts} \\`,
      `    new-connection-mark=${connMk} passthrough=yes comment="${game.comment} TCP Conn"`,
      `add action=mark-packet chain=prerouting protocol=tcp connection-mark=${connMk} \\`,
      `    new-packet-mark=${mark} passthrough=no comment="${game.comment} TCP Packet"`,
    );
  }

  lines.push('');
  return lines;
}

/**
 * Build mangle rules for streaming services.
 * @returns {string[]}
 */
function buildStreamingMangleRules() {
  const lines = [`# --- Streaming Services ---`];

  Object.entries(STREAMING_PORTS).forEach(([key, svc]) => {
    const mark   = `stream_${markName(key)}`;
    const connMk = `conn_stream_${markName(key)}`;
    const ports  = fmtPorts(svc.tcp);

    lines.push(
      `add action=mark-connection chain=prerouting protocol=tcp dst-port=${ports} \\`,
      `    new-connection-mark=${connMk} passthrough=yes comment="${svc.comment} Conn"`,
      `add action=mark-packet chain=prerouting protocol=tcp connection-mark=${connMk} \\`,
      `    new-packet-mark=${mark} passthrough=no comment="${svc.comment} Packet"`,
    );
  });

  lines.push('');
  return lines;
}

// ---------------------------------------------------------------------------
// Queue Tree Builder
// ---------------------------------------------------------------------------

/**
 * Build queue tree for gaming QoS.
 * @param {string[]} selectedGames
 * @param {boolean} includeStreaming
 * @param {string} parentInterface
 * @param {string} totalBW - Total bandwidth e.g. "100M"
 * @returns {string[]}
 */
function buildQueueTree(selectedGames, includeStreaming, parentInterface, totalBW) {
  const lines = [
    `/queue tree`,
    ``,
    `# Root parent queue`,
    `add name=QoS-Root parent=${parentInterface} max-limit=${totalBW} \\`,
    `    comment="QoS Root Queue"`,
    ``,
    `# Gaming priority queue (Priority 1 - Highest)`,
    `add name=QoS-Gaming parent=QoS-Root priority=1 max-limit=${totalBW} \\`,
    `    comment="Gaming Traffic - Priority 1"`,
    ``,
  ];

  // Per-game child queues under Gaming parent
  selectedGames.forEach(key => {
    const game = GAME_PORTS[key];
    if (!game) return;
    const mark = `game_${markName(key)}`;
    lines.push(
      `add name=QoS-${markName(key)} parent=QoS-Gaming packet-mark=${mark} \\`,
      `    priority=1 max-limit=${totalBW} \\`,
      `    comment="${game.comment} Queue"`,
    );
  });

  if (includeStreaming) {
    lines.push(
      ``,
      `# Streaming queue (Priority 4)`,
      `add name=QoS-Streaming parent=QoS-Root priority=4 max-limit=${totalBW} \\`,
      `    comment="Streaming Traffic - Priority 4"`,
    );
    Object.entries(STREAMING_PORTS).forEach(([key, svc]) => {
      const mark = `stream_${markName(key)}`;
      lines.push(
        `add name=QoS-${markName(key)} parent=QoS-Streaming packet-mark=${mark} \\`,
        `    priority=4 max-limit=${totalBW} \\`,
        `    comment="${svc.comment} Queue"`,
      );
    });
  }

  lines.push(
    ``,
    `# Default (everything else) - Priority 8`,
    `add name=QoS-Default parent=QoS-Root priority=8 max-limit=${totalBW} \\`,
    `    comment="Default Traffic - Priority 8"`,
    ``,
  );

  return lines;
}

// ---------------------------------------------------------------------------
// Client Isolation per SSID
// ---------------------------------------------------------------------------

/**
 * Build client isolation rules (forward chain drops between same-interface clients).
 * @param {string[]} ssids - Interface names of SSIDs e.g. ['wlan1', 'wlan2']
 * @returns {string}
 */
function buildClientIsolation(ssids) {
  if (!ssids || ssids.length === 0) return '';

  const lines = [
    `# ---- Client Isolation per SSID ----`,
    `/ip firewall filter`,
  ];

  ssids.forEach(ssid => {
    lines.push(
      `add action=drop chain=forward in-interface=${ssid} out-interface=${ssid} \\`,
      `    comment="Client Isolation: ${ssid}"`,
    );
  });

  lines.push('');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

/**
 * Generate Game QoS script.
 *
 * @param {Object} config
 * @param {string[]} config.games             - Game keys to include (see GAME_PORTS)
 * @param {boolean}  config.include_streaming - Include YouTube/Netflix separation
 * @param {string[]} config.ssid_interfaces   - SSID interfaces for client isolation []
 * @param {string}   config.parent_interface  - Parent queue interface (e.g. 'ether1-wan')
 * @param {string}   config.total_bandwidth   - Total bandwidth string (e.g. '100M')
 * @param {string}   config.comment           - Script comment
 * @returns {string} RouterOS script
 */
function generateGameQoS(config) {
  if (typeof Auth !== 'undefined' && Auth.canAccessTool) {
    const access = Auth.canAccessTool('game-qos');
    if (!access.allowed) {
      return '# ================================================================\n# COMITTOOLS PRO — ACCESS RESTRICTED (SUBSCRIPTION REQUIRED)\n# ' + (access.message || 'Fitur ini memerlukan paket langganan aktif.') + '\n# Silakan SUBSCRIBE untuk membuka fitur Game QoS.\n# ================================================================';
    }
  }

  const defaults = {
    games:              Object.keys(GAME_PORTS), // All games by default
    include_streaming:  true,
    ssid_interfaces:    [],
    parent_interface:   'ether1',
    total_bandwidth:    '100M',
    comment:            'Generated by ComitTools Pro - Game QoS',
  };

  const cfg = Object.assign({}, defaults, config);

  // Filter valid game keys
  const validGames = cfg.games.filter(key => {
    if (!GAME_PORTS[key]) {
      console.warn(`Unknown game key: "${key}" - skipped.`);
      return false;
    }
    return true;
  });

  let script = '';
  script += `#####################################################################\n`;
  script += `# Game QoS Priority Generator - ComitTools Pro\n`;
  script += `# Games: ${validGames.map(k => GAME_PORTS[k].comment).join(', ')}\n`;
  script += `# Streaming: ${cfg.include_streaming}  |  Total BW: ${cfg.total_bandwidth}\n`;
  script += `#####################################################################\n\n`;

  // --- Mangle ---
  script += `# ===================================================================\n`;
  script += `# MANGLE - Packet Marking\n`;
  script += `# ===================================================================\n`;
  script += `/ip firewall mangle\n\n`;

  validGames.forEach(key => {
    const game  = GAME_PORTS[key];
    const rules = buildGameMangleRules(key, game, 1);
    script += rules.join('\n') + '\n';
  });

  if (cfg.include_streaming) {
    const streamRules = buildStreamingMangleRules();
    script += streamRules.join('\n') + '\n';
  }

  // --- Queue Tree ---
  script += `# ===================================================================\n`;
  script += `# QUEUE TREE\n`;
  script += `# ===================================================================\n`;
  const queueLines = buildQueueTree(
    validGames,
    cfg.include_streaming,
    cfg.parent_interface,
    cfg.total_bandwidth
  );
  script += queueLines.join('\n') + '\n';

  // --- Client Isolation ---
  if (cfg.ssid_interfaces && cfg.ssid_interfaces.length > 0) {
    script += buildClientIsolation(cfg.ssid_interfaces);
  }

  script += `#####################################################################\n`;
  script += `# Game QoS applied. Adjust max-limit per your actual bandwidth.\n`;
  script += `# Priority 1 = Highest, Priority 8 = Lowest\n`;
  script += `#####################################################################\n`;

  return script;
}

/**
 * Get list of supported games.
 * @returns {Object[]} Array of { key, name, comment }
 */
function getSupportedGames() {
  return Object.entries(GAME_PORTS).map(([key, g]) => ({
    key,
    name:    g.name,
    comment: g.comment,
  }));
}

// ---- Module Export ----
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateGameQoS, getSupportedGames, GAME_PORTS, STREAMING_PORTS };
} else if (typeof window !== 'undefined') {
  window.generateGameQoS    = generateGameQoS;
  window.getSupportedGames  = getSupportedGames;
  window.GAME_PORTS         = GAME_PORTS;
  window.STREAMING_PORTS    = STREAMING_PORTS;
}
