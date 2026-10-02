/**
 * PON (Passive Optical Network) Calculator — ComitTools PRO
 * Full Ratio: 1:4, 1:8, 1:16, 1:32, 1:64, 1:128
 */
const PONCalc = (function() {

  const RATIOS = [4, 8, 16, 32, 64, 128];
  const OLT_STANDARDS = { 'GPON': 2488, 'XGPON': 9953, 'EPON': 1250, 'XGS-PON': 9953 };

  function parseMbps(str) {
    if (!str) return 0;
    const s = String(str).trim().toUpperCase();
    const n = parseFloat(s);
    if (s.endsWith('G')) return n * 1000;
    if (s.endsWith('M')) return n;
    if (s.endsWith('K')) return n / 1000;
    return n;
  }

  function fmtMbps(mbps) {
    if (mbps >= 1000) return (mbps / 1000).toFixed(mbps % 1000 === 0 ? 0 : 2) + ' Gbps';
    return mbps.toFixed(mbps % 1 === 0 ? 0 : 2) + ' Mbps';
  }

  /**
   * Calculate PON bandwidth distribution
   */
  function calculate(cfg) {
    const {
      oltBandwidth = 1000,    // Mbps total OLT uplink
      ontCount = 32,          // number of ONTs connected
      splitRatio = 32,        // 1:N split
      usageFactor = 0.7,      // concurrency/usage factor (0-1)
      guaranteedPct = 20,     // % of per-ONT as guaranteed
      burstMultiplier = 2,    // burst = base * multiplier
      oversubFactor = 1,      // overbooking factor (1 = none)
    } = cfg;

    const oltBW = parseMbps(String(oltBandwidth));
    const ratio = parseInt(splitRatio);
    const count = parseInt(ontCount);
    const usage = parseFloat(usageFactor);
    const oversub = parseFloat(oversubFactor) || 1;

    // Effective bandwidth per ONT
    const perOntRaw = oltBW / Math.min(count, ratio);
    const perOntEffective = (perOntRaw * usage * oversub);
    const perOntGuaranteed = perOntEffective * (parseFloat(guaranteedPct) / 100);
    const perOntBurst = perOntEffective * burstMultiplier;
    const perOntBurstThresh = perOntEffective * 0.75;

    // Total capacity
    const totalAllocated = perOntEffective * count;
    const utilization = (totalAllocated / oltBW) * 100;

    // Remaining for network overhead etc.
    const overhead = oltBW - totalAllocated;

    return {
      oltBW: fmtMbps(oltBW),
      ratio: `1:${ratio}`,
      ontCount: count,
      perOntEffective: fmtMbps(perOntEffective),
      perOntGuaranteed: fmtMbps(perOntGuaranteed),
      perOntBurst: fmtMbps(perOntBurst),
      perOntBurstThresh: fmtMbps(perOntBurstThresh),
      totalAllocated: fmtMbps(totalAllocated),
      utilization: utilization.toFixed(1) + '%',
      overhead: fmtMbps(Math.max(0, overhead)),
      // Raw Mbps values for script generation
      raw: { perOntEffective, perOntGuaranteed, perOntBurst, perOntBurstThresh, oltBW }
    };
  }

  /**
   * Generate MikroTik Queue script for PON management
   */
  function generateScript(cfg) {
    const result = calculate(cfg);
    const { ontCount, splitRatio } = cfg;
    const baseIp = cfg.baseIp || '192.168.1.';
    const startIp = parseInt(cfg.startIp) || 2;
    const parentIface = cfg.parentIface || 'ether1-uplink';
    const count = parseInt(ontCount);

    const out = [];
    out.push('# ================================================================');
    out.push('# ComitTools PRO — PON Queue Management Script');
    out.push(`# OLT Bandwidth : ${result.oltBW}`);
    out.push(`# Split Ratio   : ${result.ratio}`);
    out.push(`# ONT Count     : ${count}`);
    out.push(`# Per ONT       : ${result.perOntEffective} (effective)`);
    out.push('# ================================================================');
    out.push('');

    // Queue types
    out.push('/queue type');
    out.push('add kind=sfq name=sfq-pon');
    out.push('add kind=pfifo name=pfifo-pon');
    out.push('');

    // Parent queue for total bandwidth
    out.push('/queue tree');
    out.push(`add name="PON-TOTAL" parent=${parentIface} max-limit=${result.oltBW.replace(' Mbps','M').replace(' Gbps','G')} queue=pfifo-pon comment="PON Total Bandwidth ${result.oltBW}"`);
    out.push('');

    // Per-ONT queues
    const perOnt = result.raw.perOntEffective;
    const perOntGuarantee = result.raw.perOntGuaranteed;
    const perOntBurst = result.raw.perOntBurst;
    const perOntThresh = result.raw.perOntBurstThresh;

    function mbpsToStr(mbps) {
      if (mbps >= 1000) return (mbps / 1000).toFixed(mbps % 1000 === 0 ? 0 : 2) + 'G';
      return Math.round(mbps) + 'M';
    }

    for (let i = 0; i < Math.min(count, 128); i++) {
      const ip = `${baseIp}${startIp + i}`;
      const name = `ONT-${String(i + 1).padStart(2, '0')}`;
      out.push(`add name="${name}" parent="PON-TOTAL" packet-mark="${name}_PKT" max-limit=${mbpsToStr(perOnt)}/${mbpsToStr(perOnt)} burst-limit=${mbpsToStr(perOntBurst)}/${mbpsToStr(perOntBurst)} burst-threshold=${mbpsToStr(perOntThresh)}/${mbpsToStr(perOntThresh)} burst-time=16/16 limit-at=${mbpsToStr(perOntGuarantee)}/${mbpsToStr(perOntGuarantee)} priority=8 queue=sfq-pon comment="${name} ${ip}"`);
    }

    out.push('');
    out.push('# Mangle rules to mark packets per ONT IP:');
    out.push('/ip firewall mangle');
    for (let i = 0; i < Math.min(count, 128); i++) {
      const ip = `${baseIp}${startIp + i}`;
      const name = `ONT-${String(i + 1).padStart(2, '0')}`;
      out.push(`add chain=forward src-address=${ip} action=mark-packet new-packet-mark=${name}_PKT passthrough=no comment="${name}"`);
      out.push(`add chain=forward dst-address=${ip} action=mark-packet new-packet-mark=${name}_PKT passthrough=no`);
    }

    out.push('');
    out.push('# ================================================================');
    out.push('# END OF PON QUEUE SCRIPT');
    out.push('# ================================================================');

    return out.join('\n');
  }

  return { calculate, generateScript, RATIOS, OLT_STANDARDS, fmtMbps, parseMbps };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PONCalc };
}

