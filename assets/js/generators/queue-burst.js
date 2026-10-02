/**
 * Queue & Burst Rate Limit Calculator — ComitTools PRO
 * MikroTik RouterOS v6.x & v7.x
 */
const QueueGen = (function() {

  /** Parse bandwidth string to bits/s. e.g. "10M" -> 10000000 */
  function parseBW(str) {
    if (!str) return 0;
    const s = String(str).trim().toUpperCase();
    const num = parseFloat(s);
    if (s.endsWith('G')) return num * 1e9;
    if (s.endsWith('M')) return num * 1e6;
    if (s.endsWith('K')) return num * 1e3;
    return num;
  }

  /** Format bits/s to human readable. e.g. 10000000 -> "10M" */
  function formatBW(bps) {
    if (bps >= 1e9) return (bps / 1e9).toFixed(bps % 1e9 === 0 ? 0 : 2) + 'G';
    if (bps >= 1e6) return (bps / 1e6).toFixed(bps % 1e6 === 0 ? 0 : 2) + 'M';
    if (bps >= 1e3) return (bps / 1e3).toFixed(bps % 1e3 === 0 ? 0 : 2) + 'K';
    return Math.round(bps).toString();
  }

  /**
   * Calculate burst parameters
   * @param {Object} cfg
   * @returns {Object} calculated values
   */
  function calculate(cfg) {
    const {
      downMax = '10M',
      upMax = '5M',
      burstMultiplier = 2,       // burst = max * multiplier
      thresholdPct = 75,          // burst-threshold = max * pct%
      burstTime = '16/16',
      limitAtPct = 50,            // limit-at = max * pct% (guarantee)
    } = cfg;

    const downBps = parseBW(downMax);
    const upBps = parseBW(upMax);
    const mult = parseFloat(burstMultiplier) || 2;
    const thPct = parseFloat(thresholdPct) / 100;
    const laPct = parseFloat(limitAtPct) / 100;

    const downBurst = downBps * mult;
    const upBurst = upBps * mult;
    const downThresh = downBps * thPct;
    const upThresh = upBps * thPct;
    const downLimitAt = downBps * laPct;
    const upLimitAt = upBps * laPct;

    return {
      maxLimit: `${formatBW(upBps)}/${formatBW(downBps)}`,
      burstLimit: `${formatBW(upBurst)}/${formatBW(downBurst)}`,
      burstThreshold: `${formatBW(upThresh)}/${formatBW(downThresh)}`,
      burstTime: burstTime,
      limitAt: `${formatBW(upLimitAt)}/${formatBW(downLimitAt)}`,
      // raw values for display
      raw: { downBps, upBps, downBurst, upBurst, downThresh, upThresh, downLimitAt, upLimitAt }
    };
  }

  /**
   * Generate Simple Queue script
   */
  function generateSimpleQueue(cfg) {
    const {
      queueName = 'Client-1',
      target = '192.168.88.100/32',
      srcAddress = '',
      dstAddress = '',
      priority = 8,
      comment = '',
      parentQueue = 'none',
      burstEnabled = true,
    } = cfg;

    if (typeof Auth !== 'undefined' && Auth.canAccessTool) {
      const access = Auth.canAccessTool('queue-burst');
      if (!access.allowed) {
        return '# ================================================================\n# COMITTOOLS PRO — ACCESS RESTRICTED (SUBSCRIPTION REQUIRED)\n# ' + (access.message || 'Fitur ini memerlukan paket langganan aktif.') + '\n# Silakan SUBSCRIBE untuk membuka fitur Queue & Burst.\n# ================================================================';
      }
    }

    const vals = calculate(cfg);
    const out = [];

    out.push('# ================================================================');
    out.push('# ComitTools PRO — Simple Queue + Burst Rate Limit');
    out.push(`# Queue : ${queueName} | Target: ${target}`);
    out.push(`# Max   : ${vals.maxLimit} | Burst: ${vals.burstLimit}`);
    out.push('# ================================================================');
    out.push('');
    out.push('/queue simple');

    let cmd = `add name="${queueName}" target="${target}"`;
    cmd += ` max-limit=${vals.maxLimit}`;
    if (burstEnabled) {
      cmd += ` burst-limit=${vals.burstLimit}`;
      cmd += ` burst-threshold=${vals.burstThreshold}`;
      cmd += ` burst-time=${vals.burstTime}`;
    }
    if (limitAtPct > 0) cmd += ` limit-at=${vals.limitAt}`;
    if (priority && priority !== 8) cmd += ` priority=${priority}`;
    if (srcAddress) cmd += ` src-address="${srcAddress}"`;
    if (dstAddress) cmd += ` dst-address="${dstAddress}"`;
    if (parentQueue && parentQueue !== 'none') cmd += ` parent="${parentQueue}"`;
    if (comment) cmd += ` comment="${comment || queueName}"`;
    else cmd += ` comment="${queueName}"`;

    out.push(cmd);
    out.push('');
    out.push(`# Penjelasan:`);
    out.push(`# max-limit=${vals.maxLimit} → Upload/Download normal`);
    out.push(`# burst-limit=${vals.burstLimit} → Kecepatan boost saat burst`);
    out.push(`# burst-threshold=${vals.burstThreshold} → Ambang batas sebelum burst aktif`);
    out.push(`# burst-time=${vals.burstTime} → Durasi kalkulasi rata-rata (detik)`);
    out.push(`# limit-at=${vals.limitAt} → Bandwidth minimum dijamin`);
    out.push('');
    out.push('# ================================================================');

    return out.join('\n');

    function limitAtPct() { return cfg.limitAtPct || 50; }
  }

  /**
   * Generate Queue Tree (hierarchical)
   */
  function generateQueueTree(cfg) {
    const {
      totalUp = '20M',
      totalDown = '50M',
      clients = [],          // Array of {name, target, upMax, downMax}
      parentName = 'TOTAL',
      interfaceDown = 'bridge-lan',
      interfaceUp = 'ether1',
      defaultPriority = 8,
    } = cfg;

    const out = [];
    out.push('# ================================================================');
    out.push('# ComitTools PRO — Queue Tree Hierarchical');
    out.push(`# Total: ${totalUp}/${totalDown} | Clients: ${clients.length}`);
    out.push('# ================================================================');
    out.push('');
    out.push('/queue type');
    out.push('add kind=pfifo name=pfifo-default');
    out.push('add kind=sfq name=sfq-default');
    out.push('');
    out.push('/queue tree');

    // Parent queues
    out.push(`add name="${parentName}-UP" parent=${interfaceUp} max-limit=${totalUp} queue=pfifo-default comment="Parent Upload"`);
    out.push(`add name="${parentName}-DOWN" parent=${interfaceDown} max-limit=${totalDown} queue=pfifo-default comment="Parent Download"`);
    out.push('');

    // Distribute bandwidth among clients
    const perClientUp = parseBW(totalUp) / Math.max(clients.length, 1);
    const perClientDown = parseBW(totalDown) / Math.max(clients.length, 1);

    clients.forEach((client, idx) => {
      const upBps = parseBW(client.upMax || formatBW(perClientUp));
      const downBps = parseBW(client.downMax || formatBW(perClientDown));
      const upBurst = upBps * (parseFloat(cfg.burstMultiplier) || 2);
      const downBurst = downBps * (parseFloat(cfg.burstMultiplier) || 2);
      const upThresh = upBps * 0.75;
      const downThresh = downBps * 0.75;

      out.push(`# Client ${idx + 1}: ${client.name}`);
      out.push(`add name="${client.name}-UP" parent="${parentName}-UP" packet-mark="${client.name}_UP" max-limit=${formatBW(upBps)} burst-limit=${formatBW(upBurst)} burst-threshold=${formatBW(upThresh)} burst-time=16 priority=${client.priority || defaultPriority} queue=sfq-default comment="${client.name}"`);
      out.push(`add name="${client.name}-DOWN" parent="${parentName}-DOWN" packet-mark="${client.name}_DOWN" max-limit=${formatBW(downBps)} burst-limit=${formatBW(downBurst)} burst-threshold=${formatBW(downThresh)} burst-time=16 priority=${client.priority || defaultPriority} queue=sfq-default comment="${client.name}"`);
      out.push('');
    });

    out.push('# ================================================================');
    return out.join('\n');
  }

  /**
   * Rate Limit Calculator — returns formatted table output
   */
  function calcRateTable(cfg) {
    const vals = calculate(cfg);
    return {
      ...vals,
      summary: [
        ['Parameter', 'Upload', 'Download'],
        ['Max Limit (Normal)', formatBW(vals.raw.upBps), formatBW(vals.raw.downBps)],
        ['Burst Limit (Peak)', formatBW(vals.raw.upBurst), formatBW(vals.raw.downBurst)],
        ['Burst Threshold', formatBW(vals.raw.upThresh), formatBW(vals.raw.downThresh)],
        ['Burst Time', cfg.burstTime || '16/16', cfg.burstTime || '16/16'],
        ['Limit-At (Min Guarantee)', formatBW(vals.raw.upLimitAt), formatBW(vals.raw.downLimitAt)],
      ]
    };
  }

  return { generate: generateSimpleQueue, generateQueueTree, calculate, calcRateTable, parseBW, formatBW };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QueueGen };
}

