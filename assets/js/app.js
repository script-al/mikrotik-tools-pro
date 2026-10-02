/**
 * ComitTools PRO — Main Application Engine
 * app.js
 * Handles: rendering, modals, generators, auth UI, nav, search
 */

'use strict';

// ================================================================
// INIT
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAuthUI();
  loadAndRenderTools();
  initDropdownClose();
});

// ================================================================
// THEME
// ================================================================
function initTheme() {
  const saved = localStorage.getItem('ct_theme') || 'dark';
  setTheme(saved, false);
}

function setTheme(theme, save = true) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeBtn');
  if (btn) btn.innerHTML = theme === 'night'
    ? '<i class="fa-solid fa-sun"></i>'
    : theme === 'dark'
      ? '<i class="fa-solid fa-moon"></i>'
      : '<i class="fa-solid fa-circle-half-stroke"></i>';
  if (save) localStorage.setItem('ct_theme', theme);
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = cur === 'dark' ? 'night' : 'dark';
  setTheme(next);
  showToast(`Tema: ${next === 'night' ? '🌑 OLED Night' : '🌙 Dark'}`, 'info');
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function focusSearch() {
  document.getElementById('searchInput')?.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================================================================
// AUTH UI
// ================================================================
function initAuthUI() {
  if (typeof Auth === 'undefined') return;
  const user = Auth.getCurrentUser();
  const loggedIn = document.getElementById('navLoggedIn');
  const loggedOut = document.getElementById('navNotLoggedIn');

  if (user) {
    loggedIn?.classList.remove('hidden');
    loggedOut?.classList.add('hidden');
    const nameEl = document.getElementById('navUsername');
    const dropName = document.getElementById('dropdownUserName');
    const dropEmail = document.getElementById('dropdownUserEmail');
    const avatarEl = document.getElementById('navAvatar');
    if (nameEl) nameEl.textContent = user.name?.split(' ')[0] || user.email.split('@')[0];
    if (dropName) dropName.textContent = user.name || 'User';
    if (dropEmail) dropEmail.textContent = user.email;
    if (avatarEl) {
      const firstLetter = (user.name || user.email || 'U')[0].toUpperCase();
      if (user.avatar) {
        // Support both Google/GitHub HTTPS photo URLs and base64 data: uploads
        avatarEl.innerHTML = `<img src="${user.avatar}" 
          style="width:100%;height:100%;object-fit:cover;border-radius:50%"
          onerror="this.parentElement.textContent='${firstLetter}'"
          alt="${firstLetter}">`;
      } else {
        avatarEl.textContent = firstLetter;
      }
    }

    // Membership badge in navbar
    const mem = (Auth.getMembership) ? Auth.getMembership(user.uid) : { package: 'FREE', status: 'ACTIVE' };
    let badgeEl = document.getElementById('navUserBadge');
    if (!badgeEl && nameEl) {
      badgeEl = document.createElement('span');
      badgeEl.id = 'navUserBadge';
      badgeEl.style.fontSize = '9px';
      badgeEl.style.padding = '2px 7px';
      badgeEl.style.borderRadius = '10px';
      badgeEl.style.fontWeight = '800';
      badgeEl.style.marginLeft = '5px';
      badgeEl.style.letterSpacing = '0.4px';
      nameEl.parentNode.insertBefore(badgeEl, nameEl.nextSibling);
    }
    if (badgeEl) {
      const emailNorm = (user.email || '').toLowerCase();
      const isOwner = emailNorm === 'acm2lp21@gmail.com' || user.role === 'superadmin' || user.role === 'owner';
      if (isOwner) {
        badgeEl.className = 'badge badge-orange';
        badgeEl.textContent = 'OWNER / LIFETIME';
      } else if (mem.isExpired) {
        badgeEl.className = 'badge badge-rose';
        badgeEl.textContent = 'EXPIRED (0h)';
      } else if (mem.package === 'FREE') {
        badgeEl.className = 'badge badge-free';
        badgeEl.textContent = 'FREE';
      } else if (mem.remainingDays && mem.remainingDays !== Infinity) {
        badgeEl.className = 'badge badge-orange';
        badgeEl.textContent = `${mem.package} (${mem.remainingDays}h)`;
      } else {
        badgeEl.className = 'badge badge-teal';
        badgeEl.textContent = mem.package || 'PRO';
      }
    }
  } else {
    loggedIn?.classList.add('hidden');
    loggedOut?.classList.remove('hidden');
    const badgeEl = document.getElementById('navUserBadge');
    if (badgeEl) badgeEl.remove();
  }
}

function handleLogout() {
  if (typeof Auth !== 'undefined') Auth.logout();
  showToast('Berhasil logout!', 'success');
  setTimeout(() => location.reload(), 800);
}

// ================================================================
// DROPDOWN
// ================================================================
function toggleDropdown(id) {
  document.querySelectorAll('.dropdown.open').forEach(d => {
    if (d.id !== id) d.classList.remove('open');
  });
  document.getElementById(id)?.classList.toggle('open');
}

function initDropdownClose() {
  document.addEventListener('click', e => {
    if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
    }
  });
}

function showToolsDropdown() {
  openNavModal('tools');
}

// ================================================================
// MOBILE MENU
// ================================================================
function toggleMobileMenu() {
  document.getElementById('mobileMenu')?.classList.toggle('open');
}

function closeMobileMenu() {
  document.getElementById('mobileMenu')?.classList.remove('open');
}

function showSection(section) {
  if (section === 'home') scrollToTop();
}

// ================================================================
// ================================================================
// TOOLS LOADING & RENDERING (COMITTOOLS PRO NATIVE DESIGN)
// ================================================================
let allCatalog = null;

const colorMap = {
  orange: { bg: 'rgba(255,92,0,0.12)', color: '#ff8040', border: 'rgba(255,92,0,0.3)' },
  teal:   { bg: 'rgba(63,211,192,0.12)', color: '#3fd3c0', border: 'rgba(63,211,192,0.3)' },
  amber:  { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  rose:   { bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.3)' },
  cyan:   { bg: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: 'rgba(56,189,248,0.3)' },
  emerald:{ bg: 'rgba(52,211,153,0.12)', color: '#34d399', border: 'rgba(52,211,153,0.3)' },
  purple: { bg: 'rgba(168,85,247,0.12)', color: '#c084fc', border: 'rgba(168,85,247,0.3)' },
};

async function loadAndRenderTools() {
  if (typeof ToolsCatalog !== 'undefined') {
    allCatalog = ToolsCatalog;
  }
  renderAllSections(allCatalog);
}

function renderToolCardHTML(t, catColor) {
  const c = colorMap[catColor] || colorMap.orange;
  const isStarred = t.star;
  const starBadge = isStarred ? '<span class="badge badge-amber" style="font-size:9px"><i class="fa-solid fa-star"></i> TOP</span>' : '';
  const badgeClass = t.badge === 'ULTIMATE' ? 'badge-orange' : (t.badge === 'PRO' ? 'badge-amber' : (t.badge === 'NEW' ? 'badge-teal' : (t.badge === 'OFFICIAL' ? 'badge-cyan' : 'badge-free')));
  const badgeHTML = t.badge ? `<span class="badge ${badgeClass}">${t.badge}</span>` : '';
  const verTag = t.version === 'v7' ? `<span class="ver-tag ver-v7">v7</span>` :
                 t.version === 'v6' ? `<span class="ver-tag ver-v6">v6</span>` :
                 `<span class="ver-tag ver-both">v6+v7</span>`;
  const isDownload = t.category === 'cat-official' || t.badge === 'OFFICIAL' || t.badge === 'ASSETS' || (t.id && (t.id.startsWith('winbox') || t.id === 'netinstall' || t.id === 'the-dude-client'));
  
  // Check subscription access control
  const access = (typeof Auth !== 'undefined' && Auth.canAccessTool) ? Auth.canAccessTool(t.id) : { allowed: true };
  const isLocked = !access.allowed;
  const lockBadge = isLocked ? '<span class="badge" style="background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3);font-size:8.5px"><i class="fa-solid fa-lock"></i> LOCK</span>' : '';
  const actionText = isDownload ? 'Unduh Utilitas' : (isLocked ? 'Subscribe untuk Akses' : 'Buka Generator');
  const actionIcon = isDownload ? 'fa-cloud-arrow-down' : (isLocked ? 'fa-lock text-rose' : 'fa-play-circle');
  const escapedName = (t.name || '').replace(/'/g, "\\'");

  return `
    <div class="tool-card animate-fadeIn ${isLocked ? 'tool-card-locked' : ''}" onclick="openAnyTool('${t.id}', '${escapedName}')" data-tool-name="${(t.name||'').toLowerCase()} ${(t.desc||'').toLowerCase()}">
      <div class="tool-card-header">
        <div class="tool-card-icon" style="background:${c.bg};color:${c.color};border:1px solid ${c.border}">
          <i class="fa-solid ${t.icon || 'fa-bolt'}"></i>
        </div>
        <div style="flex:1;min-width:0">
          <div class="tool-card-title">${t.name}</div>
          <div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap">
            ${badgeHTML}
            ${starBadge}
            ${lockBadge}
          </div>
        </div>
      </div>
      <div class="tool-card-desc">${t.desc || 'Generator script MikroTik RouterOS siap pakai dengan opsi custom.'}</div>
      <div class="tool-card-footer">
        <div class="tool-card-action" style="${isLocked ? 'color:#f87171' : ''}"><i class="fa-solid ${actionIcon}"></i> ${actionText}</div>
        ${verTag}
      </div>
    </div>
  `;
}

function renderAllSections(catalog) {
  const container = document.getElementById('toolsContainer');
  if (!container || !catalog || !catalog.categories) return;

  container.innerHTML = catalog.categories.map((cat, idx) => {
    const c = colorMap[cat.color] || colorMap.orange;
    // Open first 2 categories by default, others collapsible
    const isCollapsed = idx > 1 ? 'collapsed' : '';
    const toolCards = (cat.tools || []).map(t => renderToolCardHTML(t, cat.color)).join('');

    return `
      <div class="category-section ${isCollapsed}" id="${cat.id}">
        <div class="card-header" onclick="toggleCategory('${cat.id}')">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="card-header-icon" style="background:${c.bg};color:${c.color};border:1px solid ${c.border}">
              <i class="fa-solid ${cat.icon}"></i>
            </div>
            <div>
              <div class="card-title">${cat.name}</div>
              <div class="card-subtitle">${cat.subtitle || (cat.tools.length + ' tools tersedia')}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span class="badge" style="background:${c.bg};color:${c.color};border-color:${c.border}">${cat.tools.length} Tools</span>
            <i class="fa-solid fa-chevron-down category-toggle-icon text-muted" style="transition:transform 0.3s"></i>
          </div>
        </div>
        <div class="tools-grid">${toolCards}</div>
      </div>
    `;
  }).join('');
}

function toggleCategory(id) {
  document.getElementById(id)?.classList.toggle('collapsed');
}

// ================================================================
// LIVE SEARCH & CATEGORY FILTER
// ================================================================
function filterCategory(catKey) {
  const allSections = document.querySelectorAll('.category-section');
  if (!catKey || catKey === 'all') {
    allSections.forEach(s => {
      s.style.display = 'block';
      s.classList.remove('collapsed');
    });
    showToast('Menampilkan seluruh 100+ tools', 'info');
    return;
  }
  allSections.forEach(s => {
    if (s.id.includes(catKey)) {
      s.style.display = 'block';
      s.classList.remove('collapsed');
      s.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      s.style.display = 'none';
    }
  });
}

function filterTools(query) {
  const q = (query || '').toLowerCase().trim();
  const allCards = document.querySelectorAll('.tool-card');
  const allSections = document.querySelectorAll('.category-section');

  if (!q) {
    allCards.forEach(c => c.style.display = 'flex');
    allSections.forEach(s => s.style.display = 'block');
    return;
  }

  allCards.forEach(card => {
    const text = card.getAttribute('data-tool-name') || '';
    if (text.includes(q)) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });

  allSections.forEach(sec => {
    const visibleCards = sec.querySelectorAll('.tool-card[style*="display: flex"]');
    if (visibleCards.length > 0) {
      sec.style.display = 'block';
      sec.classList.remove('collapsed');
    } else {
      sec.style.display = 'none';
    }
  });
}

function clearSearch() {
  const el = document.getElementById('searchInput');
  if (el) el.value = '';
  filterTools('');
}

// ================================================================
// PAYWALL & SUBSCRIPTION LOCK MODAL
// ================================================================
let pendingPaywallToolId = null;

function showPaywallModal(toolId, toolName, accessInfo) {
  pendingPaywallToolId = toolId;
  const modal = document.getElementById('paywallModal');
  const msgEl = document.getElementById('paywallStatusMsg');
  if (!modal) return;

  const user = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;
  const mem = (user && typeof Auth !== 'undefined' && Auth.getMembership) ? Auth.getMembership(user.uid) : null;

  if (msgEl) {
    if (!user) {
      msgEl.innerHTML = `
        <div style="color:rgba(255,255,255,0.7);margin-bottom:8px">
          Akses fitur <strong>${toolName || 'PRO Tools'}</strong> memerlukan langganan aktif.
        </div>
        <div style="font-size:11.5px;color:var(--text-muted)">
          Sudah punya akun? <a href="login/index.html?redirect=../index.html" style="color:var(--brand-orange);font-weight:700;text-decoration:none">Login di sini</a> atau <a href="login/index.html#register" style="color:var(--brand-teal);font-weight:700;text-decoration:none">Daftar Akun Baru</a>
        </div>
      `;
    } else if (mem && mem.isExpired) {
      msgEl.innerHTML = `
        <div style="color:var(--brand-rose);font-weight:700;margin-bottom:4px">
          <i class="fa-solid fa-triangle-exclamation"></i> Masa Aktif Berlangganan Telah Habis
        </div>
        <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:8px">
          Akun: <strong>${user.email}</strong> · Paket: ${mem.package} (0 hari tersisa)
        </div>
        <div style="font-size:11.5px;color:var(--text-secondary)">
          Klik tombol di atas untuk memilih perpanjangan paket langganan.
        </div>
      `;
    } else {
      msgEl.innerHTML = `
        <div style="color:rgba(255,255,255,0.7);margin-bottom:4px">
          Akun: <strong>${user.email}</strong> (Paket: <span class="badge badge-free">FREE</span>)
        </div>
        <div style="font-size:11.5px;color:var(--text-muted)">
          Fitur ini eksklusif untuk member PRO. Dapatkan akses penuh mulai Rp 15.000 / minggu!
        </div>
      `;
    }
  }

  modal.classList.add('open');
}

function handlePaywallOverlayClick(event) {
  if (event && event.target === document.getElementById('paywallModal')) {
    event.preventDefault();
    event.stopPropagation();
    const card = document.querySelector('#paywallModal .paywall-card');
    if (card) {
      card.classList.remove('shake-card');
      void card.offsetWidth;
      card.classList.add('shake-card');
    }
  }
}

function closePaywallModal() {
  const modal = document.getElementById('paywallModal');
  if (modal) modal.classList.remove('open');
}

function handlePaywallSubscribe() {
  closePaywallModal();
  openNavModal('price');
}

let isModalFullscreen = false;
let currentModalSizeClass = 'modal-lg';

function adjustModalSize(toolId) {
  const dialog = document.getElementById('toolModalDialog');
  if (!dialog) return;

  isModalFullscreen = false;
  dialog.classList.remove('modal-fullscreen', 'modal-sm', 'modal-md', 'modal-lg', 'modal-xl');
  const icon = document.getElementById('modalExpandIcon');
  if (icon) icon.className = 'fa-solid fa-expand';

  let targetClass = 'modal-lg';

  // 1. Official tools (download cards & specs) -> Compact modal-md
  if (typeof OfficialTools !== 'undefined' && OfficialTools.officialList && OfficialTools.officialList[toolId]) {
    targetClass = 'modal-md';
  }
  // 2. Extra large tools with rich split panes (LB PCC Ultimate, Hotspot Page Maker) -> modal-xl
  else if (toolId === 'lb-pcc-ultimate' || toolId === 'hotspot-login-page-maker') {
    targetClass = 'modal-xl';
  }
  // 3. Compact / minimal utility tools (1-2 fields or single click actions) -> modal-md
  else if ([
    'clear-dns-flush', 'clear-log-terminal', 'clear-hotspot-cookies',
    'remove-arp-table', 'remove-dhcp-server-client', 'remove-dns',
    'remove-all-counters', 'reset-all-counters', 'shutdown-reset-reboot',
    'auto-reboot', 'bootloader-protector', 'anti-netcut', 'anti-ping-wan',
    'block-access-modem', 'protect-btest-server', 'protect-mac-server',
    'protect-neighbors-discovery', 'enable-fasttrack', 'drop-invalid-packets',
    'drop-traceroute', 'interface-name-to-default', 'reset-mac-all-interfaces',
    'remove-all-firewall', 'remove-all-queue', 'remove-all-hotspot',
    'remove-all-ip-address', 'remove-all-ip-pool', 'remove-interface-bridge',
    'remove-all-ppp', 'remove-all-routing', 'ping-tool', 'system-note-terminal',
    'set-identity-router', 'setup-romon'
  ].includes(toolId)) {
    targetClass = 'modal-md';
  }
  // 4. Default for standard two-pane script generators -> modal-lg
  else {
    targetClass = 'modal-lg';
  }

  currentModalSizeClass = targetClass;
  dialog.classList.add(targetClass);
}

function toggleModalFullscreen() {
  const dialog = document.getElementById('toolModalDialog');
  const icon = document.getElementById('modalExpandIcon');
  if (!dialog) return;

  isModalFullscreen = !isModalFullscreen;
  if (isModalFullscreen) {
    dialog.classList.remove('modal-sm', 'modal-md', 'modal-lg', 'modal-xl');
    dialog.classList.add('modal-fullscreen');
    if (icon) icon.className = 'fa-solid fa-compress';
  } else {
    dialog.classList.remove('modal-fullscreen');
    dialog.classList.add(currentModalSizeClass || 'modal-lg');
    if (icon) icon.className = 'fa-solid fa-expand';
  }
}

// ================================================================
// UNIVERSAL TOOL MODAL DISPATCHER
// ================================================================
function openAnyTool(toolId, toolName) {
  // CRITICAL ACCESS CONTROL CHECK ("tidak jebol kecuali email pemlik")
  if (typeof Auth !== 'undefined' && Auth.canAccessTool) {
    const access = Auth.canAccessTool(toolId);
    if (!access.allowed) {
      showPaywallModal(toolId, toolName, access);
      return;
    }
  }

  const modal = document.getElementById('toolModal');
  const title = document.getElementById('toolModalTitle');
  const body = document.getElementById('toolModalBody');
  if (!modal || !body) return;

  adjustModalSize(toolId);

  // 1. Check FastTools (60 Tools)
  if (typeof FastTools !== 'undefined' && FastTools.tools[toolId]) {
    title.innerHTML = `<i class="fa-solid fa-bolt text-orange"></i> &nbsp;${toolName || FastTools.tools[toolId].title}`;
    body.innerHTML = FastTools.getModalHTML(toolId);
    modal.classList.add('open');
    setTimeout(() => FastTools.triggerGen(toolId), 40);
    return;
  }

  // 2. Check ProTools
  if (typeof ProTools !== 'undefined' && ProTools.proToolDefs[toolId]) {
    title.innerHTML = `<i class="fa-solid fa-crown text-warning"></i> &nbsp;${toolName || ProTools.proToolDefs[toolId].title}`;
    body.innerHTML = ProTools.getModalHTML(toolId);
    modal.classList.add('open');
    setTimeout(() => ProTools.triggerGen(toolId), 40);
    return;
  }

  // 3. Check OfficialTools
  if (typeof OfficialTools !== 'undefined' && OfficialTools.officialList[toolId]) {
    title.innerHTML = `<i class="fa-solid fa-download text-teal"></i> &nbsp;${toolName || OfficialTools.officialList[toolId].title}`;
    body.innerHTML = OfficialTools.getModalHTML(toolId);
    modal.classList.add('open');
    return;
  }

  // 4. Fallback to core generators
  openTool(toolId);
}

function openTool(toolId) {
  // CRITICAL ACCESS CONTROL CHECK
  if (typeof Auth !== 'undefined' && Auth.canAccessTool) {
    const access = Auth.canAccessTool(toolId);
    if (!access.allowed) {
      showPaywallModal(toolId, null, access);
      return;
    }
  }

  const modal = document.getElementById('toolModal');
  const title = document.getElementById('toolModalTitle');
  const body = document.getElementById('toolModalBody');
  if (!modal || !body) return;

  adjustModalSize(toolId);

  const toolInfo = findTool(toolId);
  const iconMap = {
    'lb-pcc-ultimate': 'fa-network-wired',
    'queue-burst': 'fa-tachometer-alt',
    'queue-tree': 'fa-sitemap',
    'pon-calc': 'fa-tower-cell',
    'hotspot': 'fa-wifi',
    'firewall': 'fa-shield-halved',
    'game-qos': 'fa-gamepad',
    'vpn-wireguard': 'fa-shield',
    'vpn-l2tp': 'fa-lock',
    'vpn-pptp': 'fa-key',
    'vpn-sstp': 'fa-certificate',
    'netwatch': 'fa-bell',
    'auto-backup': 'fa-database',
    'branding': 'fa-id-card',
    'lb-failover': 'fa-shuffle',
    'hotspot-user': 'fa-users',
    'port-forward': 'fa-arrow-right-arrow-left',
  };

  const icon = iconMap[toolId] || 'fa-wrench';
  if (title) title.innerHTML = `<i class="fa-solid ${icon} text-orange"></i> &nbsp;${toolInfo?.name || toolId}`;
  body.innerHTML = getToolFormHTML(toolId);
  modal.classList.add('open');

  // Trigger initial generator for tools
  if (toolId === 'lb-pcc-ultimate') setTimeout(runPCCUltimate, 60);
  if (toolId === 'queue-burst') setTimeout(runQueueBurst, 60);
  if (toolId === 'queue-tree') setTimeout(runQueueTree, 60);
  if (toolId === 'pon-calc') setTimeout(runPONCalc, 60);
  if (toolId === 'firewall') setTimeout(runFirewall, 60);
  if (toolId === 'port-forward') setTimeout(runPortForward, 60);
  if (toolId === 'hotspot') setTimeout(runHotspot, 60);
  if (toolId === 'hotspot-user') setTimeout(runHotspotUser, 60);
  if (toolId === 'game-qos') setTimeout(runGameQoS, 60);
  if (toolId.startsWith('vpn-')) {
    const vtype = toolId.replace('vpn-', '');
    setTimeout(() => runVPN(vtype), 60);
  }
  if (toolId === 'lb-failover') setTimeout(runFailover, 60);
  if (toolId === 'netwatch') setTimeout(runNetwatch, 60);
  if (toolId === 'auto-backup') setTimeout(runAutoBackup, 60);
  if (toolId === 'branding') setTimeout(runBranding, 60);
}

function findTool(id) {
  if (typeof ToolsCatalog !== 'undefined') {
    const r = ToolsCatalog.recommendedTools?.find(t => t.id === id);
    if (r) return r;
    const f = ToolsCatalog.freeFastTools?.find(t => t.id === id);
    if (f) return f;
    for (const c of (ToolsCatalog.proCategories || [])) {
      const p = c.tools?.find(t => t.id === id);
      if (p) return p;
    }
    const o = ToolsCatalog.officialTools?.find(t => t.id === id);
    if (o) return o;
  }
  return null;
}

function closeModal(id, event) {
  if (id === 'paywallModal' && event && event.target === document.getElementById('paywallModal')) {
    handlePaywallOverlayClick(event);
    return;
  }
  if (event && event.target !== document.getElementById(id)) return;
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
  if (id === 'toolModal') {
    const dialog = document.getElementById('toolModalDialog');
    if (dialog) {
      dialog.classList.remove('modal-fullscreen');
      dialog.classList.add(currentModalSizeClass || 'modal-lg');
      isModalFullscreen = false;
      const icon = document.getElementById('modalExpandIcon');
      if (icon) icon.className = 'fa-solid fa-expand';
    }
  }
}

// ================================================================
// TOOL FORM HTML BUILDERS
// ================================================================
function getToolFormHTML(toolId) {
  switch (toolId) {
    case 'lb-pcc-ultimate': return formLBPCCUltimate();
    case 'lb-failover':     return formFailover();
    case 'queue-burst':     return formQueueBurst();
    case 'queue-tree':      return formQueueTree();
    case 'pon-calc':        return formPONCalc();
    case 'hotspot':         return formHotspot();
    case 'hotspot-user':    return formHotspotUser();
    case 'firewall':        return formFirewall();
    case 'port-forward':    return formPortForward();
    case 'game-qos':        return formGameQoS();
    case 'vpn-wireguard':   return formVPN('wireguard');
    case 'vpn-l2tp':        return formVPN('l2tp');
    case 'vpn-pptp':        return formVPN('pptp');
    case 'vpn-sstp':        return formVPN('sstp');
    case 'netwatch':        return formNetwatch();
    case 'auto-backup':     return formAutoBackup();
    case 'branding':        return formBranding();
    default:                return `<div style="padding:40px;text-align:center;color:var(--text-muted)"><i class="fa-solid fa-wrench" style="font-size:48px;margin-bottom:16px;display:block"></i><p>Tool generator sedang dikembangkan.</p></div>`;
  }
}

// ================================================================
// LB PCC ULTIMATE FORM
// ================================================================
function formLBPCCUltimate() {
  return `<div style="display:grid;grid-template-columns:340px 1fr;height:calc(92vh - 80px)">
    <!-- CONFIG PANEL -->
    <div style="overflow-y:auto;padding:20px;border-right:1px solid var(--border-color);display:flex;flex-direction:column;gap:14px">

      <div class="info-box"><i class="fa-solid fa-circle-info"></i> Generator script Load Balancing PCC untuk 2-15 ISP dengan mode LOCAL, RECURSIVE, HYBRID. Support ROS v6 & v7.</div>

      <!-- Mode -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-sliders"></i> Mode LB PCC</div>
        <div class="mode-selector" id="pccModeSelector">
          <button class="mode-btn active" onclick="setPCCMode('LOCAL')">LOCAL</button>
          <button class="mode-btn" onclick="setPCCMode('RECURSIVE')">RECURSIVE</button>
          <button class="mode-btn" onclick="setPCCMode('HYBRID')">HYBRID</button>
        </div>
        <input type="hidden" id="pccMode" value="LOCAL">
        <div id="modeDesc" style="font-size:11px;color:var(--text-muted);margin-top:8px;padding:8px;background:rgba(0,0,0,0.2);border-radius:6px">
          <b style="color:var(--brand-orange)">LOCAL</b> — PCC dengan check-gateway standard. Cocok untuk ISP stabil.
        </div>
      </div>

      <!-- ROS Version -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-microchip"></i> RouterOS Version</div>
        <div style="display:flex;gap:8px">
          <label class="form-check" style="flex:1;background:rgba(56,189,248,0.06);border:1px solid rgba(56,189,248,0.2);border-radius:8px;padding:8px 12px;cursor:pointer">
            <input type="radio" name="pccROS" value="v6" id="rosV6"> <span>v6.x (stable)</span>
          </label>
          <label class="form-check" style="flex:1;background:rgba(63,211,192,0.06);border:1px solid rgba(63,211,192,0.2);border-radius:8px;padding:8px 12px;cursor:pointer">
            <input type="radio" name="pccROS" value="v7" id="rosV7" checked> <span>v7.x (latest)</span>
          </label>
        </div>
      </div>

      <!-- ISP Count -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-tower-broadcast"></i> Jumlah ISP</div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
          <input type="range" id="ispCount" min="2" max="15" value="2" oninput="updateISPCount(this.value)">
          <span style="font-size:18px;font-weight:800;color:var(--brand-orange);min-width:24px;text-align:center" id="ispCountVal">2</span>
        </div>
        <button class="btn btn-secondary btn-sm btn-full" onclick="renderISPRows()"><i class="fa-solid fa-sync"></i> Update ISP Fields</button>
      </div>

      <!-- LAN Settings -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-house-network"></i> LAN Settings</div>
        <div class="form-group">
          <label class="form-label">LAN Interface</label>
          <input class="form-control form-control-mono" id="pccLanIface" value="bridge-lan" placeholder="bridge-lan / ether5">
        </div>
        <div class="form-group">
          <label class="form-label">LAN Subnet</label>
          <input class="form-control form-control-mono" id="pccLanSubnet" value="192.168.88.0/24">
        </div>
        <div class="form-group mb-0">
          <label class="form-label">LAN Gateway IP</label>
          <input class="form-control form-control-mono" id="pccLanGw" value="192.168.88.1">
        </div>
      </div>

      <!-- Options -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-gear"></i> Options</div>
        <label class="form-check"><input type="checkbox" id="pccCheckGw" checked> Check-Gateway (ping)</label>
        <label class="form-check"><input type="checkbox" id="pccNat" checked> Include NAT Masquerade</label>
        <label class="form-check"><input type="checkbox" id="pccAddrList" checked> Include Address List (Bogon)</label>
        <label class="form-check"><input type="checkbox" id="pccBypassList" checked> Bypass Direct Traffic (BYPASS_PCC Banking/WA)</label>
        <label class="form-check"><input type="checkbox" id="pccClampMss" checked> Clamp MSS to PMTU (Cegah MTU drop)</label>
        <label class="form-check"><input type="checkbox" id="pccDns" checked> Configure DNS</label>
        <label class="form-check"><input type="checkbox" id="pccDhcp"> Include DHCP Server</label>
        <div class="form-group mt-2 mb-0">
          <label class="form-label">PCC Classifier</label>
          <select class="form-control" id="pccClassifier">
            <option value="both-addresses-and-ports">both-addresses-and-ports (recommended)</option>
            <option value="both-addresses">both-addresses</option>
            <option value="src-address-and-port">src-address-and-port</option>
            <option value="dst-address-and-port">dst-address-and-port</option>
          </select>
        </div>
        <div class="form-group mt-2 mb-0">
          <label class="form-label">DNS Servers</label>
          <input class="form-control form-control-mono" id="pccDnsServers" value="1.1.1.1,8.8.8.8">
        </div>
      </div>

      <!-- ISP Rows -->
      <div id="ispRowsContainer"></div>

      <button class="btn btn-primary btn-lg" onclick="runPCCUltimate()">
        <i class="fa-solid fa-play"></i> Generate Script
      </button>
    </div>

    <!-- OUTPUT PANEL -->
    <div style="display:flex;flex-direction:column;padding:20px;gap:12px">
      <div style="display:flex;gap:8px;align-items:center">
        <div style="flex:1;font-size:13px;font-weight:600;color:var(--text-secondary)"><i class="fa-solid fa-terminal text-orange"></i> Output Script</div>
        <button class="btn btn-secondary btn-sm" onclick="copyOutput('pccOutput')"><i class="fa-solid fa-copy"></i> Copy</button>
        <button class="btn btn-secondary btn-sm" onclick="downloadOutput('pccOutput','lb-pcc-comittools.rsc')"><i class="fa-solid fa-download"></i> .rsc</button>
        <button class="btn btn-teal btn-sm" onclick="runPCCUltimate()"><i class="fa-solid fa-bolt"></i> Generate</button>
      </div>
      <div class="terminal-header">
        <div class="terminal-dots"><div class="terminal-dot red"></div><div class="terminal-dot yellow"></div><div class="terminal-dot green"></div></div>
        <div class="terminal-filename"><i class="fa-solid fa-terminal"></i> lb-pcc-comittools.rsc</div>
        <div></div>
      </div>
      <textarea class="terminal-output" id="pccOutput" style="min-height:calc(92vh - 280px);border:1px solid var(--border-color);border-top:none;border-radius:0 0 var(--radius-md) var(--radius-md)" readonly placeholder="# Click 'Generate Script' untuk membuat script LB PCC..."></textarea>
    </div>
  </div>

  <script>
    // Init ISP rows on open
    setTimeout(() => {
      renderISPRows();
      updateISPCount(2);
    }, 50);
  </script>`;
}

// ================================================================
// ISP ROWS MANAGEMENT
// ================================================================
function updateISPCount(val) {
  document.getElementById('ispCountVal').textContent = val;
}

function renderISPRows() {
  const count = parseInt(document.getElementById('ispCount')?.value) || 2;
  const container = document.getElementById('ispRowsContainer');
  if (!container) return;

  const colors = ['#ff5c00','#3fd3c0','#38bdf8','#f59e0b','#ef4444','#22c55e','#c084fc','#f472b6','#86efac','#7dd3fc','#fcd34d','#fb923c','#a78bfa','#34d399','#f87171'];

  let html = `<div class="config-section">
    <div class="config-section-title"><i class="fa-solid fa-tower-broadcast"></i> ISP Configuration (${count})</div>`;

  for (let i = 0; i < count; i++) {
    const col = colors[i % colors.length];
    const gateways = ['192.168.1.1','192.168.2.1','192.168.3.1','192.168.4.1','10.0.0.1','10.1.0.1','172.16.0.1','172.16.1.1','192.168.5.1','192.168.6.1','192.168.7.1','192.168.8.1','192.168.9.1','192.168.10.1','192.168.11.1'];
    const ethers = ['ether1','ether2','ether3','ether4','ether5','ether6','ether7','ether8','ether9','ether10','ether11','ether12','ether13','ether14','ether15'];
    const checkIps = ['8.8.8.8','1.1.1.1','8.8.4.4','1.0.0.1','208.67.222.222','208.67.220.220','9.9.9.9','149.112.112.112','76.76.19.19','76.223.122.150','185.228.168.9','185.228.169.9','64.6.64.6','64.6.65.6','77.88.8.8'];

    html += `<div class="isp-row" style="border-left:3px solid ${col}">
      <div class="isp-row-header">
        <span class="isp-num">ISP ${i+1}</span>
        <div style="display:flex;align-items:center;gap:6px">
          <div class="isp-color-dot" style="background:${col}"></div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Nama ISP</label>
        <input class="form-control form-control-mono" id="isp${i}_name" value="ISP${i+1}" placeholder="ISP1">
      </div>
      <div class="form-row">
        <div class="form-group mb-0">
          <label class="form-label">WAN Interface</label>
          <input class="form-control form-control-mono" id="isp${i}_iface" value="${ethers[i]}" placeholder="ether1">
        </div>
        <div class="form-group mb-0">
          <label class="form-label">Gateway IP</label>
          <input class="form-control form-control-mono" id="isp${i}_gw" value="${gateways[i]}" placeholder="192.168.1.1">
        </div>
      </div>
      <div class="form-row mt-2">
        <div class="form-group mb-0" style="flex:1">
          <label class="form-label">Ratio / Weight (1-10)</label>
          <input type="number" min="1" max="10" class="form-control form-control-mono" id="isp${i}_weight" value="1" placeholder="1">
        </div>
        <div class="form-group mb-0" style="flex:1">
          <label class="form-label">IP/Mask (opsional)</label>
          <input class="form-control form-control-mono" id="isp${i}_ip" value="" placeholder="192.168.1.2/24">
        </div>
      </div>
      <div class="form-group mb-0 mt-2">
        <label class="form-label">Check IP (Recursive)</label>
        <input class="form-control form-control-mono" id="isp${i}_checkip" value="${checkIps[i]}" placeholder="8.8.8.8">
      </div>
    </div>`;
  }

  html += '</div>';
  container.innerHTML = html;
}

function setPCCMode(mode) {
  document.getElementById('pccMode').value = mode;
  document.querySelectorAll('#pccModeSelector .mode-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  const desc = {
    LOCAL: '<b style="color:var(--brand-orange)">LOCAL</b> — PCC dengan check-gateway standard. Cocok untuk ISP yang stabil.',
    RECURSIVE: '<b style="color:var(--brand-teal)">RECURSIVE</b> — Routing rekursif untuk failover otomatis via gateway reachability check. Lebih handal.',
    HYBRID: '<b style="color:#c084fc">HYBRID</b> — Kombinasi PCC + recursive check. Best of both worlds: distribusi merata + failover.'
  };
  document.getElementById('modeDesc').innerHTML = desc[mode];
}

// ================================================================
// RUN PCC ULTIMATE
// ================================================================
function runPCCUltimate() {
  const count = parseInt(document.getElementById('ispCount')?.value) || 2;
  const isps = [];

  for (let i = 0; i < count; i++) {
    isps.push({
      name: document.getElementById(`isp${i}_name`)?.value || `ISP${i+1}`,
      iface: document.getElementById(`isp${i}_iface`)?.value || `ether${i+1}`,
      gateway: document.getElementById(`isp${i}_gw`)?.value || `192.168.${i+1}.1`,
      ip: document.getElementById(`isp${i}_ip`)?.value || '',
      checkIp: document.getElementById(`isp${i}_checkip`)?.value || '',
      weight: parseInt(document.getElementById(`isp${i}_weight`)?.value) || 1
    });
  }

  const rosV = document.querySelector('input[name="pccROS"]:checked')?.value || 'v7';

  const cfg = {
    rosVersion: rosV,
    mode: document.getElementById('pccMode')?.value || 'LOCAL',
    isps,
    lanIface: document.getElementById('pccLanIface')?.value || 'bridge-lan',
    lanSubnet: document.getElementById('pccLanSubnet')?.value || '192.168.88.0/24',
    lanGateway: document.getElementById('pccLanGw')?.value || '192.168.88.1',
    pccClassifier: document.getElementById('pccClassifier')?.value || 'both-addresses-and-ports',
    checkGateway: document.getElementById('pccCheckGw')?.checked,
    includeNat: document.getElementById('pccNat')?.checked,
    includeAddrList: document.getElementById('pccAddrList')?.checked,
    includeBypassList: document.getElementById('pccBypassList')?.checked,
    clampMss: document.getElementById('pccClampMss')?.checked,
    includeDns: document.getElementById('pccDns')?.checked,
    includeDhcp: document.getElementById('pccDhcp')?.checked,
    dnsServers: document.getElementById('pccDnsServers')?.value || '1.1.1.1,8.8.8.8',
    includeComments: true
  };

  try {
    const script = LB_PCC.generate(cfg);
    document.getElementById('pccOutput').value = script;
    showToast(`✅ Script LB PCC (${count} ISP, ${cfg.mode}) berhasil digenerate!`, 'success');
  } catch(e) {
    document.getElementById('pccOutput').value = `# Error: ${e.message}`;
    showToast('❌ Error: ' + e.message, 'error');
  }
}

// ================================================================
// QUEUE & BURST FORM
// ================================================================
function formQueueBurst() {
  return `<div style="display:grid;grid-template-columns:300px 1fr;height:calc(92vh - 80px)">
    <div style="overflow-y:auto;padding:20px;border-right:1px solid var(--border-color);display:flex;flex-direction:column;gap:14px">

      <div class="info-box"><i class="fa-solid fa-circle-info"></i> Kalkulator Rate Limit MikroTik — Max Limit, Burst Limit, Threshold, Limit At secara akurat.</div>

      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-sliders"></i> Jenis Queue</div>
        <div style="display:flex;gap:8px">
          <label class="form-check" style="flex:1;background:rgba(63,211,192,0.06);border:1px solid rgba(63,211,192,0.2);border-radius:8px;padding:8px;cursor:pointer">
            <input type="radio" name="qType" value="simple" checked> Simple Queue
          </label>
          <label class="form-check" style="flex:1;background:rgba(255,92,0,0.06);border:1px solid rgba(255,92,0,0.2);border-radius:8px;padding:8px;cursor:pointer">
            <input type="radio" name="qType" value="tree"> Queue Tree
          </label>
        </div>
      </div>

      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-user"></i> Target</div>
        <div class="form-group">
          <label class="form-label">Queue Name</label>
          <input class="form-control form-control-mono" id="qName" value="Client-001">
        </div>
        <div class="form-group mb-0">
          <label class="form-label">Target IP/Subnet</label>
          <input class="form-control form-control-mono" id="qTarget" value="192.168.88.100/32">
        </div>
      </div>

      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-gauge-high"></i> Bandwidth</div>
        <div class="form-row">
          <div class="form-group mb-0">
            <label class="form-label">Download Max</label>
            <input class="form-control form-control-mono" id="qDown" value="10M" oninput="updateQueuePreview()">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Upload Max</label>
            <input class="form-control form-control-mono" id="qUp" value="5M" oninput="updateQueuePreview()">
          </div>
        </div>
        <div class="form-group mt-2">
          <label class="form-label">Burst Multiplier (×Max)</label>
          <div style="display:flex;align-items:center;gap:10px">
            <input type="range" id="qBurstMult" min="1" max="5" step="0.5" value="2" oninput="updateQueuePreview();document.getElementById('qBurstMultVal').textContent=this.value+'x'">
            <span id="qBurstMultVal" style="color:var(--brand-orange);font-weight:700;min-width:30px">2x</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Threshold % dari Max</label>
          <div style="display:flex;align-items:center;gap:10px">
            <input type="range" id="qThreshPct" min="50" max="90" step="5" value="75" oninput="updateQueuePreview();document.getElementById('qThreshPctVal').textContent=this.value+'%'">
            <span id="qThreshPctVal" style="color:var(--brand-teal);font-weight:700;min-width:35px">75%</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Limit-At % (Guaranteed)</label>
          <div style="display:flex;align-items:center;gap:10px">
            <input type="range" id="qLimitAtPct" min="10" max="80" step="5" value="50" oninput="updateQueuePreview();document.getElementById('qLimitAtPctVal').textContent=this.value+'%'">
            <span id="qLimitAtPctVal" style="color:#c084fc;font-weight:700;min-width:35px">50%</span>
          </div>
        </div>
        <div class="form-group mb-0">
          <label class="form-label">Burst Time</label>
          <select class="form-control" id="qBurstTime">
            <option value="16/16">16s / 16s (Standard)</option>
            <option value="8/8">8s / 8s (VIP)</option>
            <option value="32/32">32s / 32s (ISP Grade)</option>
          </select>
        </div>
      </div>

      <!-- Live Calculator Preview -->
      <div class="config-section" id="qCalcPreview">
        <div class="config-section-title"><i class="fa-solid fa-calculator"></i> Live Kalkulator</div>
        <div id="qCalcTable" style="font-size:11px">—</div>
      </div>

      <div class="form-group">
        <label class="form-label">Priority (1=Highest, 8=Lowest)</label>
        <select class="form-control" id="qPriority">
          <option value="1">1 — Highest (Real-time)</option>
          <option value="2">2 — VoIP</option>
          <option value="4">4 — Normal High</option>
          <option value="8" selected>8 — Default</option>
        </select>
      </div>

      <button class="btn btn-primary btn-lg" onclick="runQueueBurst()">
        <i class="fa-solid fa-play"></i> Generate Script
      </button>
    </div>

    <div style="display:flex;flex-direction:column;padding:20px;gap:12px">
      <div style="display:flex;gap:8px;align-items:center">
        <div style="flex:1;font-size:13px;font-weight:600;color:var(--text-secondary)"><i class="fa-solid fa-terminal text-teal"></i> Queue Script Output</div>
        <button class="btn btn-secondary btn-sm" onclick="copyOutput('queueOutput')"><i class="fa-solid fa-copy"></i> Copy</button>
        <button class="btn btn-secondary btn-sm" onclick="downloadOutput('queueOutput','queue-comittools.rsc')"><i class="fa-solid fa-download"></i> .rsc</button>
        <button class="btn btn-teal btn-sm" onclick="runQueueBurst()"><i class="fa-solid fa-bolt"></i> Generate</button>
      </div>
      <textarea class="terminal-output" id="queueOutput" style="flex:1;border:1px solid var(--border-color);border-radius:var(--radius-md)" readonly placeholder="# Set parameter lalu klik Generate Script..."></textarea>
    </div>
  </div>

  <script>setTimeout(updateQueuePreview, 100);</script>`;
}

function updateQueuePreview() {
  const down = document.getElementById('qDown')?.value || '10M';
  const up = document.getElementById('qUp')?.value || '5M';
  const mult = parseFloat(document.getElementById('qBurstMult')?.value) || 2;
  const thPct = parseFloat(document.getElementById('qThreshPct')?.value) / 100 || 0.75;
  const laPct = parseFloat(document.getElementById('qLimitAtPct')?.value) / 100 || 0.5;

  if (typeof QueueGen === 'undefined') return;

  const vals = QueueGen.calculate({ downMax: down, upMax: up, burstMultiplier: mult, thresholdPct: thPct * 100, limitAtPct: laPct * 100, burstTime: '16/16' });

  const el = document.getElementById('qCalcTable');
  if (!el) return;
  el.innerHTML = `
    <table style="width:100%;font-size:11px;border-collapse:collapse">
      <tr style="border-bottom:1px solid var(--border-color)">
        <th style="padding:5px 0;color:var(--text-muted);text-align:left">Parameter</th>
        <th style="padding:5px;color:var(--text-muted)">Upload</th>
        <th style="padding:5px;color:var(--text-muted)">Download</th>
      </tr>
      <tr><td style="padding:5px 0;color:var(--text-secondary)">Max Limit</td><td style="padding:5px;text-align:center;font-family:monospace;color:var(--brand-orange)">${QueueGen.formatBW(vals.raw.upBps)}</td><td style="padding:5px;text-align:center;font-family:monospace;color:var(--brand-orange)">${QueueGen.formatBW(vals.raw.downBps)}</td></tr>
      <tr><td style="padding:5px 0;color:var(--text-secondary)">Burst Limit</td><td style="padding:5px;text-align:center;font-family:monospace;color:#22c55e">${QueueGen.formatBW(vals.raw.upBurst)}</td><td style="padding:5px;text-align:center;font-family:monospace;color:#22c55e">${QueueGen.formatBW(vals.raw.downBurst)}</td></tr>
      <tr><td style="padding:5px 0;color:var(--text-secondary)">Burst Threshold</td><td style="padding:5px;text-align:center;font-family:monospace;color:var(--brand-teal)">${QueueGen.formatBW(vals.raw.upThresh)}</td><td style="padding:5px;text-align:center;font-family:monospace;color:var(--brand-teal)">${QueueGen.formatBW(vals.raw.downThresh)}</td></tr>
      <tr><td style="padding:5px 0;color:var(--text-secondary)">Limit-At (Min)</td><td style="padding:5px;text-align:center;font-family:monospace;color:#c084fc">${QueueGen.formatBW(vals.raw.upLimitAt)}</td><td style="padding:5px;text-align:center;font-family:monospace;color:#c084fc">${QueueGen.formatBW(vals.raw.downLimitAt)}</td></tr>
    </table>`;
}

function runQueueBurst() {
  if (typeof QueueGen === 'undefined') { showToast('QueueGen not loaded', 'error'); return; }
  const cfg = {
    queueName: document.getElementById('qName')?.value || 'Client-001',
    target: document.getElementById('qTarget')?.value || '192.168.88.100',
    downMax: document.getElementById('qDown')?.value || '10M',
    upMax: document.getElementById('qUp')?.value || '5M',
    burstMultiplier: parseFloat(document.getElementById('qBurstMult')?.value) || 2,
    thresholdPct: parseFloat(document.getElementById('qThreshPct')?.value) || 75,
    limitAtPct: parseFloat(document.getElementById('qLimitAtPct')?.value) || 50,
    burstTime: document.getElementById('qBurstTime')?.value || '16/16',
    priority: document.getElementById('qPriority')?.value || '8',
    burstEnabled: true,
  };

  const qType = document.querySelector('input[name="qType"]:checked')?.value;
  let script;
  if (qType === 'tree') {
    script = QueueGen.generateQueueTree({ totalDown: cfg.downMax, totalUp: cfg.upMax, clients: [{ name: cfg.queueName, target: cfg.target }] });
  } else {
    script = QueueGen.generate(cfg);
  }
  document.getElementById('queueOutput').value = script;
  showToast('✅ Queue script berhasil digenerate!', 'success');
}

// ================================================================
// PON CALC FORM
// ================================================================
function formPONCalc() {
  return `<div style="display:grid;grid-template-columns:320px 1fr;height:calc(92vh - 80px)">
    <div style="overflow-y:auto;padding:20px;border-right:1px solid var(--border-color);display:flex;flex-direction:column;gap:14px">

      <div class="info-box"><i class="fa-solid fa-circle-info"></i> Kalkulator PON (Passive Optical Network) — Full Ratio 1:4 s/d 1:128. Hitung bandwidth per ONT dan generate queue script.</div>

      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-tower-cell"></i> OLT Bandwidth</div>
        <div class="form-group">
          <label class="form-label">Total OLT Uplink (Mbps)</label>
          <input class="form-control form-control-mono" id="ponOLT" value="1000" type="number" oninput="updatePONPreview()">
        </div>
        <div class="form-group mb-0">
          <label class="form-label">Standar OLT</label>
          <select class="form-control" id="ponStandard" onchange="setPONStandard()">
            <option value="1000">Custom</option>
            <option value="1250">EPON (1.25 Gbps)</option>
            <option value="2488" selected>GPON (2.488 Gbps)</option>
            <option value="9953">XGS-PON (9.953 Gbps)</option>
          </select>
        </div>
      </div>

      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-split"></i> Split Ratio</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px" id="ponRatioSelector">
          ${[4,8,16,32,64,128].map(r => `<button class="mode-btn${r===32?' active':''}" onclick="setPONRatio(${r},this)">1:${r}</button>`).join('')}
        </div>
        <input type="hidden" id="ponRatio" value="32">
      </div>

      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-house-signal"></i> ONT Settings</div>
        <div class="form-group">
          <label class="form-label">Jumlah ONT Aktif</label>
          <input class="form-control form-control-mono" id="ponONTCount" value="16" type="number" min="1" max="128" oninput="updatePONPreview()">
        </div>
        <div class="form-group">
          <label class="form-label">Usage Factor (Concurrency)</label>
          <div style="display:flex;align-items:center;gap:10px">
            <input type="range" id="ponUsage" min="0.1" max="1" step="0.05" value="0.7" oninput="updatePONPreview();document.getElementById('ponUsageVal').textContent=Math.round(this.value*100)+'%'">
            <span id="ponUsageVal" style="color:var(--brand-orange);font-weight:700;min-width:35px">70%</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Guaranteed BW %</label>
          <div style="display:flex;align-items:center;gap:10px">
            <input type="range" id="ponGuarPct" min="10" max="50" step="5" value="20" oninput="updatePONPreview();document.getElementById('ponGuarPctVal').textContent=this.value+'%'">
            <span id="ponGuarPctVal" style="color:var(--brand-teal);font-weight:700;min-width:35px">20%</span>
          </div>
        </div>
        <div class="form-group mb-0">
          <label class="form-label">Burst Multiplier</label>
          <div style="display:flex;align-items:center;gap:10px">
            <input type="range" id="ponBurstMult" min="1" max="4" step="0.5" value="2" oninput="updatePONPreview();document.getElementById('ponBurstMultVal').textContent=this.value+'x'">
            <span id="ponBurstMultVal" style="color:#c084fc;font-weight:700;min-width:35px">2x</span>
          </div>
        </div>
      </div>

      <!-- PON Result Preview -->
      <div class="config-section" id="ponPreview">
        <div class="config-section-title"><i class="fa-solid fa-chart-pie"></i> Hasil Kalkulasi</div>
        <div id="ponPreviewContent" style="font-size:12px;color:var(--text-muted)">Geser slider untuk melihat kalkulasi live...</div>
      </div>

      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-server"></i> Script Options</div>
        <div class="form-group">
          <label class="form-label">Base IP ONT</label>
          <input class="form-control form-control-mono" id="ponBaseIP" value="192.168.1.">
        </div>
        <div class="form-row">
          <div class="form-group mb-0">
            <label class="form-label">Start IP</label>
            <input class="form-control form-control-mono" id="ponStartIP" value="2">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Parent Iface</label>
            <input class="form-control form-control-mono" id="ponParentIface" value="ether1-uplink">
          </div>
        </div>
      </div>

      <button class="btn btn-primary btn-lg" onclick="runPONCalc()">
        <i class="fa-solid fa-calculator"></i> Generate PON Script
      </button>
    </div>

    <div style="display:flex;flex-direction:column;padding:20px;gap:12px">
      <div style="display:flex;gap:8px;align-items:center">
        <div style="flex:1;font-size:13px;font-weight:600;color:var(--text-secondary)"><i class="fa-solid fa-terminal text-amber"></i> PON Queue Script</div>
        <button class="btn btn-secondary btn-sm" onclick="copyOutput('ponOutput')"><i class="fa-solid fa-copy"></i> Copy</button>
        <button class="btn btn-secondary btn-sm" onclick="downloadOutput('ponOutput','pon-queue-comittools.rsc')"><i class="fa-solid fa-download"></i> .rsc</button>
      </div>
      <textarea class="terminal-output" id="ponOutput" style="flex:1;border:1px solid var(--border-color);border-radius:var(--radius-md)" readonly placeholder="# Atur parameter PON lalu klik Generate..."></textarea>
    </div>
  </div>
  <script>setTimeout(updatePONPreview, 100);</script>`;
}

function setPONRatio(r, btn) {
  document.getElementById('ponRatio').value = r;
  document.querySelectorAll('#ponRatioSelector .mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  updatePONPreview();
}

function setPONStandard() {
  const sel = document.getElementById('ponStandard');
  const val = sel.value;
  if (val !== '1000') document.getElementById('ponOLT').value = val;
  updatePONPreview();
}

function updatePONPreview() {
  if (typeof PONCalc === 'undefined') return;
  const cfg = getPONConfig();
  const r = PONCalc.calculate(cfg);
  const el = document.getElementById('ponPreviewContent');
  if (!el) return;
  el.innerHTML = `
    <div class="pon-result-grid" style="grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:8px">
      <div class="pon-result-card"><div class="pon-result-value">${r.perOntEffective}</div><div class="pon-result-label">Per ONT (Effective)</div></div>
      <div class="pon-result-card"><div class="pon-result-value" style="color:var(--brand-teal)">${r.perOntGuaranteed}</div><div class="pon-result-label">Guaranteed (CIR)</div></div>
      <div class="pon-result-card"><div class="pon-result-value" style="color:#c084fc">${r.perOntBurst}</div><div class="pon-result-label">Burst Peak</div></div>
      <div class="pon-result-card"><div class="pon-result-value" style="color:${parseFloat(r.utilization)>90?'#ef4444':'#22c55e'}">${r.utilization}</div><div class="pon-result-label">Utilisasi</div></div>
    </div>
    <div style="font-size:11px;color:var(--text-muted)">Total OLT: <b style="color:#fff">${r.oltBW}</b> | Rasio: <b style="color:var(--brand-orange)">${r.ratio}</b> | ONT: <b style="color:#fff">${r.ontCount}</b></div>`;
}

function getPONConfig() {
  return {
    oltBandwidth: parseFloat(document.getElementById('ponOLT')?.value) || 2488,
    splitRatio: parseInt(document.getElementById('ponRatio')?.value) || 32,
    ontCount: parseInt(document.getElementById('ponONTCount')?.value) || 16,
    usageFactor: parseFloat(document.getElementById('ponUsage')?.value) || 0.7,
    guaranteedPct: parseFloat(document.getElementById('ponGuarPct')?.value) || 20,
    burstMultiplier: parseFloat(document.getElementById('ponBurstMult')?.value) || 2,
  };
}

function runPONCalc() {
  if (typeof PONCalc === 'undefined') { showToast('PONCalc not loaded', 'error'); return; }
  const cfg = {
    ...getPONConfig(),
    baseIp: document.getElementById('ponBaseIP')?.value || '192.168.1.',
    startIp: parseInt(document.getElementById('ponStartIP')?.value) || 2,
    parentIface: document.getElementById('ponParentIface')?.value || 'ether1-uplink',
  };
  const script = PONCalc.generateScript(cfg);
  document.getElementById('ponOutput').value = script;
  showToast('✅ PON Queue script berhasil digenerate!', 'success');
}

// ================================================================
// FIREWALL FORM (simplified)
// ================================================================
function formFirewall() {
  return `<div style="display:grid;grid-template-columns:300px 1fr;height:calc(92vh - 80px)">
    <div style="overflow-y:auto;padding:20px;border-right:1px solid var(--border-color);display:flex;flex-direction:column;gap:14px">
      <div class="info-box"><i class="fa-solid fa-shield-halved"></i> Firewall hardening script lengkap untuk MikroTik RouterOS.</div>

      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-microchip"></i> RouterOS</div>
        <div style="display:flex;gap:8px">
          <label class="form-check" style="flex:1;background:rgba(56,189,248,0.06);border:1px solid rgba(56,189,248,0.2);border-radius:8px;padding:8px;cursor:pointer">
            <input type="radio" name="fwROS" value="v6"> v6.x
          </label>
          <label class="form-check" style="flex:1;background:rgba(63,211,192,0.06);border:1px solid rgba(63,211,192,0.2);border-radius:8px;padding:8px;cursor:pointer">
            <input type="radio" name="fwROS" value="v7" checked> v7.x
          </label>
        </div>
      </div>

      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-plug"></i> Interface</div>
        <div class="form-group"><label class="form-label">WAN Interface</label><input class="form-control form-control-mono" id="fwWan" value="ether1"></div>
        <div class="form-group mb-0"><label class="form-label">LAN Interface</label><input class="form-control form-control-mono" id="fwLan" value="bridge-lan"></div>
      </div>

      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-toggle-on"></i> Proteksi</div>
        <label class="form-check"><input type="checkbox" id="fwWinbox" checked> Winbox Brute-force Protection</label>
        <label class="form-check"><input type="checkbox" id="fwSSH" checked> SSH Brute-force Protection</label>
        <label class="form-check"><input type="checkbox" id="fwAPI" checked> Block API dari WAN</label>
        <label class="form-check"><input type="checkbox" id="fwSyn" checked> Anti SYN Flood</label>
        <label class="form-check"><input type="checkbox" id="fwUDP" checked> Anti UDP Flood</label>
        <label class="form-check"><input type="checkbox" id="fwPSD" checked> Port Scan Detection</label>
        <label class="form-check"><input type="checkbox" id="fwBogon" checked> Block Bogon IP</label>
        <label class="form-check"><input type="checkbox" id="fwDNS" checked> Block DNS dari WAN</label>
        <label class="form-check"><input type="checkbox" id="fwICMP" checked> Rate Limit ICMP</label>
        <label class="form-check"><input type="checkbox" id="fwInvalid" checked> Drop Invalid Packets</label>
        <label class="form-check"><input type="checkbox" id="fwIsolation"> Client Isolation (LAN-LAN)</label>
      </div>

      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-clock"></i> Blacklist Timeout</div>
        <select class="form-control" id="fwBlTimeout">
          <option value="1h">1 jam</option>
          <option value="6h">6 jam</option>
          <option value="1d" selected>1 hari</option>
          <option value="7d">7 hari</option>
        </select>
      </div>

      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-address-book"></i> Trusted Management IPs</div>
        <input class="form-control form-control-mono" id="fwTrustIP" placeholder="192.168.88.10,192.168.88.20" style="font-size:11px">
        <div style="font-size:10px;color:var(--text-muted);margin-top:4px">Kosongkan jika tidak ada (pisahkan dengan koma)</div>
      </div>

      <button class="btn btn-primary btn-lg" onclick="runFirewall()"><i class="fa-solid fa-play"></i> Generate Script</button>
    </div>

    <div style="display:flex;flex-direction:column;padding:20px;gap:12px">
      <div style="display:flex;gap:8px">
        <div style="flex:1;font-size:13px;font-weight:600;color:var(--text-secondary)"><i class="fa-solid fa-shield-halved text-rose"></i> Firewall Script</div>
        <button class="btn btn-secondary btn-sm" onclick="copyOutput('fwOutput')"><i class="fa-solid fa-copy"></i> Copy</button>
        <button class="btn btn-secondary btn-sm" onclick="downloadOutput('fwOutput','firewall-comittools.rsc')"><i class="fa-solid fa-download"></i> .rsc</button>
        <button class="btn btn-teal btn-sm" onclick="runFirewall()"><i class="fa-solid fa-bolt"></i> Generate</button>
      </div>
      <textarea class="terminal-output" id="fwOutput" style="flex:1;border:1px solid var(--border-color);border-radius:var(--radius-md)" readonly placeholder="# Klik Generate untuk membuat firewall script..."></textarea>
    </div>
  </div>`;
}

function runFirewall() {
  if (typeof FirewallGen === 'undefined') { showToast('FirewallGen not loaded', 'error'); return; }
  const cfg = {
    rosVersion: document.querySelector('input[name="fwROS"]:checked')?.value || 'v7',
    wanIface: document.getElementById('fwWan')?.value || 'ether1',
    lanIface: document.getElementById('fwLan')?.value || 'bridge-lan',
    protectWinbox: document.getElementById('fwWinbox')?.checked,
    protectSSH: document.getElementById('fwSSH')?.checked,
    protectAPI: document.getElementById('fwAPI')?.checked,
    antiSynFlood: document.getElementById('fwSyn')?.checked,
    antiUDPFlood: document.getElementById('fwUDP')?.checked,
    portScanDetect: document.getElementById('fwPSD')?.checked,
    blockBogon: document.getElementById('fwBogon')?.checked,
    blockDNSFromWAN: document.getElementById('fwDNS')?.checked,
    enableICMPLimit: document.getElementById('fwICMP')?.checked,
    dropInvalidPackets: document.getElementById('fwInvalid')?.checked,
    clientIsolation: document.getElementById('fwIsolation')?.checked,
    blacklistTimeout: document.getElementById('fwBlTimeout')?.value || '1d',
    allowedManageIPs: document.getElementById('fwTrustIP')?.value || '',
  };
  const script = FirewallGen.generate(cfg);
  document.getElementById('fwOutput').value = script;
  showToast('✅ Firewall script berhasil digenerate!', 'success');
}

// ================================================================
// PORT FORWARD FORM
// ================================================================
function formPortForward() { return buildPortForwardForm(); }

function buildPortForwardForm() {
  return `<div style="padding:20px;height:calc(92vh - 80px);overflow-y:auto">
    <div class="info-box"><i class="fa-solid fa-arrow-right-arrow-left"></i> Generator rule dst-nat untuk port forwarding.</div>
    <div style="display:grid;grid-template-columns:280px 1fr;gap:20px;margin-top:16px">
      <div>
        <div class="config-section">
          <div class="config-section-title"><i class="fa-solid fa-plug"></i> Interface</div>
          <div class="form-group"><label class="form-label">WAN Interface</label><input class="form-control form-control-mono" id="pfWan" value="ether1"></div>
        </div>
        <div class="config-section" id="pfRulesContainer">
          <div class="config-section-title"><i class="fa-solid fa-list"></i> Port Forward Rules</div>
          <div id="pfRulesList">
            ${makePFRule(0)}
          </div>
          <button class="btn btn-secondary btn-sm btn-full mt-2" onclick="addPFRule()"><i class="fa-solid fa-plus"></i> Tambah Rule</button>
        </div>
        <button class="btn btn-primary btn-lg mt-2" onclick="runPortForward()"><i class="fa-solid fa-play"></i> Generate</button>
      </div>
      <div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <button class="btn btn-secondary btn-sm" onclick="copyOutput('pfOutput')"><i class="fa-solid fa-copy"></i> Copy</button>
          <button class="btn btn-secondary btn-sm" onclick="downloadOutput('pfOutput','port-forward.rsc')"><i class="fa-solid fa-download"></i> .rsc</button>
        </div>
        <textarea class="terminal-output" id="pfOutput" style="min-height:400px;border:1px solid var(--border-color);border-radius:var(--radius-md)" readonly placeholder="# Klik Generate..."></textarea>
      </div>
    </div>
  </div>`;
}

let pfRuleCount = 1;
function makePFRule(idx) {
  return `<div class="isp-row" id="pfRule${idx}" style="margin-bottom:6px">
    <div class="isp-row-header"><span class="isp-num">Rule ${idx+1}</span><button class="isp-remove" onclick="document.getElementById('pfRule${idx}').remove()"><i class="fa-solid fa-xmark"></i></button></div>
    <div class="form-group"><label class="form-label">Name</label><input class="form-control form-control-mono pf-name" value="Rule-${idx+1}"></div>
    <div class="form-row">
      <div class="form-group mb-0"><label class="form-label">WAN Port</label><input class="form-control form-control-mono pf-wport" value="${8080+idx}"></div>
      <div class="form-group mb-0"><label class="form-label">Protocol</label><select class="form-control pf-proto"><option>tcp</option><option>udp</option><option>tcp,udp</option></select></div>
    </div>
    <div class="form-row mt-1">
      <div class="form-group mb-0"><label class="form-label">LAN IP</label><input class="form-control form-control-mono pf-lanip" value="192.168.88.10"></div>
      <div class="form-group mb-0"><label class="form-label">LAN Port</label><input class="form-control form-control-mono pf-lport" value="${8080+idx}"></div>
    </div>
  </div>`;
}

function addPFRule() {
  const container = document.getElementById('pfRulesList');
  container.insertAdjacentHTML('beforeend', makePFRule(pfRuleCount++));
}

function runPortForward() {
  const wan = document.getElementById('pfWan')?.value || 'ether1';
  const rows = document.querySelectorAll('#pfRulesList .isp-row');
  const out = ['# ComitTools PRO — Port Forwarding (Dst-NAT)', '# WAN: ' + wan, '', '/ip firewall nat'];
  rows.forEach(row => {
    const name = row.querySelector('.pf-name')?.value || 'Rule';
    const wport = row.querySelector('.pf-wport')?.value || '80';
    const proto = row.querySelector('.pf-proto')?.value || 'tcp';
    const lanip = row.querySelector('.pf-lanip')?.value || '192.168.1.10';
    const lport = row.querySelector('.pf-lport')?.value || '80';
    out.push(`add chain=dstnat in-interface=${wan} protocol=${proto} dst-port=${wport} action=dst-nat to-addresses=${lanip} to-ports=${lport} comment="${name}"`);
  });
  out.push('');
  out.push('/ip firewall filter');
  rows.forEach(row => {
    const name = row.querySelector('.pf-name')?.value || 'Rule';
    const lport = row.querySelector('.pf-lport')?.value || '80';
    const lanip = row.querySelector('.pf-lanip')?.value || '192.168.1.10';
    const proto = row.querySelector('.pf-proto')?.value || 'tcp';
    out.push(`add chain=forward protocol=${proto} dst-port=${lport} dst-address=${lanip} action=accept connection-state=new comment="Allow: ${name}"`);
  });
  document.getElementById('pfOutput').value = out.join('\n');
  showToast('✅ Port forward script digenerate!', 'success');
}

// ================================================================
// 1. HOTSPOT SETUP GENERATOR
// ================================================================
function formHotspot() {
  return `<div style="display:grid;grid-template-columns:340px 1fr;height:calc(92vh - 80px)">
    <!-- CONFIG PANEL -->
    <div style="overflow-y:auto;padding:20px;border-right:1px solid var(--border-color);display:flex;flex-direction:column;gap:14px">
      <div class="info-box"><i class="fa-solid fa-wifi text-teal"></i> <b>Hotspot Setup Generator</b> — Captive Portal, DHCP Pool, User Profiles & Walled Garden.</div>
      
      <!-- Interface & IP -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-ethernet"></i> Interface & Jaringan</div>
        <div class="form-group">
          <label class="form-label">Hotspot Interface</label>
          <input class="form-control form-control-mono" id="hsIface" value="bridge-hotspot" placeholder="wlan1 / bridge-hotspot">
        </div>
        <div class="form-group">
          <label class="form-label">IP Address / Netmask</label>
          <input class="form-control form-control-mono" id="hsIp" value="10.5.50.1/24" onchange="autoUpdateHotspotNetwork(this.value)">
        </div>
        <div class="form-row">
          <div class="form-group mb-0">
            <label class="form-label">Network</label>
            <input class="form-control form-control-mono" id="hsNet" value="10.5.50.0/24">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Gateway</label>
            <input class="form-control form-control-mono" id="hsGw" value="10.5.50.1">
          </div>
        </div>
        <div class="form-group mt-2 mb-0">
          <label class="form-label">DNS Name (URL Portal)</label>
          <input class="form-control form-control-mono" id="hsDnsName" value="hotspot.local" placeholder="wifi.comit.id">
        </div>
      </div>

      <!-- IP Pool & DHCP -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-database"></i> IP Pool & DHCP</div>
        <div class="form-group">
          <label class="form-label">Pool Name</label>
          <input class="form-control form-control-mono" id="hsPoolName" value="hs-pool">
        </div>
        <div class="form-group">
          <label class="form-label">Pool Range</label>
          <input class="form-control form-control-mono" id="hsPoolRange" value="10.5.50.2-10.5.50.254">
        </div>
        <div class="form-group mb-0">
          <label class="form-label">DHCP Lease Time</label>
          <input class="form-control form-control-mono" id="hsLease" value="1h">
        </div>
      </div>

      <!-- Login Method & Session -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-key"></i> Autentikasi & Sesi</div>
        <div class="form-group">
          <label class="form-label">Metode Login Utama</label>
          <select class="form-control" id="hsMethod">
            <option value="chap" selected>HTTP CHAP (Standard Aman)</option>
            <option value="pap">HTTP PAP</option>
            <option value="mac">MAC-based Login</option>
            <option value="http-chap">HTTP-CHAP + Cookie</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group mb-0">
            <label class="form-label">Cookie Lifetime</label>
            <input class="form-control form-control-mono" id="hsCookieTime" value="3d">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Session Timeout</label>
            <input class="form-control form-control-mono" id="hsSessionTimeout" value="0s" placeholder="0s = No limit">
          </div>
        </div>
      </div>

      <!-- Trial Mode -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-gift"></i> Trial / Uji Coba Gratis</div>
        <label class="form-check">
          <input type="checkbox" id="hsTrial" onchange="document.getElementById('hsTrialOpts').style.display = this.checked ? 'block' : 'none'"> 
          <span>Aktifkan Mode Trial Gratis</span>
        </label>
        <div id="hsTrialOpts" style="display:none;margin-top:8px">
          <div class="form-row">
            <div class="form-group mb-0">
              <label class="form-label">Trial Uptime</label>
              <input class="form-control form-control-mono" id="hsTrialUptime" value="30m">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Reset Interval</label>
              <input class="form-control form-control-mono" id="hsTrialReset" value="1d">
            </div>
          </div>
        </div>
      </div>

      <!-- User Profiles -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-gauge-high"></i> User Profile & Rate Limit (Up/Down)</div>
        <div class="form-group" style="margin-bottom:6px">
          <label class="form-label">Paket 1 Jam (1H)</label>
          <div class="form-row">
            <input class="form-control form-control-mono" id="hsUp1H" value="2M" placeholder="Upload">
            <input class="form-control form-control-mono" id="hsDown1H" value="5M" placeholder="Download">
          </div>
        </div>
        <div class="form-group" style="margin-bottom:6px">
          <label class="form-label">Paket 1 Hari (1D)</label>
          <div class="form-row">
            <input class="form-control form-control-mono" id="hsUp1D" value="3M" placeholder="Upload">
            <input class="form-control form-control-mono" id="hsDown1D" value="8M" placeholder="Download">
          </div>
        </div>
        <div class="form-group" style="margin-bottom:6px">
          <label class="form-label">Paket 7 Hari (7D)</label>
          <div class="form-row">
            <input class="form-control form-control-mono" id="hsUp7D" value="5M" placeholder="Upload">
            <input class="form-control form-control-mono" id="hsDown7D" value="10M" placeholder="Download">
          </div>
        </div>
        <div class="form-group mb-0">
          <label class="form-label">Paket 30 Hari (30D)</label>
          <div class="form-row">
            <input class="form-control form-control-mono" id="hsUp30D" value="10M" placeholder="Upload">
            <input class="form-control form-control-mono" id="hsDown30D" value="20M" placeholder="Download">
          </div>
        </div>
      </div>

      <!-- Walled Garden & DNS -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-globe"></i> Walled Garden & DNS</div>
        <div class="form-group">
          <label class="form-label">Walled Garden (Domain Bebas Akses)</label>
          <textarea class="form-control form-control-mono" id="hsWalledGarden" rows="2" style="font-size:11px">*.google.com, *.facebook.com, *.whatsapp.com, *.bca.co.id, *.bankmandiri.co.id</textarea>
        </div>
        <div class="form-group mb-0">
          <label class="form-label">DNS Servers</label>
          <input class="form-control form-control-mono" id="hsDnsServers" value="8.8.8.8, 8.8.4.4">
        </div>
      </div>

      <button class="btn btn-primary btn-lg" onclick="runHotspot()">
        <i class="fa-solid fa-play"></i> Generate Hotspot Script
      </button>
    </div>

    <!-- OUTPUT PANEL -->
    <div style="display:flex;flex-direction:column;padding:20px;gap:12px">
      <div style="display:flex;gap:8px;align-items:center">
        <div style="flex:1;font-size:13px;font-weight:600;color:var(--text-secondary)"><i class="fa-solid fa-terminal text-orange"></i> Output Script</div>
        <button class="btn btn-secondary btn-sm" onclick="copyOutput('hsOutput')"><i class="fa-solid fa-copy"></i> Copy</button>
        <button class="btn btn-secondary btn-sm" onclick="downloadOutput('hsOutput','hotspot-setup.rsc')"><i class="fa-solid fa-download"></i> .rsc</button>
        <button class="btn btn-teal btn-sm" onclick="runHotspot()"><i class="fa-solid fa-bolt"></i> Generate</button>
      </div>
      <div class="terminal-header">
        <div class="terminal-dots"><div class="terminal-dot red"></div><div class="terminal-dot yellow"></div><div class="terminal-dot green"></div></div>
        <div class="terminal-filename"><i class="fa-solid fa-terminal"></i> hotspot-setup.rsc</div>
        <div></div>
      </div>
      <textarea class="terminal-output" id="hsOutput" style="min-height:calc(92vh - 280px);border:1px solid var(--border-color);border-top:none;border-radius:0 0 var(--radius-md) var(--radius-md)" readonly placeholder="# Klik 'Generate Hotspot Script'..."></textarea>
    </div>
  </div>`;
}

function autoUpdateHotspotNetwork(ipCidr) {
  if (!ipCidr) return;
  const parts = ipCidr.split('/');
  if (parts.length === 2) {
    const ip = parts[0];
    const octets = ip.split('.');
    if (octets.length === 4) {
      const net = `${octets[0]}.${octets[1]}.${octets[2]}.0/${parts[1]}`;
      const gw = ip;
      const range = `${octets[0]}.${octets[1]}.${octets[2]}.2-${octets[0]}.${octets[1]}.${octets[2]}.254`;
      const netEl = document.getElementById('hsNet');
      const gwEl = document.getElementById('hsGw');
      const rangeEl = document.getElementById('hsPoolRange');
      if (netEl) netEl.value = net;
      if (gwEl) gwEl.value = gw;
      if (rangeEl) rangeEl.value = range;
    }
  }
}

function runHotspot() {
  const wgList = (document.getElementById('hsWalledGarden')?.value || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const cfg = {
    hs_interface: document.getElementById('hsIface')?.value || 'bridge-hotspot',
    hs_ip: document.getElementById('hsIp')?.value || '10.5.50.1/24',
    hs_network: document.getElementById('hsNet')?.value || '10.5.50.0/24',
    hs_gateway: document.getElementById('hsGw')?.value || '10.5.50.1',
    hs_dns_name: document.getElementById('hsDnsName')?.value || 'hotspot.local',
    pool_name: document.getElementById('hsPoolName')?.value || 'hs-pool',
    pool_range: document.getElementById('hsPoolRange')?.value || '10.5.50.2-10.5.50.254',
    dhcp_lease_time: document.getElementById('hsLease')?.value || '1h',
    login_method: document.getElementById('hsMethod')?.value || 'chap',
    cookie_lifetime: document.getElementById('hsCookieTime')?.value || '3d',
    session_timeout: document.getElementById('hsSessionTimeout')?.value || '0s',
    trial_enabled: !!document.getElementById('hsTrial')?.checked,
    trial_uptime: document.getElementById('hsTrialUptime')?.value || '30m',
    trial_reset: document.getElementById('hsTrialReset')?.value || '1d',
    user_profiles: ['1H', '1D', '7D', '30D'],
    profile_speeds: {
      '1H': { up: document.getElementById('hsUp1H')?.value || '2M', down: document.getElementById('hsDown1H')?.value || '5M' },
      '1D': { up: document.getElementById('hsUp1D')?.value || '3M', down: document.getElementById('hsDown1D')?.value || '8M' },
      '7D': { up: document.getElementById('hsUp7D')?.value || '5M', down: document.getElementById('hsDown7D')?.value || '10M' },
      '30D': { up: document.getElementById('hsUp30D')?.value || '10M', down: document.getElementById('hsDown30D')?.value || '20M' },
    },
    walled_garden: wgList.length ? wgList : ['*.google.com', '*.facebook.com', '*.whatsapp.com'],
    dns_servers: document.getElementById('hsDnsServers')?.value || '8.8.8.8, 8.8.4.4',
    comment: 'ComitTools PRO - Hotspot Setup',
  };

  let script = '';
  if (typeof generateHotspot === 'function') {
    script = generateHotspot(cfg);
  } else {
    script = `# Error: Generator hotspot engine belum dimuat.`;
  }
  const out = document.getElementById('hsOutput');
  if (out) out.value = script;
  showToast('✅ Hotspot setup script berhasil digenerate!', 'success');
}

// ================================================================
// 2. HOTSPOT USER BULK GENERATOR
// ================================================================
function formHotspotUser() {
  return `<div style="display:grid;grid-template-columns:340px 1fr;height:calc(92vh - 80px)">
    <!-- CONFIG PANEL -->
    <div style="overflow-y:auto;padding:20px;border-right:1px solid var(--border-color);display:flex;flex-direction:column;gap:14px">
      <div class="info-box"><i class="fa-solid fa-users text-orange"></i> <b>Hotspot User Bulk Generator</b> — Generate voucher massal dengan prefix, panjang karakter, kuota & durasi.</div>

      <!-- Basic Voucher Options -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-ticket"></i> Voucher Settings</div>
        <div class="form-group">
          <label class="form-label">Hotspot Server</label>
          <input class="form-control form-control-mono" id="hsuServer" value="all" placeholder="all / hotspot1">
        </div>
        <div class="form-group">
          <label class="form-label">User Profile Target</label>
          <select class="form-control" id="hsuProfile">
            <option value="1H">1H (1 Jam)</option>
            <option value="1D" selected>1D (1 Hari)</option>
            <option value="7D">7D (7 Hari)</option>
            <option value="30D">30D (30 Hari / Bulanan)</option>
            <option value="default">default</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Jumlah Voucher</label>
          <select class="form-control" id="hsuCount">
            <option value="10">10 Voucher</option>
            <option value="25">25 Voucher</option>
            <option value="50" selected>50 Voucher</option>
            <option value="100">100 Voucher</option>
            <option value="200">200 Voucher</option>
          </select>
        </div>
      </div>

      <!-- Credentials Format -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-shield"></i> Format Kode & Password</div>
        <div class="form-group">
          <label class="form-label">Mode Kredensial</label>
          <select class="form-control" id="hsuMode">
            <option value="user_equal_pass" selected>Username = Password (Kode Voucher)</option>
            <option value="random_pass">Username &amp; Password Terpisah</option>
            <option value="no_pass">Username Saja (Tanpa Password)</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group mb-0">
            <label class="form-label">Prefix Kode</label>
            <input class="form-control form-control-mono" id="hsuPrefix" value="WF-">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Panjang Kode</label>
            <select class="form-control" id="hsuLength">
              <option value="4">4 Karakter</option>
              <option value="5">5 Karakter</option>
              <option value="6" selected>6 Karakter</option>
              <option value="8">8 Karakter</option>
            </select>
          </div>
        </div>
        <div class="form-group mt-2 mb-0">
          <label class="form-label">Kombinasi Karakter</label>
          <select class="form-control" id="hsuCharset">
            <option value="numeric">Angka Saja (123456)</option>
            <option value="alpha_upper" selected>Huruf Kapital &amp; Angka (A8K2M9)</option>
            <option value="alpha_lower">Huruf Kecil &amp; Angka (a8k2m9)</option>
            <option value="mixed">Huruf Campur &amp; Angka (Ak8Lm2)</option>
          </select>
        </div>
      </div>

      <!-- Limits & Comment -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-clock-rotate-left"></i> Limit Uptime & Kuota</div>
        <div class="form-row">
          <div class="form-group mb-0">
            <label class="form-label">Limit Uptime</label>
            <input class="form-control form-control-mono" id="hsuTimeLimit" value="1d" placeholder="mis: 1h, 1d, 7d">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Limit Kuota (Bytes)</label>
            <input class="form-control form-control-mono" id="hsuByteLimit" value="2G" placeholder="mis: 1G, 2G, 5G">
          </div>
        </div>
        <div class="form-group mt-2 mb-0">
          <label class="form-label">Comment / Batch Tag</label>
          <input class="form-control form-control-mono" id="hsuComment" value="Voucher-Batch-01">
        </div>
      </div>

      <button class="btn btn-primary btn-lg" onclick="runHotspotUser()">
        <i class="fa-solid fa-play"></i> Generate Bulk Voucher
      </button>
    </div>

    <!-- OUTPUT PANEL -->
    <div style="display:flex;flex-direction:column;padding:20px;gap:12px">
      <div style="display:flex;gap:8px;align-items:center">
        <div style="flex:1;font-size:13px;font-weight:600;color:var(--text-secondary)"><i class="fa-solid fa-terminal text-orange"></i> Output Script</div>
        <button class="btn btn-secondary btn-sm" onclick="copyOutput('hsuOutput')"><i class="fa-solid fa-copy"></i> Copy</button>
        <button class="btn btn-secondary btn-sm" onclick="downloadOutput('hsuOutput','hotspot-vouchers.rsc')"><i class="fa-solid fa-download"></i> .rsc</button>
        <button class="btn btn-teal btn-sm" onclick="runHotspotUser()"><i class="fa-solid fa-bolt"></i> Generate</button>
      </div>
      <div class="terminal-header">
        <div class="terminal-dots"><div class="terminal-dot red"></div><div class="terminal-dot yellow"></div><div class="terminal-dot green"></div></div>
        <div class="terminal-filename"><i class="fa-solid fa-terminal"></i> hotspot-vouchers.rsc</div>
        <div></div>
      </div>
      <textarea class="terminal-output" id="hsuOutput" style="min-height:calc(92vh - 280px);border:1px solid var(--border-color);border-top:none;border-radius:0 0 var(--radius-md) var(--radius-md)" readonly placeholder="# Klik 'Generate Bulk Voucher'..."></textarea>
    </div>
  </div>`;
}

function runHotspotUser() {
  const server = document.getElementById('hsuServer')?.value || 'all';
  const profile = document.getElementById('hsuProfile')?.value || '1D';
  const count = parseInt(document.getElementById('hsuCount')?.value, 10) || 50;
  const mode = document.getElementById('hsuMode')?.value || 'user_equal_pass';
  const prefix = document.getElementById('hsuPrefix')?.value || 'WF-';
  const length = parseInt(document.getElementById('hsuLength')?.value, 10) || 6;
  const charsetType = document.getElementById('hsuCharset')?.value || 'alpha_upper';
  const timeLimit = (document.getElementById('hsuTimeLimit')?.value || '').trim();
  const byteLimit = (document.getElementById('hsuByteLimit')?.value || '').trim();
  const comment = document.getElementById('hsuComment')?.value || 'Voucher-Batch-01';

  let chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  if (charsetType === 'numeric') chars = '0123456789';
  else if (charsetType === 'alpha_lower') chars = '23456789abcdefghjkmnpqrstuvwxyz';
  else if (charsetType === 'mixed') chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';

  function randStr(len) {
    let res = '';
    for (let i = 0; i < len; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  }

  const generatedUsers = new Set();
  const rows = [];
  while (rows.length < count) {
    const code = prefix + randStr(length);
    if (generatedUsers.has(code)) continue;
    generatedUsers.add(code);

    let uName = code;
    let uPass = '';
    if (mode === 'user_equal_pass') {
      uPass = code;
    } else if (mode === 'random_pass') {
      uPass = randStr(length);
    } else {
      uPass = '';
    }

    let line = `add name="${uName}"`;
    if (uPass) line += ` password="${uPass}"`;
    line += ` profile="${profile}" server="${server}"`;
    if (timeLimit) line += ` limit-uptime=${timeLimit}`;
    if (byteLimit) line += ` limit-bytes-total=${byteLimit}`;
    line += ` comment="${comment}"`;
    rows.push(line);
  }

  const out = [
    `#####################################################################`,
    `# ComitTools PRO — Bulk Hotspot User / Voucher Generator`,
    `# Total Voucher: ${count}  |  Profile: ${profile}  |  Server: ${server}`,
    `# Time Limit: ${timeLimit || 'Unlimited'}  |  Byte Limit: ${byteLimit || 'Unlimited'}`,
    `# Batch ID: ${comment}`,
    `#####################################################################`,
    ``,
    `/ip hotspot user`,
    ...rows,
    ``,
    `#####################################################################`,
    `# Verification & Stats:`,
    `# /ip hotspot user print count-only where comment="${comment}"`,
    `# /ip hotspot active print count-only`,
    `#####################################################################`,
  ];

  const outEl = document.getElementById('hsuOutput');
  if (outEl) outEl.value = out.join('\n');
  showToast(`✅ ${count} Voucher hotspot berhasil digenerate!`, 'success');
}

// ================================================================
// 3. GAME QOS PRIORITY GENERATOR
// ================================================================
function formGameQoS() {
  const games = [
    { id: 'mlbb', name: 'MLBB', full: 'Mobile Legends: Bang Bang' },
    { id: 'pubgm', name: 'PUBGM', full: 'PUBG Mobile' },
    { id: 'freefire', name: 'Free Fire', full: 'Garena Free Fire' },
    { id: 'valorant', name: 'Valorant', full: 'Riot Valorant' },
    { id: 'pointblank', name: 'Point Blank', full: 'Zepetto Point Blank' },
    { id: 'genshin', name: 'Genshin', full: 'Genshin Impact' },
    { id: 'codm', name: 'CODM', full: 'Call of Duty Mobile' },
    { id: 'roblox', name: 'Roblox', full: 'Roblox' },
    { id: 'dota2', name: 'Dota 2', full: 'Valve Dota 2' },
    { id: 'ragnarok', name: 'Ragnarok', full: 'Ragnarok Online' },
    { id: 'aov', name: 'AOV', full: 'Arena of Valor' },
  ];

  const gameCheckboxes = games.map(g => `
    <label class="form-check" style="background:rgba(0,0,0,0.2);padding:6px 10px;border-radius:6px;font-size:12px;cursor:pointer">
      <input type="checkbox" class="gqos-game-check" value="${g.id}" checked>
      <span><b>${g.name}</b> <span style="font-size:10px;color:var(--text-muted)">(${g.full})</span></span>
    </label>
  `).join('');

  return `<div style="display:grid;grid-template-columns:340px 1fr;height:calc(92vh - 80px)">
    <!-- CONFIG PANEL -->
    <div style="overflow-y:auto;padding:20px;border-right:1px solid var(--border-color);display:flex;flex-direction:column;gap:14px">
      <div class="info-box"><i class="fa-solid fa-gamepad text-orange"></i> <b>Game QoS Priority Generator</b> — Optimasi latensi game online dengan mangle packet marks & queue tree prioritas 1.</div>

      <!-- ROS Version -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-microchip"></i> RouterOS Version</div>
        <div style="display:flex;gap:8px">
          <label class="form-check" style="flex:1;background:rgba(56,189,248,0.06);border:1px solid rgba(56,189,248,0.2);border-radius:8px;padding:8px 12px;cursor:pointer">
            <input type="radio" name="gqosROS" value="v6"> <span>v6.x</span>
          </label>
          <label class="form-check" style="flex:1;background:rgba(63,211,192,0.06);border:1px solid rgba(63,211,192,0.2);border-radius:8px;padding:8px 12px;cursor:pointer">
            <input type="radio" name="gqosROS" value="v7" checked> <span>v7.x</span>
          </label>
        </div>
      </div>

      <!-- Interfaces -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-plug"></i> Interface & Bandwidth</div>
        <div class="form-row">
          <div class="form-group mb-0">
            <label class="form-label">WAN Interface</label>
            <input class="form-control form-control-mono" id="gqosWan" value="ether1">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">LAN Interface</label>
            <input class="form-control form-control-mono" id="gqosLan" value="bridge-lan">
          </div>
        </div>
        <div class="form-row mt-2">
          <div class="form-group mb-0">
            <label class="form-label">Total Upload</label>
            <input class="form-control form-control-mono" id="gqosUpMax" value="20M">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Total Download</label>
            <input class="form-control form-control-mono" id="gqosDownMax" value="50M">
          </div>
        </div>
      </div>

      <!-- Supported Games Selection -->
      <div class="config-section">
        <div class="config-section-title" style="display:flex;justify-content:space-between;align-items:center">
          <span><i class="fa-solid fa-trophy"></i> Pilih Game Online (11 Games)</span>
          <span style="font-size:11px">
            <a href="javascript:void(0)" onclick="selectAllGames(true)" style="color:var(--brand-teal);margin-right:6px">Semua</a>
            <a href="javascript:void(0)" onclick="selectAllGames(false)" style="color:var(--text-muted)">Clear</a>
          </span>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;max-height:220px;overflow-y:auto;padding-right:4px">
          ${gameCheckboxes}
        </div>
      </div>

      <!-- Enhancements -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-sliders"></i> Opsi Optimasi Tambahan</div>
        <label class="form-check">
          <input type="checkbox" id="gqosStreaming" checked>
          <span>Pisahkan Streaming (YouTube &amp; Netflix) ke Prioritas Rendah</span>
        </label>
        <label class="form-check">
          <input type="checkbox" id="gqosIcmpDns" checked>
          <span>Prioritaskan Ping (ICMP) &amp; DNS (Port 53) ke Prioritas 1</span>
        </label>
        <label class="form-check">
          <input type="checkbox" id="gqosIsolation" onchange="document.getElementById('gqosSsidWrap').style.display = this.checked ? 'block' : 'none'">
          <span>Client Isolation per SSID (Cegah Inter-LAN Noise)</span>
        </label>
        <div id="gqosSsidWrap" style="display:none;margin-top:8px">
          <label class="form-label">Wireless Interface / SSID</label>
          <input class="form-control form-control-mono" id="gqosSsidIface" value="wlan1">
        </div>
      </div>

      <button class="btn btn-primary btn-lg" onclick="runGameQoS()">
        <i class="fa-solid fa-play"></i> Generate Game QoS Script
      </button>
    </div>

    <!-- OUTPUT PANEL -->
    <div style="display:flex;flex-direction:column;padding:20px;gap:12px">
      <div style="display:flex;gap:8px;align-items:center">
        <div style="flex:1;font-size:13px;font-weight:600;color:var(--text-secondary)"><i class="fa-solid fa-terminal text-orange"></i> Output Script</div>
        <button class="btn btn-secondary btn-sm" onclick="copyOutput('gqosOutput')"><i class="fa-solid fa-copy"></i> Copy</button>
        <button class="btn btn-secondary btn-sm" onclick="downloadOutput('gqosOutput','game-qos-comittools.rsc')"><i class="fa-solid fa-download"></i> .rsc</button>
        <button class="btn btn-teal btn-sm" onclick="runGameQoS()"><i class="fa-solid fa-bolt"></i> Generate</button>
      </div>
      <div class="terminal-header">
        <div class="terminal-dots"><div class="terminal-dot red"></div><div class="terminal-dot yellow"></div><div class="terminal-dot green"></div></div>
        <div class="terminal-filename"><i class="fa-solid fa-terminal"></i> game-qos-comittools.rsc</div>
        <div></div>
      </div>
      <textarea class="terminal-output" id="gqosOutput" style="min-height:calc(92vh - 280px);border:1px solid var(--border-color);border-top:none;border-radius:0 0 var(--radius-md) var(--radius-md)" readonly placeholder="# Klik 'Generate Game QoS Script'..."></textarea>
    </div>
  </div>`;
}

function selectAllGames(checked) {
  document.querySelectorAll('.gqos-game-check').forEach(cb => { cb.checked = !!checked; });
}

function runGameQoS() {
  const selectedGames = [];
  document.querySelectorAll('.gqos-game-check:checked').forEach(cb => {
    selectedGames.push(cb.value);
  });

  const ssidInterfaces = [];
  if (document.getElementById('gqosIsolation')?.checked) {
    const ssid = (document.getElementById('gqosSsidIface')?.value || 'wlan1').trim();
    if (ssid) ssidInterfaces.push(ssid);
  }

  const cfg = {
    ros_version: document.querySelector('input[name="gqosROS"]:checked')?.value || 'v7',
    wan_interface: document.getElementById('gqosWan')?.value || 'ether1',
    lan_interface: document.getElementById('gqosLan')?.value || 'bridge-lan',
    bandwidth_up: document.getElementById('gqosUpMax')?.value || '20M',
    bandwidth_down: document.getElementById('gqosDownMax')?.value || '50M',
    games: selectedGames.length ? selectedGames : ['mlbb', 'pubgm', 'freefire', 'valorant'],
    include_streaming: !!document.getElementById('gqosStreaming')?.checked,
    ssid_interfaces: ssidInterfaces,
    comment: 'ComitTools PRO - Game QoS Priority',
  };

  let script = '';
  if (typeof generateGameQoS === 'function') {
    script = generateGameQoS(cfg);
  } else {
    script = `# Error: Generator game QoS belum dimuat.`;
  }
  const out = document.getElementById('gqosOutput');
  if (out) out.value = script;
  showToast('✅ Game QoS script berhasil digenerate!', 'success');
}

// ================================================================
// 4. MULTI-VPN GENERATOR (WireGuard, L2TP, PPTP, SSTP)
// ================================================================
function formVPN(type) {
  const currentType = (type || 'wireguard').toLowerCase();
  return `<div style="display:grid;grid-template-columns:340px 1fr;height:calc(92vh - 80px)">
    <!-- CONFIG PANEL -->
    <div style="overflow-y:auto;padding:20px;border-right:1px solid var(--border-color);display:flex;flex-direction:column;gap:14px">
      <div class="info-box"><i class="fa-solid fa-shield text-teal"></i> <b>Multi-VPN Generator</b> — WireGuard (v7), L2TP/IPSec, PPTP, SSTP Server Setup.</div>

      <!-- Mode Selector -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-lock"></i> Protokol VPN</div>
        <div class="mode-selector" id="vpnModeSelector">
          <button class="mode-btn ${currentType === 'wireguard' ? 'active' : ''}" onclick="switchVPNType('wireguard')">WireGuard</button>
          <button class="mode-btn ${currentType === 'l2tp' ? 'active' : ''}" onclick="switchVPNType('l2tp')">L2TP/IPSec</button>
          <button class="mode-btn ${currentType === 'pptp' ? 'active' : ''}" onclick="switchVPNType('pptp')">PPTP</button>
          <button class="mode-btn ${currentType === 'sstp' ? 'active' : ''}" onclick="switchVPNType('sstp')">SSTP</button>
        </div>
        <input type="hidden" id="vpnActiveType" value="${currentType}">
      </div>

      <!-- Dynamic VPN Inputs Container -->
      <div id="vpnDynamicFields">
        ${getVPNSettingsHTML(currentType)}
      </div>

      <button class="btn btn-primary btn-lg" onclick="runVPN()">
        <i class="fa-solid fa-play"></i> Generate VPN Script
      </button>
    </div>

    <!-- OUTPUT PANEL -->
    <div style="display:flex;flex-direction:column;padding:20px;gap:12px">
      <div style="display:flex;gap:8px;align-items:center">
        <div style="flex:1;font-size:13px;font-weight:600;color:var(--text-secondary)"><i class="fa-solid fa-terminal text-orange"></i> Output Script</div>
        <button class="btn btn-secondary btn-sm" onclick="copyOutput('vpnOutput')"><i class="fa-solid fa-copy"></i> Copy</button>
        <button class="btn btn-secondary btn-sm" onclick="downloadOutput('vpnOutput','vpn-setup.rsc')"><i class="fa-solid fa-download"></i> .rsc</button>
        <button class="btn btn-teal btn-sm" onclick="runVPN()"><i class="fa-solid fa-bolt"></i> Generate</button>
      </div>
      <div class="terminal-header">
        <div class="terminal-dots"><div class="terminal-dot red"></div><div class="terminal-dot yellow"></div><div class="terminal-dot green"></div></div>
        <div class="terminal-filename" id="vpnTerminalFile"><i class="fa-solid fa-terminal"></i> vpn-${currentType}.rsc</div>
        <div></div>
      </div>
      <textarea class="terminal-output" id="vpnOutput" style="min-height:calc(92vh - 280px);border:1px solid var(--border-color);border-top:none;border-radius:0 0 var(--radius-md) var(--radius-md)" readonly placeholder="# Klik 'Generate VPN Script'..."></textarea>
    </div>
  </div>`;
}

function getVPNSettingsHTML(type) {
  if (type === 'wireguard') {
    return `
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-network-wired"></i> WireGuard Server (v7 Only)</div>
        <div class="form-group">
          <label class="form-label">Interface Name</label>
          <input class="form-control form-control-mono" id="vpnWgIface" value="wg0">
        </div>
        <div class="form-row">
          <div class="form-group mb-0">
            <label class="form-label">Listen Port</label>
            <input class="form-control form-control-mono" id="vpnWgPort" value="13231">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Server IP / Subnet</label>
            <input class="form-control form-control-mono" id="vpnWgSubnet" value="10.10.0.1/24">
          </div>
        </div>
        <div class="form-group mt-2">
          <label class="form-label">Router Public IP / DDNS</label>
          <input class="form-control form-control-mono" id="vpnWgPubIp" value="203.0.113.1" placeholder="IP Publik atau Cloud DNS">
        </div>
        <div class="form-group mb-0">
          <label class="form-label">DNS Server VPN</label>
          <input class="form-control form-control-mono" id="vpnWgDns" value="1.1.1.1, 8.8.8.8">
        </div>
      </div>
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-users"></i> Client Peer (Default)</div>
        <div class="form-group">
          <label class="form-label">Client 1 Name</label>
          <input class="form-control form-control-mono" id="vpnWgPeerName" value="client1">
        </div>
        <div class="form-group mb-0">
          <label class="form-label">Client 1 Allowed IP</label>
          <input class="form-control form-control-mono" id="vpnWgPeerIp" value="10.10.0.2/32">
        </div>
      </div>`;
  }
  if (type === 'l2tp') {
    return `
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-lock"></i> L2TP/IPSec Server</div>
        <div class="form-group">
          <label class="form-label">IPSec Pre-Shared Key (PSK)</label>
          <input class="form-control form-control-mono" id="vpnL2tpSecret" value="ComitVPNSecret2026!">
        </div>
        <div class="form-row">
          <div class="form-group mb-0">
            <label class="form-label">Local Address (Gateway)</label>
            <input class="form-control form-control-mono" id="vpnL2tpLocal" value="10.20.0.1">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Profile Name</label>
            <input class="form-control form-control-mono" id="vpnL2tpProfile" value="l2tp-profile">
          </div>
        </div>
        <div class="form-group mt-2 mb-0">
          <label class="form-label">Pool Range</label>
          <input class="form-control form-control-mono" id="vpnL2tpPool" value="10.20.0.2-10.20.0.50">
        </div>
      </div>
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-user-check"></i> Akun Pengguna (PPP Secret)</div>
        <div class="form-row">
          <div class="form-group mb-0">
            <label class="form-label">Username</label>
            <input class="form-control form-control-mono" id="vpnUser" value="vpnuser1">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Password</label>
            <input class="form-control form-control-mono" id="vpnPass" value="P@ss1234">
          </div>
        </div>
      </div>`;
  }
  if (type === 'pptp') {
    return `
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-key"></i> PPTP Server</div>
        <div class="form-row">
          <div class="form-group mb-0">
            <label class="form-label">Local Address (Gateway)</label>
            <input class="form-control form-control-mono" id="vpnPptpLocal" value="10.30.0.1">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Profile Name</label>
            <input class="form-control form-control-mono" id="vpnPptpProfile" value="pptp-profile">
          </div>
        </div>
        <div class="form-group mt-2 mb-0">
          <label class="form-label">Pool Range</label>
          <input class="form-control form-control-mono" id="vpnPptpPool" value="10.30.0.2-10.30.0.50">
        </div>
      </div>
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-user-check"></i> Akun Pengguna (PPP Secret)</div>
        <div class="form-row">
          <div class="form-group mb-0">
            <label class="form-label">Username</label>
            <input class="form-control form-control-mono" id="vpnUser" value="pptpuser">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Password</label>
            <input class="form-control form-control-mono" id="vpnPass" value="P@ss1234">
          </div>
        </div>
      </div>`;
  }
  // SSTP
  return `
    <div class="config-section">
      <div class="config-section-title"><i class="fa-solid fa-certificate"></i> SSTP Server (Port 443)</div>
      <div class="form-row">
        <div class="form-group mb-0">
          <label class="form-label">Local Address (Gateway)</label>
          <input class="form-control form-control-mono" id="vpnSstpLocal" value="10.40.0.1">
        </div>
        <div class="form-group mb-0">
          <label class="form-label">Profile Name</label>
          <input class="form-control form-control-mono" id="vpnSstpProfile" value="sstp-profile">
        </div>
      </div>
      <div class="form-group mt-2">
        <label class="form-label">Pool Range</label>
        <input class="form-control form-control-mono" id="vpnSstpPool" value="10.40.0.2-10.40.0.50">
      </div>
      <div class="form-group mb-0">
        <label class="form-label">Nama Sertifikat</label>
        <input class="form-control form-control-mono" id="vpnSstpCert" value="sstp-cert">
      </div>
    </div>
    <div class="config-section">
      <div class="config-section-title"><i class="fa-solid fa-user-check"></i> Akun Pengguna (PPP Secret)</div>
      <div class="form-row">
        <div class="form-group mb-0">
          <label class="form-label">Username</label>
          <input class="form-control form-control-mono" id="vpnUser" value="sstpuser">
        </div>
        <div class="form-group mb-0">
          <label class="form-label">Password</label>
          <input class="form-control form-control-mono" id="vpnPass" value="P@ss1234">
        </div>
      </div>
    </div>`;
}

function switchVPNType(newType) {
  const inputEl = document.getElementById('vpnActiveType');
  if (inputEl) inputEl.value = newType;
  
  // Update button active states
  document.querySelectorAll('#vpnModeSelector .mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase().includes(newType));
  });

  // Render fields
  const fieldsEl = document.getElementById('vpnDynamicFields');
  if (fieldsEl) fieldsEl.innerHTML = getVPNSettingsHTML(newType);

  const fileEl = document.getElementById('vpnTerminalFile');
  if (fileEl) fileEl.innerHTML = `<i class="fa-solid fa-terminal"></i> vpn-${newType}.rsc`;

  runVPN(newType);
}

function runVPN(overrideType) {
  const type = overrideType || document.getElementById('vpnActiveType')?.value || 'wireguard';
  let cfg = {};

  if (type === 'wireguard') {
    cfg = {
      interface_name: document.getElementById('vpnWgIface')?.value || 'wg0',
      listen_port: parseInt(document.getElementById('vpnWgPort')?.value, 10) || 13231,
      server_ip: document.getElementById('vpnWgSubnet')?.value || '10.10.0.1/24',
      server_pub_ip: document.getElementById('vpnWgPubIp')?.value || '203.0.113.1',
      dns: document.getElementById('vpnWgDns')?.value || '1.1.1.1',
      clients: [
        {
          name: document.getElementById('vpnWgPeerName')?.value || 'client1',
          ip: document.getElementById('vpnWgPeerIp')?.value || '10.10.0.2/32',
          pubkey: '<CLIENT_PUBLIC_KEY>',
        }
      ],
      comment: 'ComitTools PRO - WireGuard VPN',
    };
  } else if (type === 'l2tp') {
    cfg = {
      pool_range: document.getElementById('vpnL2tpPool')?.value || '10.20.0.2-10.20.0.50',
      pool_name: 'vpn-pool-l2tp',
      ipsec_secret: document.getElementById('vpnL2tpSecret')?.value || 'ComitVPNSecret2026!',
      profile_name: document.getElementById('vpnL2tpProfile')?.value || 'l2tp-profile',
      local_address: document.getElementById('vpnL2tpLocal')?.value || '10.20.0.1',
      dns: '1.1.1.1',
      clients: [
        {
          username: document.getElementById('vpnUser')?.value || 'vpnuser1',
          password: document.getElementById('vpnPass')?.value || 'P@ss1234',
          ip: '10.20.0.2',
        }
      ],
    };
  } else if (type === 'pptp') {
    cfg = {
      pool_range: document.getElementById('vpnPptpPool')?.value || '10.30.0.2-10.30.0.50',
      pool_name: 'vpn-pool-pptp',
      profile_name: document.getElementById('vpnPptpProfile')?.value || 'pptp-profile',
      local_address: document.getElementById('vpnPptpLocal')?.value || '10.30.0.1',
      dns: '1.1.1.1',
      clients: [
        {
          username: document.getElementById('vpnUser')?.value || 'pptpuser',
          password: document.getElementById('vpnPass')?.value || 'P@ss1234',
          ip: '10.30.0.2',
        }
      ],
    };
  } else if (type === 'sstp') {
    cfg = {
      pool_range: document.getElementById('vpnSstpPool')?.value || '10.40.0.2-10.40.0.50',
      pool_name: 'vpn-pool-sstp',
      profile_name: document.getElementById('vpnSstpProfile')?.value || 'sstp-profile',
      local_address: document.getElementById('vpnSstpLocal')?.value || '10.40.0.1',
      certificate: document.getElementById('vpnSstpCert')?.value || 'sstp-cert',
      dns: '1.1.1.1',
      clients: [
        {
          username: document.getElementById('vpnUser')?.value || 'sstpuser',
          password: document.getElementById('vpnPass')?.value || 'P@ss1234',
          ip: '10.40.0.2',
        }
      ],
    };
  }

  let script = '';
  if (typeof generateVPN === 'function') {
    try {
      script = generateVPN(type, cfg);
    } catch(err) {
      script = `# Error: ${err.message}`;
    }
  } else {
    script = `# Error: Generator VPN engine belum dimuat.`;
  }

  const out = document.getElementById('vpnOutput');
  if (out) out.value = script;
  showToast(`✅ Script VPN ${type.toUpperCase()} berhasil digenerate!`, 'success');
}

// ================================================================
// 5. QUEUE TREE HIERARCHICAL GENERATOR
// ================================================================
let qtClientIndex = 3;
function formQueueTree() {
  return `<div style="display:grid;grid-template-columns:340px 1fr;height:calc(92vh - 80px)">
    <!-- CONFIG PANEL -->
    <div style="overflow-y:auto;padding:20px;border-right:1px solid var(--border-color);display:flex;flex-direction:column;gap:14px">
      <div class="info-box"><i class="fa-solid fa-sitemap text-teal"></i> <b>Queue Tree Generator</b> — Pembagian bandwidth hirarki (Parent &amp; Child) dengan mangle packet mark.</div>

      <!-- Interfaces -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-network-wired"></i> Parent Interfaces</div>
        <div class="form-row">
          <div class="form-group mb-0">
            <label class="form-label">Upload Parent</label>
            <input class="form-control form-control-mono" id="qtUpIface" value="ether1" placeholder="ether1">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Download Parent</label>
            <input class="form-control form-control-mono" id="qtDownIface" value="bridge-lan" placeholder="bridge-lan">
          </div>
        </div>
      </div>

      <!-- Total Bandwidth -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-gauge-high"></i> Total Bandwidth ISP</div>
        <div class="form-row">
          <div class="form-group mb-0">
            <label class="form-label">Total Upload</label>
            <input class="form-control form-control-mono" id="qtTotalUp" value="20M">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Total Download</label>
            <input class="form-control form-control-mono" id="qtTotalDown" value="50M">
          </div>
        </div>
        <div class="form-row mt-2">
          <div class="form-group mb-0">
            <label class="form-label">Burst Multiplier</label>
            <select class="form-control" id="qtBurstMult">
              <option value="1">1x (Tanpa Burst)</option>
              <option value="1.5">1.5x Multiplier</option>
              <option value="2" selected>2x Multiplier (Standard)</option>
            </select>
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Default Priority</label>
            <select class="form-control" id="qtDefaultPriority">
              <option value="8" selected>8 (Lowest)</option>
              <option value="5">5 (Normal)</option>
              <option value="1">1 (Highest)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Sub Queues (Clients / Departments) -->
      <div class="config-section">
        <div class="config-section-title" style="display:flex;justify-content:space-between;align-items:center">
          <span><i class="fa-solid fa-layer-group"></i> Sub-Queues (Child)</span>
          <button class="btn btn-secondary btn-sm" onclick="addQueueTreeRow()" style="padding:2px 8px;font-size:11px"><i class="fa-solid fa-plus"></i> Tambah</button>
        </div>
        <div id="qtClientsContainer" style="display:flex;flex-direction:column;gap:8px">
          ${makeQTRow(1, 'Staff-Office', '192.168.88.10-192.168.88.50', '5M', '15M', 3)}
          ${makeQTRow(2, 'Hotspot-Users', '192.168.88.100/24', '10M', '30M', 6)}
          ${makeQTRow(3, 'CCTV-Security', '192.168.88.200-192.168.88.220', '3M', '5M', 1)}
        </div>
      </div>

      <button class="btn btn-primary btn-lg" onclick="runQueueTree()">
        <i class="fa-solid fa-play"></i> Generate Queue Tree Script
      </button>
    </div>

    <!-- OUTPUT PANEL -->
    <div style="display:flex;flex-direction:column;padding:20px;gap:12px">
      <div style="display:flex;gap:8px;align-items:center">
        <div style="flex:1;font-size:13px;font-weight:600;color:var(--text-secondary)"><i class="fa-solid fa-terminal text-orange"></i> Output Script</div>
        <button class="btn btn-secondary btn-sm" onclick="copyOutput('qtOutput')"><i class="fa-solid fa-copy"></i> Copy</button>
        <button class="btn btn-secondary btn-sm" onclick="downloadOutput('qtOutput','queue-tree.rsc')"><i class="fa-solid fa-download"></i> .rsc</button>
        <button class="btn btn-teal btn-sm" onclick="runQueueTree()"><i class="fa-solid fa-bolt"></i> Generate</button>
      </div>
      <div class="terminal-header">
        <div class="terminal-dots"><div class="terminal-dot red"></div><div class="terminal-dot yellow"></div><div class="terminal-dot green"></div></div>
        <div class="terminal-filename"><i class="fa-solid fa-terminal"></i> queue-tree.rsc</div>
        <div></div>
      </div>
      <textarea class="terminal-output" id="qtOutput" style="min-height:calc(92vh - 280px);border:1px solid var(--border-color);border-top:none;border-radius:0 0 var(--radius-md) var(--radius-md)" readonly placeholder="# Klik 'Generate Queue Tree Script'..."></textarea>
    </div>
  </div>`;
}

function makeQTRow(idx, name, target, up, down, prio) {
  return `<div class="isp-row" id="qtRow${idx}" style="padding:10px;margin-bottom:4px">
    <div class="isp-row-header">
      <span class="isp-num">Child #${idx}: <b>${name}</b></span>
      <button class="isp-remove" onclick="document.getElementById('qtRow${idx}').remove()"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="form-row">
      <div class="form-group mb-0">
        <label class="form-label">Nama Queue</label>
        <input class="form-control form-control-mono qt-name" value="${name}">
      </div>
      <div class="form-group mb-0">
        <label class="form-label">Target IP / Subnet</label>
        <input class="form-control form-control-mono qt-target" value="${target}">
      </div>
    </div>
    <div class="form-row mt-1">
      <div class="form-group mb-0">
        <label class="form-label">Max Up / Down</label>
        <div style="display:flex;gap:4px">
          <input class="form-control form-control-mono qt-up" value="${up}" placeholder="Up">
          <input class="form-control form-control-mono qt-down" value="${down}" placeholder="Down">
        </div>
      </div>
      <div class="form-group mb-0">
        <label class="form-label">Priority (1-8)</label>
        <select class="form-control qt-prio">
          ${[1,2,3,4,5,6,7,8].map(p => `<option value="${p}" ${p === prio ? 'selected' : ''}>Priority ${p}</option>`).join('')}
        </select>
      </div>
    </div>
  </div>`;
}

function addQueueTreeRow() {
  qtClientIndex++;
  const container = document.getElementById('qtClientsContainer');
  if (container) {
    container.insertAdjacentHTML('beforeend', makeQTRow(qtClientIndex, `SubQueue-${qtClientIndex}`, `192.168.88.${qtClientIndex * 10}/28`, '2M', '5M', 5));
  }
}

function runQueueTree() {
  const upIface = document.getElementById('qtUpIface')?.value || 'ether1';
  const downIface = document.getElementById('qtDownIface')?.value || 'bridge-lan';
  const totalUp = document.getElementById('qtTotalUp')?.value || '20M';
  const totalDown = document.getElementById('qtTotalDown')?.value || '50M';
  const burstMultiplier = parseFloat(document.getElementById('qtBurstMult')?.value) || 2;
  const defaultPriority = parseInt(document.getElementById('qtDefaultPriority')?.value, 10) || 8;

  const rows = document.querySelectorAll('#qtClientsContainer .isp-row');
  const clients = [];
  rows.forEach(r => {
    const name = r.querySelector('.qt-name')?.value?.trim() || 'Client';
    const target = r.querySelector('.qt-target')?.value?.trim() || '192.168.88.0/24';
    const upMax = r.querySelector('.qt-up')?.value?.trim() || '5M';
    const downMax = r.querySelector('.qt-down')?.value?.trim() || '10M';
    const priority = parseInt(r.querySelector('.qt-prio')?.value, 10) || 5;
    clients.push({ name, target, upMax, downMax, priority });
  });

  const out = [
    `#####################################################################`,
    `# ComitTools PRO — Queue Tree Hierarchical Script`,
    `# Total Upload: ${totalUp} (${upIface})  |  Total Download: ${totalDown} (${downIface})`,
    `# Jumlah Sub-Queues: ${clients.length}`,
    `#####################################################################`,
    ``,
    `# ---- Step 1: Firewall Mangle Packet Marking ----`,
    `/ip firewall mangle`,
  ];

  clients.forEach(c => {
    out.push(`add chain=forward src-address=${c.target} action=mark-packet new-packet-mark="${c.name}-UP" passthrough=no comment="Mark Upload: ${c.name}"`);
    out.push(`add chain=forward dst-address=${c.target} action=mark-packet new-packet-mark="${c.name}-DOWN" passthrough=no comment="Mark Download: ${c.name}"`);
  });

  out.push(``);
  out.push(`# ---- Step 2: Queue Types ----`);
  out.push(`/queue type`);
  out.push(`add kind=pcq name=pcq-upload-custom pcq-classifier=src-address pcq-rate=0`);
  out.push(`add kind=pcq name=pcq-download-custom pcq-classifier=dst-address pcq-rate=0`);
  out.push(``);
  out.push(`# ---- Step 3: Queue Tree Hierarchy ----`);
  out.push(`/queue tree`);
  out.push(`add name="TOTAL-UPLOAD" parent=${upIface} max-limit=${totalUp} queue=default comment="Parent Upload"`);
  out.push(`add name="TOTAL-DOWNLOAD" parent=${downIface} max-limit=${totalDown} queue=default comment="Parent Download"`);
  out.push(``);

  clients.forEach(c => {
    out.push(`add name="${c.name}-UP" parent="TOTAL-UPLOAD" packet-mark="${c.name}-UP" max-limit=${c.upMax} priority=${c.priority} queue=pcq-upload-custom comment="Child UP: ${c.name}"`);
    out.push(`add name="${c.name}-DOWN" parent="TOTAL-DOWNLOAD" packet-mark="${c.name}-DOWN" max-limit=${c.downMax} priority=${c.priority} queue=pcq-download-custom comment="Child DOWN: ${c.name}"`);
  });

  out.push(``);
  out.push(`#####################################################################`);
  out.push(`# Selesai — Monitor bandwidth di Winbox -> Queues -> Queue Tree`);
  out.push(`#####################################################################`);

  const outEl = document.getElementById('qtOutput');
  if (outEl) outEl.value = out.join('\n');
  showToast('✅ Queue Tree script berhasil digenerate!', 'success');
}

// ================================================================
// 6. FAILOVER GATEWAY MULTI-ISP GENERATOR
// ================================================================
function formFailover() {
  return `<div style="display:grid;grid-template-columns:340px 1fr;height:calc(92vh - 80px)">
    <!-- CONFIG PANEL -->
    <div style="overflow-y:auto;padding:20px;border-right:1px solid var(--border-color);display:flex;flex-direction:column;gap:14px">
      <div class="info-box"><i class="fa-solid fa-shuffle text-orange"></i> <b>Failover Gateway Generator</b> — Script failover otomatis recursive routing atau check-gateway ping antar ISP.</div>

      <!-- Mode -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-sliders"></i> Mode Failover</div>
        <div class="mode-selector" id="foModeSelector">
          <button class="mode-btn active" onclick="setFOMode('RECURSIVE')">RECURSIVE</button>
          <button class="mode-btn" onclick="setFOMode('DISTANCE')">DISTANCE</button>
        </div>
        <input type="hidden" id="foMode" value="RECURSIVE">
        <div id="foModeDesc" style="font-size:11px;color:var(--text-muted);margin-top:8px;padding:8px;background:rgba(0,0,0,0.2);border-radius:6px">
          <b style="color:var(--brand-orange)">RECURSIVE</b> — Memeriksa konektivitas riil ke internet publik (8.8.8.8 & 1.1.1.1). Sangat akurat jika ISP mengalami mati jaringan tanpa link fisik putus.
        </div>
      </div>

      <!-- ROS Version -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-microchip"></i> RouterOS Version</div>
        <div style="display:flex;gap:8px">
          <label class="form-check" style="flex:1;background:rgba(56,189,248,0.06);border:1px solid rgba(56,189,248,0.2);border-radius:8px;padding:8px 12px;cursor:pointer">
            <input type="radio" name="foROS" value="v6"> <span>v6.x</span>
          </label>
          <label class="form-check" style="flex:1;background:rgba(63,211,192,0.06);border:1px solid rgba(63,211,192,0.2);border-radius:8px;padding:8px 12px;cursor:pointer">
            <input type="radio" name="foROS" value="v7" checked> <span>v7.x</span>
          </label>
        </div>
      </div>

      <!-- ISP 1 (Primary) -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-network-wired text-teal"></i> ISP 1 — Primary (Utama)</div>
        <div class="form-row">
          <div class="form-group mb-0">
            <label class="form-label">Interface</label>
            <input class="form-control form-control-mono" id="foIsp1Iface" value="ether1">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Gateway IP</label>
            <input class="form-control form-control-mono" id="foIsp1Gw" value="192.168.1.1">
          </div>
        </div>
        <div class="form-group mt-2 mb-0">
          <label class="form-label">Target Check Host (DNS 1)</label>
          <input class="form-control form-control-mono" id="foIsp1Host" value="8.8.8.8">
        </div>
      </div>

      <!-- ISP 2 (Backup) -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-network-wired text-orange"></i> ISP 2 — Backup (Cadangan)</div>
        <div class="form-row">
          <div class="form-group mb-0">
            <label class="form-label">Interface</label>
            <input class="form-control form-control-mono" id="foIsp2Iface" value="ether2">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Gateway IP</label>
            <input class="form-control form-control-mono" id="foIsp2Gw" value="192.168.2.1">
          </div>
        </div>
        <div class="form-group mt-2 mb-0">
          <label class="form-label">Target Check Host (DNS 2)</label>
          <input class="form-control form-control-mono" id="foIsp2Host" value="1.1.1.1">
        </div>
      </div>

      <!-- Optional ISP 3 -->
      <div class="config-section">
        <label class="form-check">
          <input type="checkbox" id="foEnableIsp3" onchange="document.getElementById('foIsp3Wrap').style.display = this.checked ? 'block' : 'none'">
          <span>Tambahkan ISP 3 (Cadangan Ketiga / 4G Modem)</span>
        </label>
        <div id="foIsp3Wrap" style="display:none;margin-top:8px">
          <div class="form-row">
            <div class="form-group mb-0">
              <label class="form-label">Interface</label>
              <input class="form-control form-control-mono" id="foIsp3Iface" value="lte1">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Gateway IP</label>
              <input class="form-control form-control-mono" id="foIsp3Gw" value="192.168.3.1">
            </div>
          </div>
        </div>
      </div>

      <!-- Options -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-gear"></i> Fitur Tambahan</div>
        <label class="form-check"><input type="checkbox" id="foNat" checked> Include NAT Masquerade per WAN</label>
        <label class="form-check"><input type="checkbox" id="foNetwatch" checked> Netwatch Alert & Log Notification</label>
      </div>

      <button class="btn btn-primary btn-lg" onclick="runFailover()">
        <i class="fa-solid fa-play"></i> Generate Failover Script
      </button>
    </div>

    <!-- OUTPUT PANEL -->
    <div style="display:flex;flex-direction:column;padding:20px;gap:12px">
      <div style="display:flex;gap:8px;align-items:center">
        <div style="flex:1;font-size:13px;font-weight:600;color:var(--text-secondary)"><i class="fa-solid fa-terminal text-orange"></i> Output Script</div>
        <button class="btn btn-secondary btn-sm" onclick="copyOutput('foOutput')"><i class="fa-solid fa-copy"></i> Copy</button>
        <button class="btn btn-secondary btn-sm" onclick="downloadOutput('foOutput','failover-gateway.rsc')"><i class="fa-solid fa-download"></i> .rsc</button>
        <button class="btn btn-teal btn-sm" onclick="runFailover()"><i class="fa-solid fa-bolt"></i> Generate</button>
      </div>
      <div class="terminal-header">
        <div class="terminal-dots"><div class="terminal-dot red"></div><div class="terminal-dot yellow"></div><div class="terminal-dot green"></div></div>
        <div class="terminal-filename"><i class="fa-solid fa-terminal"></i> failover-gateway.rsc</div>
        <div></div>
      </div>
      <textarea class="terminal-output" id="foOutput" style="min-height:calc(92vh - 280px);border:1px solid var(--border-color);border-top:none;border-radius:0 0 var(--radius-md) var(--radius-md)" readonly placeholder="# Klik 'Generate Failover Script'..."></textarea>
    </div>
  </div>`;
}

function setFOMode(mode) {
  const el = document.getElementById('foMode');
  if (el) el.value = mode;
  document.querySelectorAll('#foModeSelector .mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.includes(mode));
  });
  const desc = document.getElementById('foModeDesc');
  if (desc) {
    if (mode === 'RECURSIVE') {
      desc.innerHTML = '<b style="color:var(--brand-orange)">RECURSIVE</b> — Memeriksa konektivitas riil ke internet publik (8.8.8.8 & 1.1.1.1). Sangat akurat jika ISP mengalami mati jaringan tanpa link fisik putus.';
    } else {
      desc.innerHTML = '<b style="color:var(--brand-teal)">DISTANCE</b> — Failover berbasis ping ke gateway modem langsung (check-gateway=ping). Ringan dan sederhana.';
    }
  }
}

function runFailover() {
  const mode = document.getElementById('foMode')?.value || 'RECURSIVE';
  const ros = document.querySelector('input[name="foROS"]:checked')?.value || 'v7';
  const isp1Iface = document.getElementById('foIsp1Iface')?.value || 'ether1';
  const isp1Gw = document.getElementById('foIsp1Gw')?.value || '192.168.1.1';
  const isp1Host = document.getElementById('foIsp1Host')?.value || '8.8.8.8';

  const isp2Iface = document.getElementById('foIsp2Iface')?.value || 'ether2';
  const isp2Gw = document.getElementById('foIsp2Gw')?.value || '192.168.2.1';
  const isp2Host = document.getElementById('foIsp2Host')?.value || '1.1.1.1';

  const hasIsp3 = !!document.getElementById('foEnableIsp3')?.checked;
  const isp3Iface = document.getElementById('foIsp3Iface')?.value || 'lte1';
  const isp3Gw = document.getElementById('foIsp3Gw')?.value || '192.168.3.1';

  const includeNat = !!document.getElementById('foNat')?.checked;
  const includeNetwatch = !!document.getElementById('foNetwatch')?.checked;

  const out = [
    `#####################################################################`,
    `# ComitTools PRO — Failover Gateway Multi-ISP (${mode} Mode)`,
    `# RouterOS Version: ${ros.toUpperCase()}  |  ISP1: ${isp1Iface}  |  ISP2: ${isp2Iface}${hasIsp3 ? `  |  ISP3: ${isp3Iface}` : ''}`,
    `#####################################################################`,
    ``,
  ];

  if (includeNat) {
    out.push(`# ---- Step 1: NAT Masquerade per WAN ----`);
    out.push(`/ip firewall nat`);
    out.push(`add chain=srcnat out-interface=${isp1Iface} action=masquerade comment="NAT Masquerade - ISP1 (${isp1Iface})"`);
    out.push(`add chain=srcnat out-interface=${isp2Iface} action=masquerade comment="NAT Masquerade - ISP2 (${isp2Iface})"`);
    if (hasIsp3) {
      out.push(`add chain=srcnat out-interface=${isp3Iface} action=masquerade comment="NAT Masquerade - ISP3 (${isp3Iface})"`);
    }
    out.push(``);
  }

  out.push(`# ---- Step 2: Routing Table & Gateways ----`);
  out.push(`/ip route`);

  if (mode === 'RECURSIVE') {
    out.push(`# Route Host Ping Check ISP 1 via Gateway 1`);
    out.push(`add dst-address=${isp1Host}/32 gateway=${isp1Gw} scope=10 comment="Host Check - ISP1 via Gateway"`);
    out.push(`# Route Default Internet via Virtual Host 1`);
    out.push(`add distance=1 dst-address=0.0.0.0/0 gateway=${isp1Host} check-gateway=ping target-scope=30 comment="Primary Default Route - ISP1"`);
    out.push(``);
    out.push(`# Route Host Ping Check ISP 2 via Gateway 2`);
    out.push(`add dst-address=${isp2Host}/32 gateway=${isp2Gw} scope=10 comment="Host Check - ISP2 via Gateway"`);
    out.push(`# Route Default Internet via Virtual Host 2`);
    out.push(`add distance=2 dst-address=0.0.0.0/0 gateway=${isp2Host} check-gateway=ping target-scope=30 comment="Backup Default Route - ISP2"`);
    if (hasIsp3) {
      out.push(``);
      out.push(`# Backup Default Route ISP 3`);
      out.push(`add distance=3 dst-address=0.0.0.0/0 gateway=${isp3Gw} check-gateway=ping comment="Tertiary Default Route - ISP3"`);
    }
  } else {
    out.push(`add distance=1 dst-address=0.0.0.0/0 gateway=${isp1Gw} check-gateway=ping comment="Primary Route ISP1"`);
    out.push(`add distance=2 dst-address=0.0.0.0/0 gateway=${isp2Gw} check-gateway=ping comment="Backup Route ISP2"`);
    if (hasIsp3) {
      out.push(`add distance=3 dst-address=0.0.0.0/0 gateway=${isp3Gw} check-gateway=ping comment="Tertiary Route ISP3"`);
    }
  }

  if (includeNetwatch) {
    out.push(``);
    out.push(`# ---- Step 3: Netwatch Link Monitoring & Log ----`);
    out.push(`/tool netwatch`);
    out.push(`add host=${isp1Host} interval=10s timeout=2s \\`);
    out.push(`    up-script=":log info \\"✅ [ISP1 UP] Koneksi ISP 1 pulih kembali\\"" \\`);
    out.push(`    down-script=":log error \\"🚨 [ISP1 DOWN] ISP 1 mati! Beralih ke Backup ISP 2\\"" \\`);
    out.push(`    comment="Monitor ISP1"`);
    out.push(`add host=${isp2Host} interval=15s timeout=2s \\`);
    out.push(`    up-script=":log info \\"✅ [ISP2 UP] Backup link ISP 2 standby\\"" \\`);
    out.push(`    down-script=":log warning \\"⚠️ [ISP2 DOWN] Link cadangan ISP 2 tidak merespon\\"" \\`);
    out.push(`    comment="Monitor ISP2"`);
  }

  out.push(``);
  out.push(`#####################################################################`);
  out.push(`# Selesai — Cek status failover di Winbox -> IP -> Routes`);
  out.push(`#####################################################################`);

  const outEl = document.getElementById('foOutput');
  if (outEl) outEl.value = out.join('\n');
  showToast('✅ Failover script berhasil digenerate!', 'success');
}

// ================================================================
// 7. NETWATCH ALERT TELEGRAM GENERATOR
// ================================================================
function formNetwatch() {
  return `<div style="display:grid;grid-template-columns:340px 1fr;height:calc(92vh - 80px)">
    <!-- CONFIG PANEL -->
    <div style="overflow-y:auto;padding:20px;border-right:1px solid var(--border-color);display:flex;flex-direction:column;gap:14px">
      <div class="info-box"><i class="fa-solid fa-bell text-orange"></i> <b>Netwatch Alert Generator</b> — Monitor IP Host otomatis dengan notifikasi instan via Telegram Bot &amp; buzzer.</div>

      <!-- Host & Timing -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-bullseye"></i> Parameter Ping Monitor</div>
        <div class="form-group">
          <label class="form-label">Host Target (IP / Gateway)</label>
          <input class="form-control form-control-mono" id="nwHost" value="8.8.8.8" placeholder="8.8.8.8 / 1.1.1.1 / IP Gateway">
        </div>
        <div class="form-row">
          <div class="form-group mb-0">
            <label class="form-label">Interval Ping</label>
            <input class="form-control form-control-mono" id="nwInterval" value="15s">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Timeout</label>
            <input class="form-control form-control-mono" id="nwTimeout" value="2s">
          </div>
        </div>
      </div>

      <!-- Telegram Bot Configuration -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-brands fa-telegram text-teal"></i> Telegram Bot API</div>
        <label class="form-check">
          <input type="checkbox" id="nwUseTg" checked onchange="document.getElementById('nwTgWrap').style.display = this.checked ? 'block' : 'none'">
          <span>Kirim Notifikasi ke Telegram</span>
        </label>
        <div id="nwTgWrap" style="margin-top:8px">
          <div class="form-group">
            <label class="form-label">Telegram Bot Token</label>
            <input class="form-control form-control-mono" id="nwBotToken" value="YOUR_BOT_TOKEN" placeholder="123456:ABC-DEF1234ghIkl">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Chat ID / Group ID</label>
            <input class="form-control form-control-mono" id="nwChatId" value="YOUR_CHAT_ID" placeholder="-100123456789">
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-volume-high"></i> Aksi Tambahan</div>
        <label class="form-check"><input type="checkbox" id="nwBeep" checked> Bunyikan Buzzer Speaker Router (Beep)</label>
        <label class="form-check"><input type="checkbox" id="nwLog" checked> Tulis ke System Log (/log warning & info)</label>
      </div>

      <!-- Custom Alert Messages -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-comment-dots"></i> Template Pesan</div>
        <div class="form-group">
          <label class="form-label">Pesan LINK UP</label>
          <input class="form-control form-control-mono" id="nwMsgUp" value="✅ LINK UP - Internet Host $host pulih!">
        </div>
        <div class="form-group mb-0">
          <label class="form-label">Pesan LINK DOWN</label>
          <input class="form-control form-control-mono" id="nwMsgDown" value="🔴 LINK DOWN - Internet Host $host terputus!">
        </div>
      </div>

      <button class="btn btn-primary btn-lg" onclick="runNetwatch()">
        <i class="fa-solid fa-play"></i> Generate Netwatch Script
      </button>
    </div>

    <!-- OUTPUT PANEL -->
    <div style="display:flex;flex-direction:column;padding:20px;gap:12px">
      <div style="display:flex;gap:8px;align-items:center">
        <div style="flex:1;font-size:13px;font-weight:600;color:var(--text-secondary)"><i class="fa-solid fa-terminal text-orange"></i> Output Script</div>
        <button class="btn btn-secondary btn-sm" onclick="copyOutput('nwOutput')"><i class="fa-solid fa-copy"></i> Copy</button>
        <button class="btn btn-secondary btn-sm" onclick="downloadOutput('nwOutput','netwatch-telegram.rsc')"><i class="fa-solid fa-download"></i> .rsc</button>
        <button class="btn btn-teal btn-sm" onclick="runNetwatch()"><i class="fa-solid fa-bolt"></i> Generate</button>
      </div>
      <div class="terminal-header">
        <div class="terminal-dots"><div class="terminal-dot red"></div><div class="terminal-dot yellow"></div><div class="terminal-dot green"></div></div>
        <div class="terminal-filename"><i class="fa-solid fa-terminal"></i> netwatch-telegram.rsc</div>
        <div></div>
      </div>
      <textarea class="terminal-output" id="nwOutput" style="min-height:calc(92vh - 280px);border:1px solid var(--border-color);border-top:none;border-radius:0 0 var(--radius-md) var(--radius-md)" readonly placeholder="# Klik 'Generate Netwatch Script'..."></textarea>
    </div>
  </div>`;
}

function runNetwatch() {
  const host = document.getElementById('nwHost')?.value || '8.8.8.8';
  const interval = document.getElementById('nwInterval')?.value || '15s';
  const timeout = document.getElementById('nwTimeout')?.value || '2s';
  const useTg = !!document.getElementById('nwUseTg')?.checked;
  const botToken = document.getElementById('nwBotToken')?.value || 'YOUR_BOT_TOKEN';
  const chatId = document.getElementById('nwChatId')?.value || 'YOUR_CHAT_ID';
  const useBeep = !!document.getElementById('nwBeep')?.checked;
  const useLog = !!document.getElementById('nwLog')?.checked;
  const msgUp = document.getElementById('nwMsgUp')?.value || '✅ LINK UP - Internet Pulih';
  const msgDown = document.getElementById('nwMsgDown')?.value || '🔴 LINK DOWN - Internet Putus';

  const upCommands = [];
  const downCommands = [];

  if (useLog) {
    upCommands.push(`:log info "${msgUp}"`);
    downCommands.push(`:log error "${msgDown}"`);
  }
  if (useBeep) {
    upCommands.push(`:beep frequency=1200 length=200ms; :delay 150ms; :beep frequency=1600 length=300ms`);
    downCommands.push(`:beep frequency=600 length=500ms; :delay 200ms; :beep frequency=400 length=800ms`);
  }
  if (useTg) {
    upCommands.push(`:local rname [/system identity get name]; /tool fetch url="https://api.telegram.org/bot${botToken}/sendMessage\\?chat_id=${chatId}&text=%5B$rname%5D%20${encodeURIComponent(msgUp)}" keep-result=no`);
    downCommands.push(`:local rname [/system identity get name]; /tool fetch url="https://api.telegram.org/bot${botToken}/sendMessage\\?chat_id=${chatId}&text=%5B$rname%5D%20${encodeURIComponent(msgDown)}" keep-result=no`);
  }

  const out = [
    `#####################################################################`,
    `# ComitTools PRO — Netwatch Alert Telegram & Buzzer`,
    `# Host Monitor: ${host}  |  Interval: ${interval}  |  Timeout: ${timeout}`,
    `#####################################################################`,
    ``,
    `/tool netwatch`,
    `add host=${host} interval=${interval} timeout=${timeout} \\`,
    `    up-script="${upCommands.join('; ')}" \\`,
    `    down-script="${downCommands.join('; ')}" \\`,
    `    comment="Netwatch Alert: ${host}"`,
    ``,
    `#####################################################################`,
    `# Test Kirim Pesan Telegram Manual:`,
    useTg ? `/tool fetch url="https://api.telegram.org/bot${botToken}/sendMessage\\?chat_id=${chatId}&text=Test%20Alert%20ComitTools%20PRO" keep-result=no` : `# Telegram dimatikan`,
    `#####################################################################`,
  ];

  const outEl = document.getElementById('nwOutput');
  if (outEl) outEl.value = out.join('\n');
  showToast('✅ Netwatch script berhasil digenerate!', 'success');
}

// ================================================================
// 8. AUTO BACKUP SCHEDULER GENERATOR
// ================================================================
function formAutoBackup() {
  return `<div style="display:grid;grid-template-columns:340px 1fr;height:calc(92vh - 80px)">
    <!-- CONFIG PANEL -->
    <div style="overflow-y:auto;padding:20px;border-right:1px solid var(--border-color);display:flex;flex-direction:column;gap:14px">
      <div class="info-box"><i class="fa-solid fa-database text-teal"></i> <b>Auto Backup Scheduler</b> — Pencadangan otomatis binary (.backup) &amp; text script (.rsc) dengan pembersihan file lama.</div>

      <!-- Mode & Schedule -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-clock"></i> Format &amp; Jadwal</div>
        <div class="form-group">
          <label class="form-label">Tipe Backup</label>
          <select class="form-control" id="abMode">
            <option value="both" selected>Keduanya (.backup binary + .rsc export)</option>
            <option value="backup">Binary (.backup) Saja</option>
            <option value="rsc">Text Script (.rsc) Saja</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group mb-0">
            <label class="form-label">Frekuensi Jadwal</label>
            <select class="form-control" id="abInterval">
              <option value="1d" selected>Setiap Hari (1d)</option>
              <option value="7d">Setiap Minggu (7d)</option>
              <option value="12h">Setiap 12 Jam (12h)</option>
            </select>
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Jam Eksekusi</label>
            <input class="form-control form-control-mono" id="abStartTime" value="02:00:00" placeholder="02:00:00">
          </div>
        </div>
        <div class="form-group mt-2 mb-0">
          <label class="form-label">Prefix Nama File</label>
          <input class="form-control form-control-mono" id="abPrefix" value="Backup-Router">
        </div>
      </div>

      <!-- Password & Cleanup -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-hard-drive"></i> Proteksi &amp; Kebersihan Storage</div>
        <div class="form-group">
          <label class="form-label">Password Backup (Opsional)</label>
          <input class="form-control form-control-mono" id="abPassword" type="password" placeholder="Kosongkan jika tanpa password">
        </div>
        <label class="form-check">
          <input type="checkbox" id="abCleanup" checked>
          <span>Hapus Otomatis File Cadangan Lebih dari 7 Hari (Cegah Memori Penuh)</span>
        </label>
      </div>

      <!-- Notifications -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-bell"></i> Notifikasi Selesai</div>
        <label class="form-check"><input type="checkbox" id="abLog" checked> Catat Status ke System Log</label>
      </div>

      <button class="btn btn-primary btn-lg" onclick="runAutoBackup()">
        <i class="fa-solid fa-play"></i> Generate Auto Backup Script
      </button>
    </div>

    <!-- OUTPUT PANEL -->
    <div style="display:flex;flex-direction:column;padding:20px;gap:12px">
      <div style="display:flex;gap:8px;align-items:center">
        <div style="flex:1;font-size:13px;font-weight:600;color:var(--text-secondary)"><i class="fa-solid fa-terminal text-orange"></i> Output Script</div>
        <button class="btn btn-secondary btn-sm" onclick="copyOutput('abOutput')"><i class="fa-solid fa-copy"></i> Copy</button>
        <button class="btn btn-secondary btn-sm" onclick="downloadOutput('abOutput','auto-backup.rsc')"><i class="fa-solid fa-download"></i> .rsc</button>
        <button class="btn btn-teal btn-sm" onclick="runAutoBackup()"><i class="fa-solid fa-bolt"></i> Generate</button>
      </div>
      <div class="terminal-header">
        <div class="terminal-dots"><div class="terminal-dot red"></div><div class="terminal-dot yellow"></div><div class="terminal-dot green"></div></div>
        <div class="terminal-filename"><i class="fa-solid fa-terminal"></i> auto-backup.rsc</div>
        <div></div>
      </div>
      <textarea class="terminal-output" id="abOutput" style="min-height:calc(92vh - 280px);border:1px solid var(--border-color);border-top:none;border-radius:0 0 var(--radius-md) var(--radius-md)" readonly placeholder="# Klik 'Generate Auto Backup Script'..."></textarea>
    </div>
  </div>`;
}

function runAutoBackup() {
  const mode = document.getElementById('abMode')?.value || 'both';
  const interval = document.getElementById('abInterval')?.value || '1d';
  const startTime = document.getElementById('abStartTime')?.value || '02:00:00';
  const prefix = document.getElementById('abPrefix')?.value || 'Backup-Router';
  const pass = (document.getElementById('abPassword')?.value || '').trim();
  const cleanup = !!document.getElementById('abCleanup')?.checked;

  const scriptLines = [
    `:local date [/system clock get date]`,
    `:local time [/system clock get time]`,
    `:local rname [/system identity get name]`,
    `:local fname ("${prefix}-" . $rname . "-" . [:pick $date 7 11] . [:pick $date 0 3] . [:pick $date 4 6])`,
  ];

  if (mode === 'both' || mode === 'backup') {
    if (pass) {
      scriptLines.push(`/system backup save name=($fname . ".backup") password="${pass}"`);
    } else {
      scriptLines.push(`/system backup save name=($fname . ".backup")`);
    }
  }

  if (mode === 'both' || mode === 'rsc') {
    scriptLines.push(`/export file=($fname . ".rsc")`);
  }

  scriptLines.push(`:log info ("✅ Backup selesai dibuat: " . $fname)`);

  if (cleanup) {
    scriptLines.push(``);
    scriptLines.push(`# Hapus file backup lama`);
    scriptLines.push(`:local oldFiles [/file find where name~"${prefix}" and creation-time<([/system clock get time] - 7d)]`);
    scriptLines.push(`:if ([:len $oldFiles] > 0) do={ /file remove $oldFiles; :log info "🧹 File backup lama dibersihkan" }`);
  }

  const out = [
    `#####################################################################`,
    `# ComitTools PRO — Auto Backup & Scheduler`,
    `# Mode: ${mode.toUpperCase()}  |  Interval: ${interval}  |  Jam Mulai: ${startTime}`,
    `#####################################################################`,
    ``,
    `# ---- Step 1: Script Pembuat Backup ----`,
    `/system script`,
    `add name="run-auto-backup" source="\\`,
    ...scriptLines.map(l => `  ${l};\\`),
    `  " comment="Auto Backup System by ComitTools PRO"`,
    ``,
    `# ---- Step 2: Scheduler Otomatis ----`,
    `/system scheduler`,
    `add name="schedule-auto-backup" interval=${interval} start-time=${startTime} \\`,
    `    on-event="/system script run run-auto-backup" \\`,
    `    comment="Jadwal Otomatis Backup Harian"`,
    ``,
    `#####################################################################`,
    `# Jalankan sekarang untuk menguji:`,
    `/system script run run-auto-backup`,
    `#####################################################################`,
  ];

  const outEl = document.getElementById('abOutput');
  if (outEl) outEl.value = out.join('\n');
  showToast('✅ Auto backup script berhasil digenerate!', 'success');
}

// ================================================================
// 9. ROUTER BRANDING & HARDENING GENERATOR
// ================================================================
function formBranding() {
  return `<div style="display:grid;grid-template-columns:340px 1fr;height:calc(92vh - 80px)">
    <!-- CONFIG PANEL -->
    <div style="overflow-y:auto;padding:20px;border-right:1px solid var(--border-color);display:flex;flex-direction:column;gap:14px">
      <div class="info-box"><i class="fa-solid fa-id-card text-orange"></i> <b>Router Branding Tool</b> — Kustomisasi identitas router, system banner, port servis &amp; hardening akun.</div>

      <!-- Identity & Banner -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-tag"></i> Identitas &amp; Banner Login</div>
        <div class="form-group">
          <label class="form-label">Router Identity (Hostname)</label>
          <input class="form-control form-control-mono" id="brIdentity" value="ComitRouter-Core-01">
        </div>
        <div class="form-group mb-0">
          <label class="form-label">Login Note (System Banner)</label>
          <textarea class="form-control form-control-mono" id="brBanner" rows="2" style="font-size:11px">AUTHORIZED ACCESS ONLY - Managed by ComitTools PRO | NOC Admin</textarea>
        </div>
      </div>

      <!-- Timezone & NTP -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-clock"></i> Zona Waktu &amp; NTP Client</div>
        <div class="form-group">
          <label class="form-label">Timezone</label>
          <select class="form-control" id="brTimezone">
            <option value="Asia/Jakarta" selected>Asia/Jakarta (WIB)</option>
            <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
            <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
            <option value="UTC">UTC (Universal)</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group mb-0">
            <label class="form-label">NTP Server 1</label>
            <input class="form-control form-control-mono" id="brNtp1" value="id.pool.ntp.org">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">NTP Server 2</label>
            <input class="form-control form-control-mono" id="brNtp2" value="0.pool.ntp.org">
          </div>
        </div>
      </div>

      <!-- Management Ports Hardening -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-shield-halved"></i> Ganti Port Standar &amp; Hardening</div>
        <div class="form-row">
          <div class="form-group mb-0">
            <label class="form-label">Winbox Port</label>
            <input class="form-control form-control-mono" id="brPortWinbox" value="8291">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">WebFig Port</label>
            <input class="form-control form-control-mono" id="brPortWeb" value="8080">
          </div>
          <div class="form-group mb-0">
            <label class="form-label">SSH Port</label>
            <input class="form-control form-control-mono" id="brPortSSH" value="2222">
          </div>
        </div>
        <div style="margin-top:8px">
          <label class="form-check"><input type="checkbox" id="brDisTelnet" checked> Nonaktifkan Telnet (Insecure)</label>
          <label class="form-check"><input type="checkbox" id="brDisFTP" checked> Nonaktifkan FTP (Insecure)</label>
          <label class="form-check"><input type="checkbox" id="brDisAPI" checked> Nonaktifkan API Standard</label>
          <label class="form-check"><input type="checkbox" id="brDisAPISSL" checked> Nonaktifkan API-SSL</label>
        </div>
      </div>

      <!-- Admin User -->
      <div class="config-section">
        <div class="config-section-title"><i class="fa-solid fa-user-shield"></i> Akun Administrator Baru</div>
        <label class="form-check">
          <input type="checkbox" id="brCreateUser" checked onchange="document.getElementById('brUserWrap').style.display = this.checked ? 'block' : 'none'">
          <span>Buat Akun Admin Baru &amp; Amankan</span>
        </label>
        <div id="brUserWrap" style="margin-top:8px">
          <div class="form-row">
            <div class="form-group mb-0">
              <label class="form-label">Username</label>
              <input class="form-control form-control-mono" id="brUser" value="sysadmin">
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Password</label>
              <input class="form-control form-control-mono" id="brPass" value="P@ssw0rd2026!">
            </div>
          </div>
          <label class="form-check mt-2 mb-0">
            <input type="checkbox" id="brDisAdmin" checked> 
            <span>Nonaktifkan User Default 'admin'</span>
          </label>
        </div>
      </div>

      <button class="btn btn-primary btn-lg" onclick="runBranding()">
        <i class="fa-solid fa-play"></i> Generate Branding Script
      </button>
    </div>

    <!-- OUTPUT PANEL -->
    <div style="display:flex;flex-direction:column;padding:20px;gap:12px">
      <div style="display:flex;gap:8px;align-items:center">
        <div style="flex:1;font-size:13px;font-weight:600;color:var(--text-secondary)"><i class="fa-solid fa-terminal text-orange"></i> Output Script</div>
        <button class="btn btn-secondary btn-sm" onclick="copyOutput('brOutput')"><i class="fa-solid fa-copy"></i> Copy</button>
        <button class="btn btn-secondary btn-sm" onclick="downloadOutput('brOutput','router-branding.rsc')"><i class="fa-solid fa-download"></i> .rsc</button>
        <button class="btn btn-teal btn-sm" onclick="runBranding()"><i class="fa-solid fa-bolt"></i> Generate</button>
      </div>
      <div class="terminal-header">
        <div class="terminal-dots"><div class="terminal-dot red"></div><div class="terminal-dot yellow"></div><div class="terminal-dot green"></div></div>
        <div class="terminal-filename"><i class="fa-solid fa-terminal"></i> router-branding.rsc</div>
        <div></div>
      </div>
      <textarea class="terminal-output" id="brOutput" style="min-height:calc(92vh - 280px);border:1px solid var(--border-color);border-top:none;border-radius:0 0 var(--radius-md) var(--radius-md)" readonly placeholder="# Klik 'Generate Branding Script'..."></textarea>
    </div>
  </div>`;
}

function runBranding() {
  const identity = document.getElementById('brIdentity')?.value || 'ComitRouter-Core-01';
  const banner = document.getElementById('brBanner')?.value || 'AUTHORIZED ACCESS ONLY';
  const timezone = document.getElementById('brTimezone')?.value || 'Asia/Jakarta';
  const ntp1 = document.getElementById('brNtp1')?.value || 'id.pool.ntp.org';
  const ntp2 = document.getElementById('brNtp2')?.value || '0.pool.ntp.org';
  const portWinbox = document.getElementById('brPortWinbox')?.value || '8291';
  const portWeb = document.getElementById('brPortWeb')?.value || '8080';
  const portSSH = document.getElementById('brPortSSH')?.value || '2222';
  const disTelnet = !!document.getElementById('brDisTelnet')?.checked;
  const disFTP = !!document.getElementById('brDisFTP')?.checked;
  const disAPI = !!document.getElementById('brDisAPI')?.checked;
  const disAPISSL = !!document.getElementById('brDisAPISSL')?.checked;
  const createUser = !!document.getElementById('brCreateUser')?.checked;
  const user = document.getElementById('brUser')?.value || 'sysadmin';
  const pass = document.getElementById('brPass')?.value || 'P@ssw0rd2026!';
  const disAdmin = !!document.getElementById('brDisAdmin')?.checked;

  const out = [
    `#####################################################################`,
    `# ComitTools PRO — Router Branding & Security Hardening`,
    `# Identity: ${identity}  |  Timezone: ${timezone}`,
    `#####################################################################`,
    ``,
    `# ---- Step 1: System Identity & Login Banner ----`,
    `/system identity set name="${identity}"`,
    `/system note set note="${banner}" show-at-login=yes`,
    ``,
    `# ---- Step 2: Timezone & SNTP Client ----`,
    `/system clock set time-zone-name="${timezone}"`,
    `/system ntp client set enabled=yes`,
    `/system ntp client servers add address="${ntp1}"`,
    `/system ntp client servers add address="${ntp2}"`,
    ``,
    `# ---- Step 3: Service Ports Hardening ----`,
    `/ip service`,
    `set winbox port=${portWinbox} disabled=no`,
    `set www port=${portWeb} disabled=no`,
    `set ssh port=${portSSH} disabled=no`,
  ];

  if (disTelnet) out.push(`set telnet disabled=yes`);
  if (disFTP) out.push(`set ftp disabled=yes`);
  if (disAPI) out.push(`set api disabled=yes`);
  if (disAPISSL) out.push(`set api-ssl disabled=yes`);

  if (createUser) {
    out.push(``);
    out.push(`# ---- Step 4: Administrator User Hardening ----`);
    out.push(`/user add name="${user}" password="${pass}" group=full comment="Created by ComitTools PRO"`);
    if (disAdmin) {
      out.push(`/user set [find where name="admin"] disabled=yes`);
    }
  }

  out.push(``);
  out.push(`:log info "✅ Router branding & hardening selesai diterapkan!"`);
  out.push(`:put "Router branding successfully applied by ComitTools PRO"`);

  const outEl = document.getElementById('brOutput');
  if (outEl) outEl.value = out.join('\n');
  showToast('✅ Router branding script berhasil digenerate!', 'success');
}

// ================================================================
// COPY / DOWNLOAD OUTPUT
// ================================================================
function copyOutput(id) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.value).then(() => {
    showToast('✅ Script di-copy ke clipboard!', 'success');
  }).catch(() => {
    el.select();
    document.execCommand('copy');
    showToast('✅ Script di-copy!', 'success');
  });
}

function downloadOutput(id, filename) {
  const el = document.getElementById(id);
  if (!el || !el.value.trim()) { showToast('❌ Belum ada script untuk didownload', 'error'); return; }
  const blob = new Blob([el.value], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename || 'mikrotik-script.rsc';
  a.click();
  showToast(`📥 Script didownload: ${filename}`, 'success');
}

// ================================================================
// NAV MODALS
// ================================================================
function openNavModal(type) {
  const modal = document.getElementById('navModal');
  const title = document.getElementById('navModalTitle');
  const body = document.getElementById('navModalBody');
  if (!modal) return;

  const contents = {
    price: { icon: 'fa-tag', title: 'Harga & Paket', body: getPriceHTML() },
    updates: { icon: 'fa-rotate', title: 'Updates & Changelog', body: getUpdatesHTML() },
    docs: { icon: 'fa-book', title: 'Dokumentasi', body: getDocsHTML() },
    contact: { icon: 'fa-envelope', title: 'Kontak & Support', body: getContactHTML() },
    tools: { icon: 'fa-toolbox', title: 'Semua Tools', body: getAllToolsHTML() },
  };

  const c = contents[type] || contents.docs;
  title.innerHTML = `<i class="fa-solid ${c.icon} text-orange"></i> &nbsp;${c.title}`;
  body.innerHTML = c.body;
  modal.classList.add('open');
}

function getPriceHTML() {
  const user = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;
  const mem = (user && typeof Auth !== 'undefined' && Auth.getMembership) ? Auth.getMembership(user.uid) : null;

  return `<div class="pricing-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:16px">
    <!-- 1. FREE -->
    <div class="pricing-card">
      <div style="font-size:18px;font-weight:800;color:var(--text-primary);margin-bottom:2px">1. FREE</div>
      <div style="font-size:26px;font-weight:900;color:var(--brand-orange);margin-bottom:12px">Rp 0<span style="font-size:12px;color:var(--text-muted)">/selamanya</span></div>
      <div style="font-size:11px;color:var(--brand-teal);font-weight:700;margin-bottom:10px">Fitur Dasar MikroTik</div>
      <ul style="list-style:none;font-size:11.5px;color:var(--text-secondary);display:flex;flex-direction:column;gap:7px;margin-bottom:20px">
        <li><i class="fa-solid fa-check text-success"></i> Hotspot Setup Generator</li>
        <li><i class="fa-solid fa-check text-success"></i> Kalkulator PON Pro (1:128)</li>
        <li><i class="fa-solid fa-check text-success"></i> Ai Generator</li>
        <li><i class="fa-solid fa-check text-success"></i> Official Download Tools</li>
      </ul>
      ${user ? `<button class="btn btn-secondary btn-full" style="opacity:0.8;cursor:default"><i class="fa-solid fa-circle-check"></i> ${mem && mem.package === 'FREE' ? 'Paket Saat Ini' : 'Fitur Gratis'}</button>` : `<a href="login/index.html#register" class="btn btn-secondary btn-full">Daftar Akun Gratis</a>`}
    </div>

    <!-- 2. 7 DAYS -->
    <div class="pricing-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
        <div style="font-size:18px;font-weight:800;color:var(--text-primary)">2. 7 DAYS</div>
        <span class="badge badge-teal" style="font-size:9px">1 MINGGU</span>
      </div>
      <div style="font-size:26px;font-weight:900;color:var(--brand-orange);margin-bottom:4px">Rp 15.000</div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px">Akses untuk 1 Minggu</div>
      <ul style="list-style:none;font-size:11.5px;color:var(--text-secondary);display:flex;flex-direction:column;gap:7px;margin-bottom:20px">
        <li><i class="fa-solid fa-star text-warning"></i> <strong>Semua fitur PRO</strong></li>
        <li><i class="fa-solid fa-check text-success"></i> Semua fitur FREE</li>
        <li><i class="fa-solid fa-check text-success"></i> LB PCC Ultimate (2-15 ISP)</li>
        <li><i class="fa-solid fa-check text-success"></i> LOCAL + RECURSIVE + HYBRID</li>
        <li><i class="fa-solid fa-check text-success"></i> Queue Tree Generator</li>
        <li><i class="fa-solid fa-check text-success"></i> WireGuard Generator (v7)</li>
        <li><i class="fa-solid fa-check text-success"></i> Priority Support via WA</li>
        <li><i class="fa-solid fa-check text-success"></i> LB PCC Generator (2-4 ISP)</li>
        <li><i class="fa-solid fa-check text-success"></i> Firewall Hardening</li>
        <li><i class="fa-solid fa-check text-success"></i> VPN L2TP, PPTP, SSTP</li>
        <li><i class="fa-solid fa-check text-success"></i> Game QoS Generator</li>
        <li><i class="fa-solid fa-check text-success"></i> Queue &amp; Burst Calculator</li>
      </ul>
      <button onclick="openCheckoutModal('7 DAYS')" class="btn btn-primary btn-full"><i class="fa-solid fa-cart-shopping"></i> Beli Paket (Rp 15K)</button>
    </div>

    <!-- 3. PRO MONTHLY (HEMAT 22%) -->
    <div class="pricing-card featured" style="border:2px solid var(--brand-orange)">
      <div class="pricing-card-badge">POPULER · HEMAT 22%</div>
      <div style="font-size:18px;font-weight:800;color:var(--text-primary);margin-bottom:2px">3. PRO MONTHLY</div>
      <div style="font-size:26px;font-weight:900;color:var(--brand-orange);margin-bottom:4px">Rp 49.000</div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px">30 DAYS · Akses untuk 1 Bulan</div>
      <ul style="list-style:none;font-size:11.5px;color:var(--text-secondary);display:flex;flex-direction:column;gap:7px;margin-bottom:20px">
        <li><i class="fa-solid fa-star text-warning"></i> <strong>Semua fitur PRO</strong></li>
        <li><i class="fa-solid fa-check text-success"></i> Semua fitur FREE</li>
        <li><i class="fa-solid fa-check text-success"></i> LB PCC Ultimate (2-15 ISP)</li>
        <li><i class="fa-solid fa-check text-success"></i> LOCAL + RECURSIVE + HYBRID</li>
        <li><i class="fa-solid fa-check text-success"></i> Kalkulator PON Pro (1:128)</li>
        <li><i class="fa-solid fa-check text-success"></i> Queue Tree Generator</li>
        <li><i class="fa-solid fa-check text-success"></i> WireGuard Generator (v7)</li>
        <li><i class="fa-solid fa-check text-success"></i> Priority Support via WA</li>
        <li><i class="fa-solid fa-check text-success"></i> LB PCC Generator (2-4 ISP)</li>
        <li><i class="fa-solid fa-check text-success"></i> Firewall Hardening</li>
        <li><i class="fa-solid fa-check text-success"></i> VPN L2TP, PPTP, SSTP</li>
        <li><i class="fa-solid fa-check text-success"></i> Game QoS Generator</li>
        <li><i class="fa-solid fa-check text-success"></i> Queue &amp; Burst Calculator</li>
      </ul>
      <button onclick="openCheckoutModal('PRO MONTHLY')" class="btn btn-primary btn-full" style="background:var(--brand-orange);box-shadow:0 4px 15px rgba(255,92,0,0.4)"><i class="fa-solid fa-bolt"></i> Beli Paket (Rp 49K)</button>
    </div>

    <!-- 4. PRO 3 MONTHLY -->
    <div class="pricing-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
        <div style="font-size:18px;font-weight:800;color:var(--text-primary)">4. PRO 3 MONTHLY</div>
        <span class="badge badge-amber" style="font-size:9px">90 DAYS</span>
      </div>
      <div style="font-size:26px;font-weight:900;color:var(--brand-orange);margin-bottom:4px">Rp 120.000</div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px">90 DAYS · Akses untuk 3 Bulan</div>
      <ul style="list-style:none;font-size:11.5px;color:var(--text-secondary);display:flex;flex-direction:column;gap:7px;margin-bottom:20px">
        <li><i class="fa-solid fa-star text-warning"></i> <strong>Semua fitur PRO</strong></li>
        <li><i class="fa-solid fa-check text-success"></i> Semua fitur FREE</li>
        <li><i class="fa-solid fa-check text-success"></i> LB PCC Ultimate (2-15 ISP)</li>
        <li><i class="fa-solid fa-check text-success"></i> LOCAL + RECURSIVE + HYBRID</li>
        <li><i class="fa-solid fa-check text-success"></i> Kalkulator PON Pro (1:128)</li>
        <li><i class="fa-solid fa-check text-success"></i> Queue Tree Generator</li>
        <li><i class="fa-solid fa-check text-success"></i> WireGuard Generator (v7)</li>
        <li><i class="fa-solid fa-check text-success"></i> Priority Support via WA</li>
        <li><i class="fa-solid fa-check text-success"></i> LB PCC Generator (2-4 ISP)</li>
        <li><i class="fa-solid fa-check text-success"></i> Firewall Hardening</li>
        <li><i class="fa-solid fa-check text-success"></i> VPN L2TP, PPTP, SSTP</li>
        <li><i class="fa-solid fa-check text-success"></i> Game QoS Generator</li>
        <li><i class="fa-solid fa-check text-success"></i> Queue &amp; Burst Calculator</li>
      </ul>
      <button onclick="openCheckoutModal('PRO 3 MONTHLY')" class="btn btn-primary btn-full"><i class="fa-solid fa-cart-shopping"></i> Beli Paket (Rp 120K)</button>
    </div>

    <!-- 5. PRO LIFETIME -->
    <div class="pricing-card" style="border:1px solid rgba(63,211,192,0.35)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
        <div style="font-size:18px;font-weight:800;color:var(--text-primary)">5. PRO LIFETIME</div>
        <span class="badge badge-teal" style="font-size:9px">SELAMANYA</span>
      </div>
      <div style="font-size:26px;font-weight:900;color:var(--brand-teal);margin-bottom:4px">Rp 250.000</div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px">Akses Sekali Bayar Selamanya</div>
      <ul style="list-style:none;font-size:11.5px;color:var(--text-secondary);display:flex;flex-direction:column;gap:7px;margin-bottom:20px">
        <li><i class="fa-solid fa-check text-success"></i> Semua fitur PRO tanpa batas</li>
        <li><i class="fa-solid fa-infinity" style="color:var(--brand-teal)"></i> Akses selamanya (No Expiry)</li>
        <li><i class="fa-solid fa-infinity" style="color:var(--brand-teal)"></i> Update gratis selamanya</li>
        <li><i class="fa-solid fa-star text-warning"></i> Dedicated VIP support via WA</li>
        <li><i class="fa-solid fa-shield-halved text-success"></i> Lisensi akun permanen</li>
      </ul>
      <button onclick="openCheckoutModal('PRO LIFETIME')" class="btn btn-teal btn-full"><i class="fa-solid fa-crown"></i> Beli Lifetime (Rp 250K)</button>
    </div>
  </div>`;
}

function getUpdatesHTML() {
  return `<div style="display:flex;flex-direction:column;gap:14px">
    ${[
      { v:'v2.0.0', date:'02 Oct 2024', label:'NEW', badge:'badge-rose', items:['🆕 LB PCC ULTIMATE: 2-15 ISP, mode LOCAL/RECURSIVE/HYBRID','🆕 Kalkulator PON Pro: Full Ratio 1:4 s/d 1:128','🆕 Queue & Burst Calculator live preview','🆕 Firewall Hardening Generator lengkap','🆕 Sistem login: Google, GitHub, Facebook, Email, WhatsApp','🆕 Profile page dengan Membership Status & Belanja Checkout','🆕 Queue Tree Generator','🔧 Perbaikan PCC v6 vs v7 routing table syntax','🔧 Redesign UI dengan mode OLED Night'] },
      { v:'v1.5.0', date:'15 Sep 2024', label:'UPDATE', badge:'badge-amber', items:['Penambahan Game QoS (11 game)','VPN Generator: WireGuard, L2TP, PPTP, SSTP','Hotspot User Bulk Generator'] },
      { v:'v1.0.0', date:'01 Sep 2024', label:'LAUNCH', badge:'badge-teal', items:['Rilis perdana ComitTools PRO','LB PCC (2-4 ISP)', 'Hotspot Generator','Firewall basic'] },
    ].map(u => `<div style="background:rgba(0,0,0,0.2);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:16px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <span class="badge ${u.badge}">${u.label}</span>
        <span style="font-size:14px;font-weight:700;color:#fff">${u.v}</span>
        <span style="font-size:11px;color:var(--text-muted);margin-left:auto">${u.date}</span>
      </div>
      <ul style="list-style:none;font-size:12px;color:var(--text-secondary);display:flex;flex-direction:column;gap:5px">
        ${u.items.map(i => `<li>${i}</li>`).join('')}
      </ul>
    </div>`).join('')}
  </div>`;
}

function getDocsHTML() {
  return `<div style="display:flex;flex-direction:column;gap:12px">
    <div class="info-box"><i class="fa-solid fa-book"></i> Dokumentasi lengkap tersedia. Semua script dapat di-paste langsung di <b>Winbox Terminal</b> atau <b>WebFig Terminal</b>.</div>
    ${[
      { icon:'fa-network-wired', title:'LB PCC Ultimate', desc:'Mode LOCAL: Standard PCC dengan check-gateway. RECURSIVE: Routing rekursif lewat IP check — sangat handal untuk multi-ISP. HYBRID: Gabungan keduanya.' },
      { icon:'fa-tachometer-alt', title:'Queue & Burst', desc:'Burst-limit = max × multiplier. Burst-threshold = max × 75%. Limit-At = min guaranteed. Burst-time default 16s/16s.' },
      { icon:'fa-tower-cell', title:'PON Calculator', desc:'Kalkulasi bandwidth per ONT berdasarkan split ratio, usage factor, dan concurrency. Generate queue script otomatis.' },
      { icon:'fa-shield-halved', title:'Firewall', desc:'Script melindungi router dari brute-force Winbox/SSH, SYN flood, UDP flood, port scan, dan bogon IP dari WAN.' },
      { icon:'fa-lock', title:'VPN', desc:'WireGuard (v7 only), L2TP/IPSec (v6+v7), PPTP (legacy), SSTP. Setiap type generate script lengkap.' },
    ].map(d => `<div style="background:rgba(0,0,0,0.2);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:14px;display:flex;gap:12px">
      <div style="width:36px;height:36px;background:rgba(255,92,0,0.12);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--brand-orange);flex-shrink:0"><i class="fa-solid ${d.icon}"></i></div>
      <div><div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:4px">${d.title}</div><div style="font-size:12px;color:var(--text-secondary)">${d.desc}</div></div>
    </div>`).join('')}
  </div>`;
}

function getContactHTML() {
  return `<div style="display:flex;flex-direction:column;gap:12px">
    <div style="text-align:center;padding:20px">
      <div style="font-size:32px;margin-bottom:8px">👋</div>
      <div style="font-size:16px;font-weight:700;color:#fff">Tim ComitTools PRO</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Siap membantu Anda 24/7</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <a href="https://wa.me/6281355142432" target="_blank" style="background:rgba(37,211,102,0.1);border:1px solid rgba(37,211,102,0.3);border-radius:var(--radius-lg);padding:16px;display:flex;align-items:center;gap:10px;color:#25d366;text-decoration:none">
        <i class="fa-brands fa-whatsapp" style="font-size:24px"></i>
        <div><div style="font-size:12px;font-weight:700">WhatsApp (ACIL)</div><div style="font-size:11px">+62 813-5514-2432</div></div>
      </a>
      <a href="mailto:acm2lp21@gmail.com" style="background:rgba(255,92,0,0.1);border:1px solid rgba(255,92,0,0.3);border-radius:var(--radius-lg);padding:16px;display:flex;align-items:center;gap:10px;color:var(--brand-orange);text-decoration:none">
        <i class="fa-solid fa-envelope" style="font-size:24px"></i>
        <div><div style="font-size:12px;font-weight:700">Email</div><div style="font-size:11px">acm2lp21@gmail.com</div></div>
      </a>
      <a href="https://t.me/comittools" target="_blank" style="background:rgba(0,136,204,0.1);border:1px solid rgba(0,136,204,0.3);border-radius:var(--radius-lg);padding:16px;display:flex;align-items:center;gap:10px;color:#0088cc;text-decoration:none">
        <i class="fa-brands fa-telegram" style="font-size:24px"></i>
        <div><div style="font-size:12px;font-weight:700">Telegram</div><div style="font-size:11px">@comittools</div></div>
      </a>
      <a href="https://github.com/ComitIdn" target="_blank" style="background:rgba(255,255,255,0.06);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:16px;display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none">
        <i class="fa-brands fa-github" style="font-size:24px"></i>
        <div><div style="font-size:12px;font-weight:700">GitHub</div><div style="font-size:11px">ComitIdn</div></div>
      </a>
    </div>
  </div>`;
}

function getAllToolsHTML() {
  const cats = (typeof ToolsCatalog !== 'undefined' && ToolsCatalog.categories) ? ToolsCatalog.categories : [];
  if (!cats || cats.length === 0) return '<p style="color:var(--text-muted);padding:20px">Memuat data tools...</p>';
  return `<div style="display:flex;flex-direction:column;gap:14px;max-height:75vh;overflow-y:auto;padding-right:6px">
    ${cats.map(cat => `
      <div>
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-primary);margin-bottom:8px;padding:0 4px;display:flex;align-items:center;gap:8px">
          <i class="fa-solid ${cat.icon}" style="color:var(--brand-orange)"></i> ${cat.name}
          <span class="badge badge-teal" style="font-size:9px">${cat.tools.length}</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px">
          ${cat.tools.map(t => {
            const escapedName = (t.name || '').replace(/'/g, "\\'");
            return `<button onclick="closeModal('navModal');setTimeout(()=>openAnyTool('${t.id}','${escapedName}'),150)" style="background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:8px;padding:9px 12px;text-align:left;cursor:pointer;color:var(--text-primary);font-size:11.5px;display:flex;align-items:center;gap:8px;transition:all 0.2s" onmouseover="this.style.borderColor='rgba(255,92,0,0.5)';this.style.background='rgba(255,92,0,0.06)'" onmouseout="this.style.borderColor='var(--border-color)';this.style.background='rgba(255,255,255,0.03)'">
              <i class="fa-solid ${t.icon || 'fa-bolt'}" style="color:var(--brand-orange);font-size:12px;width:14px;text-align:center"></i>
              <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.name}</span>
              ${t.badge ? `<span class="badge ${t.badge === 'PRO' ? 'badge-amber' : (t.badge === 'ULTIMATE' ? 'badge-orange' : 'badge-free')}" style="font-size:8px;padding:1px 5px">${t.badge}</span>` : ''}
            </button>`;
          }).join('')}
        </div>
      </div>`).join('')}
  </div>`;
}

// ================================================================
// CHECKOUT & PAYMENT MODAL
// ================================================================
function openCheckoutModal(pkg) {
  const modal = document.getElementById('navModal');
  const title = document.getElementById('navModalTitle');
  const body = document.getElementById('navModalBody');
  if (!modal) return;

  const selectedPkg = pkg || 'PRO LIFETIME';
  title.innerHTML = `<i class="fa-solid fa-cart-shopping text-orange"></i> &nbsp;Checkout Pembayaran Membership`;
  body.innerHTML = getCheckoutHTML(selectedPkg);
  modal.classList.add('open');
}

function getCheckoutHTML(pkg) {
  const user = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;
  const mem = (user && typeof Auth !== 'undefined' && Auth.getMembership) ? Auth.getMembership(user.uid) : null;
  const activePkg = pkg || 'PRO MONTHLY';

  let priceVal = 'Rp 49.000 / Bulan (30 Hari)';
  if (activePkg === '7 DAYS') priceVal = 'Rp 15.000 / 1 Minggu (7 Hari)';
  else if (activePkg === 'PRO MONTHLY') priceVal = 'Rp 49.000 / Bulan (30 Hari)';
  else if (activePkg === 'PRO 3 MONTHLY') priceVal = 'Rp 120.000 / 3 Bulan (90 Hari)';
  else if (activePkg === 'PRO LIFETIME') priceVal = 'Rp 250.000 (Sekali Bayar Selamanya)';

  return `
    <div style="max-width:860px;margin:0 auto;display:flex;flex-direction:column;gap:18px">
      
      <!-- Package Selector -->
      <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:16px;display:flex;flex-direction:column;gap:12px">
        <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">
          <i class="fa-solid fa-crown text-orange"></i> Pilih Paket Membership:
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">
          <!-- 1. 7 DAYS -->
          <button type="button" onclick="selectCheckoutPkg('7 DAYS')" id="btnPkg7Days" style="cursor:pointer;text-align:left;padding:12px;border-radius:12px;background:${activePkg==='7 DAYS'?'rgba(63,211,192,0.18)':'rgba(0,0,0,0.25)'};border:2px solid ${activePkg==='7 DAYS'?'var(--brand-teal)':'var(--border-color)'};transition:all 0.2s">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <span style="font-weight:800;font-size:13px;color:#fff">7 DAYS</span>
              <span class="badge badge-teal" style="font-size:9px">1 MINGGU</span>
            </div>
            <div style="font-size:17px;font-weight:900;color:var(--brand-teal)">Rp 15.000</div>
            <div style="font-size:10.5px;color:var(--text-muted);margin-top:3px">Akses seluruh fitur PRO selama 7 hari</div>
          </button>

          <!-- 2. PRO MONTHLY -->
          <button type="button" onclick="selectCheckoutPkg('PRO MONTHLY')" id="btnPkgMonthly" style="cursor:pointer;text-align:left;padding:12px;border-radius:12px;background:${activePkg==='PRO MONTHLY'?'rgba(255,92,0,0.18)':'rgba(0,0,0,0.25)'};border:2px solid ${activePkg==='PRO MONTHLY'?'var(--brand-orange)':'var(--border-color)'};transition:all 0.2s">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <span style="font-weight:800;font-size:13px;color:#fff">PRO MONTHLY</span>
              <span class="badge badge-orange" style="font-size:9px">30 HARI</span>
            </div>
            <div style="font-size:17px;font-weight:900;color:var(--brand-orange)">Rp 49.000 <span style="font-size:10px;color:#4ade80">(-22%)</span></div>
            <div style="font-size:10.5px;color:var(--text-muted);margin-top:3px">Paket paling populer (30 hari akses)</div>
          </button>

          <!-- 3. PRO 3 MONTHLY -->
          <button type="button" onclick="selectCheckoutPkg('PRO 3 MONTHLY')" id="btnPkg3Monthly" style="cursor:pointer;text-align:left;padding:12px;border-radius:12px;background:${activePkg==='PRO 3 MONTHLY'?'rgba(245,158,11,0.18)':'rgba(0,0,0,0.25)'};border:2px solid ${activePkg==='PRO 3 MONTHLY'?'var(--brand-amber)':'var(--border-color)'};transition:all 0.2s">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <span style="font-weight:800;font-size:13px;color:#fff">3 MONTHLY</span>
              <span class="badge badge-amber" style="font-size:9px">90 HARI</span>
            </div>
            <div style="font-size:17px;font-weight:900;color:var(--brand-amber)">Rp 120.000</div>
            <div style="font-size:10.5px;color:var(--text-muted);margin-top:3px">Akses 3 bulan hemat kuartal</div>
          </button>

          <!-- 4. PRO LIFETIME -->
          <button type="button" onclick="selectCheckoutPkg('PRO LIFETIME')" id="btnPkgLifetime" style="cursor:pointer;text-align:left;padding:12px;border-radius:12px;background:${activePkg==='PRO LIFETIME'?'rgba(63,211,192,0.18)':'rgba(0,0,0,0.25)'};border:2px solid ${activePkg==='PRO LIFETIME'?'var(--brand-teal)':'var(--border-color)'};transition:all 0.2s;position:relative">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <span style="font-weight:800;font-size:13px;color:#fff">LIFETIME</span>
              <span class="badge badge-teal" style="font-size:9px">SELAMANYA</span>
            </div>
            <div style="font-size:17px;font-weight:900;color:var(--brand-teal)">Rp 250.000</div>
            <div style="font-size:10.5px;color:var(--text-muted);margin-top:3px">Akses permanen selamanya</div>
          </button>
        </div>
      </div>

      <!-- Merchant Info / Payment Methods -->
      <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:18px">
        <div style="font-size:13px;font-weight:800;color:#fff;margin-bottom:12px;display:flex;align-items:center;gap:8px">
          <i class="fa-solid fa-money-check-dollar text-teal"></i>
          PILIHAN MERCHANT &amp; METODE PEMBAYARAN ELEKTRONIK
        </div>
        <div style="font-size:11.5px;color:var(--text-secondary);margin-bottom:14px">
          Pembayaran dapat dilakukan melalui salah satu merchant/payment elektronik berikut:
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px">
          <!-- QRIS -->
          <div style="background:rgba(0,0,0,0.3);border:1px solid var(--border-color);border-radius:12px;padding:14px;text-align:center">
            <div style="font-size:11px;font-weight:800;color:var(--brand-teal);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">
              <i class="fa-solid fa-qrcode"></i> SCAN QRIS (SEMUA BANK &amp; E-WALLET)
            </div>
            <div style="background:#fff;padding:8px;border-radius:8px;display:inline-block;margin-bottom:8px">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021126610014COM.GO-JEK.WWW01189360091439207873750210G9207873750303UMI51440014ID.CO.QRIS.WWW0215ID10265501027050303UMI5204481453033605802ID5909wifiKonut6012KONAWE%20UTARA61059335362070703A016304914F" alt="QRIS wifi@Konut" style="width:170px;height:auto;display:block">
            </div>
            <div style="font-size:12px;font-weight:800;color:#fff">wifi@Konut</div>
            <div style="font-size:10px;color:var(--text-muted);font-family:monospace">NMID: ID1026541126193 A01</div>
            <div style="font-size:10px;color:var(--brand-teal);margin-top:4px">BCA, Mandiri, BRI, BNI, Dana, OVO, GoPay, LinkAja, ShopeePay, dll.</div>
          </div>

          <!-- Transfer Bank & E-Wallet -->
          <div style="display:flex;flex-direction:column;gap:10px">
            <!-- E-Wallet -->
            <div style="background:rgba(0,0,0,0.3);border:1px solid var(--border-color);border-radius:12px;padding:12px">
              <div style="font-size:11px;font-weight:800;color:var(--brand-orange);margin-bottom:4px;display:flex;align-items:center;gap:6px">
                <i class="fa-solid fa-wallet"></i> 💳 E-WALLET
              </div>
              <div style="font-size:11px;color:var(--text-muted)">✦ OVO, DANA, LINKAJA, GOPAY, ShopeePay dll:</div>
              <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.05);padding:7px 10px;border-radius:8px;margin-top:5px">
                <div style="font-family:monospace;font-size:13px;font-weight:700;color:#fff">081355142432</div>
                <button type="button" onclick="copyPaymentText('081355142432', 'Nomor E-Wallet')" class="btn btn-secondary btn-sm" style="padding:3px 8px;font-size:10px">
                  <i class="fa-solid fa-copy"></i> Salin
                </button>
              </div>
              <div style="font-size:10.5px;color:var(--text-muted);margin-top:4px">✦ A/n: <strong>ACIL / Baharuddin</strong></div>
            </div>

            <!-- Transfer Bank Seabank & Jago -->
            <div style="background:rgba(0,0,0,0.3);border:1px solid var(--border-color);border-radius:12px;padding:12px">
              <div style="font-size:11px;font-weight:800;color:var(--brand-teal);margin-bottom:6px;display:flex;align-items:center;gap:6px">
                <i class="fa-solid fa-building-columns"></i> 🏦 TRANSFER BANK (A/n: ACIL)
              </div>
              
              <!-- Seabank -->
              <div style="margin-bottom:8px">
                <div style="font-size:10.5px;color:var(--text-muted)">✦ Seabank:</div>
                <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.05);padding:6px 10px;border-radius:8px;margin-top:3px">
                  <span style="font-family:monospace;font-size:13px;font-weight:700;color:#fff">901150831284</span>
                  <button type="button" onclick="copyPaymentText('901150831284', 'No Rekening SeaBank')" class="btn btn-secondary btn-sm" style="padding:3px 8px;font-size:10px">
                    <i class="fa-solid fa-copy"></i> Salin
                  </button>
                </div>
              </div>

              <!-- Bank Jago -->
              <div>
                <div style="font-size:10.5px;color:var(--text-muted)">✦ Bank Jago:</div>
                <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.05);padding:6px 10px;border-radius:8px;margin-top:3px">
                  <span style="font-family:monospace;font-size:13px;font-weight:700;color:#fff">105276733304</span>
                  <button type="button" onclick="copyPaymentText('105276733304', 'No Rekening Bank Jago')" class="btn btn-secondary btn-sm" style="padding:3px 8px;font-size:10px">
                    <i class="fa-solid fa-copy"></i> Salin
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style="background:rgba(255,92,0,0.08);border:1px solid rgba(255,92,0,0.25);border-radius:10px;padding:10px 14px;margin-top:14px;font-size:11.5px;color:var(--text-secondary);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div>📌 Penerima: <strong style="color:#fff">A/n ACIL / Bang-AL / Baharuddin</strong></div>
          <div style="color:var(--brand-orange);font-weight:700">Total Tagihan: <span id="checkoutTotalText">${priceVal}</span></div>
        </div>
      </div>

      <!-- Buyer Form & Instant Confirmation -->
      <div style="background:rgba(255,255,255,0.02);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:18px">
        <div style="font-size:13px;font-weight:800;color:#fff;margin-bottom:12px;display:flex;align-items:center;gap:8px">
          <i class="fa-solid fa-user-check text-orange"></i>
          DATA PEMBELI &amp; AKTIVASI AKUN
        </div>

        ${user ? `
          <div style="background:rgba(63,211,192,0.08);border:1px solid rgba(63,211,192,0.25);border-radius:10px;padding:12px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
            <div style="display:flex;align-items:center;gap:10px">
              <i class="fa-solid fa-circle-user text-teal" style="font-size:24px"></i>
              <div>
                <div style="font-size:13px;font-weight:700;color:#fff">${user.name} <span class="badge ${mem && mem.package.includes('PRO') ? 'badge-orange' : 'badge-free'}" style="font-size:10px">${mem ? mem.package : 'FREE'}</span></div>
                <div style="font-size:11px;color:var(--text-muted)">${user.email} ${user.whatsapp ? '· ' + user.whatsapp : ''}</div>
              </div>
            </div>
            <a href="login/profile.html" class="btn btn-secondary btn-sm"><i class="fa-solid fa-id-card"></i> Lihat Profil</a>
          </div>
        ` : `
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:12px">
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label" style="font-size:11px">Email Akun (Untuk Login &amp; Lisensi)</label>
              <input type="email" id="coEmail" class="form-control" placeholder="nama@email.com" required style="font-size:12px;padding:8px 12px">
            </div>
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label" style="font-size:11px">Nama Lengkap</label>
              <input type="text" id="coName" class="form-control" placeholder="Nama Anda" style="font-size:12px;padding:8px 12px">
            </div>
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label" style="font-size:11px">Nomor WhatsApp</label>
              <input type="text" id="coWa" class="form-control" placeholder="0812xxxxxxx" style="font-size:12px;padding:8px 12px">
            </div>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:14px">
            Sudah punya akun? <a href="login/index.html?redirect=../index.html" style="color:var(--brand-orange);font-weight:700;text-decoration:none">Login di sini</a> untuk menghubungkan lisensi.
          </div>
        `}

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label" style="font-size:11px">Nama Pemilik Rekening / Pengirim</label>
            <input type="text" id="coSender" class="form-control" placeholder="Nama pengirim transfer/wallet" value="${user ? user.name : ''}" style="font-size:12px;padding:8px 12px">
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label" style="font-size:11px">Metode Pembayaran Yang Digunakan</label>
            <select id="coMethod" class="form-control" style="font-size:12px;padding:8px 12px">
              <option value="QRIS (wifi@Konut)">QRIS (wifi@Konut)</option>
              <option value="E-Wallet (081355142432)">E-Wallet: Dana/OVO/GoPay/ShopeePay</option>
              <option value="SeaBank (901150831284)">SeaBank (901150831284)</option>
              <option value="Bank Jago (105276733304)">Bank Jago (105276733304)</option>
            </select>
          </div>
        </div>

        <input type="hidden" id="coSelectedPkg" value="${activePkg}">

        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button type="button" onclick="submitCheckoutOrder()" class="btn btn-primary" style="flex:1;min-width:220px;padding:12px 18px;font-size:13px;font-weight:800;justify-content:center">
            <i class="fa-solid fa-bolt"></i> Konfirmasi &amp; Aktifkan Paket
          </button>
          <a id="coWaConfirmLink" href="https://wa.me/6281355142432?text=Halo%20Bang%20AL%20/%20ACIL,%20saya%20sudah%20melakukan%20pembayaran%20ComitTools%20PRO%20paket%20${encodeURIComponent(activePkg)}" target="_blank" class="btn" style="background:#25d366;border-color:#25d366;color:#fff;padding:12px 18px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:8px;text-decoration:none;justify-content:center">
            <i class="fa-brands fa-whatsapp"></i> Konfirmasi via WhatsApp
          </a>
        </div>
      </div>

      <!-- Closing Message -->
      <div style="text-align:center;font-size:12px;color:var(--text-secondary);padding:6px 0;line-height:1.6">
        <div>📌 A/n: <strong>ACIL / Bang-AL / Baharuddin</strong></div>
        <div style="color:var(--brand-teal);font-weight:600;margin-top:2px">
          Terima kasih atas pembayaran Anda! Senang bisa bertransaksi kembali 🙏🏻
        </div>
      </div>

    </div>
  `;
}

function selectCheckoutPkg(pkg) {
  const input = document.getElementById('coSelectedPkg');
  if (input) input.value = pkg;

  const totalText = document.getElementById('checkoutTotalText');
  const waBtn = document.getElementById('coWaConfirmLink');
  const user = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;

  const btn7D = document.getElementById('btnPkg7Days');
  const btnM = document.getElementById('btnPkgMonthly');
  const btn3M = document.getElementById('btnPkg3Monthly');
  const btnL = document.getElementById('btnPkgLifetime');

  const btns = [
    { el: btn7D, id: '7 DAYS', border: 'var(--brand-teal)', bg: 'rgba(63,211,192,0.18)' },
    { el: btnM, id: 'PRO MONTHLY', border: 'var(--brand-orange)', bg: 'rgba(255,92,0,0.18)' },
    { el: btn3M, id: 'PRO 3 MONTHLY', border: 'var(--brand-amber)', bg: 'rgba(245,158,11,0.18)' },
    { el: btnL, id: 'PRO LIFETIME', border: 'var(--brand-teal)', bg: 'rgba(63,211,192,0.18)' }
  ];

  btns.forEach(b => {
    if (b.el) {
      if (b.id === pkg) {
        b.el.style.borderColor = b.border;
        b.el.style.background = b.bg;
      } else {
        b.el.style.borderColor = 'var(--border-color)';
        b.el.style.background = 'rgba(0,0,0,0.25)';
      }
    }
  });

  if (totalText) {
    if (pkg === '7 DAYS') totalText.textContent = 'Rp 15.000 / 1 Minggu (7 Hari)';
    else if (pkg === 'PRO MONTHLY') totalText.textContent = 'Rp 49.000 / Bulan (30 Hari)';
    else if (pkg === 'PRO 3 MONTHLY') totalText.textContent = 'Rp 120.000 / 3 Bulan (90 Hari)';
    else totalText.textContent = 'Rp 250.000 (Sekali Bayar Selamanya)';
  }

  if (waBtn) {
    const emailStr = user ? user.email : (document.getElementById('coEmail')?.value || 'pelanggan');
    waBtn.href = `https://wa.me/6281355142432?text=Halo%20Bang%20AL%20/%20ACIL,%20saya%20sudah%20melakukan%20pembayaran%20ComitTools%20PRO%20paket%20${encodeURIComponent(pkg)}%20untuk%20akun:%20${encodeURIComponent(emailStr)}`;
  }
}

function copyPaymentText(text, label) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`✅ ${label} (${text}) berhasil disalin!`, 'success');
    }).catch(() => {
      fallbackCopy(text, label);
    });
  } else {
    fallbackCopy(text, label);
  }
}

function fallbackCopy(text, label) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  showToast(`✅ ${label} (${text}) berhasil disalin!`, 'success');
}

function submitCheckoutOrder() {
  const pkg = document.getElementById('coSelectedPkg')?.value || 'PRO MONTHLY';
  const method = document.getElementById('coMethod')?.value || 'QRIS (wifi@Konut)';
  const sender = document.getElementById('coSender')?.value?.trim();
  
  let amount = 'Rp 49.000';
  if (pkg === '7 DAYS') amount = 'Rp 15.000';
  else if (pkg === 'PRO MONTHLY') amount = 'Rp 49.000';
  else if (pkg === 'PRO 3 MONTHLY') amount = 'Rp 120.000';
  else if (pkg === 'PRO LIFETIME') amount = 'Rp 250.000';

  if (!sender) {
    showToast('⚠️ Silakan isi Nama Pemilik Rekening / Pengirim.', 'warning');
    document.getElementById('coSender')?.focus();
    return;
  }

  let user = (typeof Auth !== 'undefined') ? Auth.getCurrentUser() : null;

  if (!user) {
    const email = document.getElementById('coEmail')?.value?.trim();
    const name = document.getElementById('coName')?.value?.trim() || sender;
    const wa = document.getElementById('coWa')?.value?.trim() || '';

    if (!email) {
      showToast('⚠️ Silakan masukkan email untuk akun Anda.', 'warning');
      document.getElementById('coEmail')?.focus();
      return;
    }

    if (typeof Auth !== 'undefined' && Auth.quickRegisterOrLogin) {
      const res = Auth.quickRegisterOrLogin(email, name, wa);
      if (res.ok) {
        user = res.user;
      } else {
        showToast('⚠️ ' + (res.error || 'Gagal membuat akun.'), 'error');
        return;
      }
    }
  }

  if (!user) {
    showToast('⚠️ Terjadi kendala autentikasi akun.', 'error');
    return;
  }

  // Submit order & activate membership
  let newOrder = null;
  if (typeof Auth !== 'undefined' && Auth.submitPaymentOrder) {
    newOrder = Auth.submitPaymentOrder({
      uid: user.uid,
      userEmail: user.email,
      userName: user.name || sender,
      package: pkg,
      amount: amount,
      method: method,
      senderName: sender
    });
  }

  // Update navbar auth UI
  initAuthUI();

  // Show order confirmation invoice inside modal
  const invCode = newOrder ? newOrder.orderId : ('INV-' + Date.now().toString(36).toUpperCase());
  const body = document.getElementById('navModalBody');
  const title = document.getElementById('navModalTitle');

  if (title) {
    title.innerHTML = `<i class="fa-solid fa-circle-check text-teal"></i> &nbsp;Pembayaran Berhasil Dikonfirmasi`;
  }

  if (body) {
    body.innerHTML = `
      <div style="max-width:600px;margin:0 auto;text-align:center;padding:10px 0">
        <div style="width:68px;height:68px;background:rgba(63,211,192,0.15);border:2px solid var(--brand-teal);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:32px;color:var(--brand-teal);margin-bottom:16px">
          <i class="fa-solid fa-check"></i>
        </div>

        <h3 style="font-size:22px;font-weight:800;color:#fff;margin-bottom:6px">Transaksi Berhasil &amp; Paket Aktif!</h3>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:20px">
          Selamat! Akun <strong>${user.email}</strong> telah aktif dengan lisensi <strong>${pkg}</strong>.
        </p>

        <!-- Invoice Receipt Card -->
        <div style="background:rgba(0,0,0,0.3);border:1px solid var(--border-color);border-radius:14px;padding:20px;text-align:left;margin-bottom:20px">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border-color);padding-bottom:12px;margin-bottom:12px">
            <div>
              <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase">No. Invoice</div>
              <div style="font-size:15px;font-weight:800;font-family:monospace;color:var(--brand-orange)">${invCode}</div>
            </div>
            <span class="badge badge-teal" style="font-size:11px;padding:4px 10px">AKTIF &amp; TERVERIFIKASI</span>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12px">
            <div>
              <div style="color:var(--text-muted)">Paket Lisensi:</div>
              <strong style="color:#fff">${pkg}</strong>
            </div>
            <div>
              <div style="color:var(--text-muted)">Total Pembayaran:</div>
              <strong style="color:var(--brand-orange)">${amount}</strong>
            </div>
            <div>
              <div style="color:var(--text-muted)">Metode:</div>
              <strong style="color:#fff">${method}</strong>
            </div>
            <div>
              <div style="color:var(--text-muted)">Nama Pengirim:</div>
              <strong style="color:#fff">${sender}</strong>
            </div>
          </div>
        </div>

        <!-- Closing Note from user -->
        <div style="background:rgba(63,211,192,0.06);border:1px solid rgba(63,211,192,0.25);border-radius:12px;padding:14px;margin-bottom:20px;font-size:12.5px;color:var(--text-secondary);line-height:1.7">
          📌 Penerima: <strong style="color:#fff">ACIL / Bang-AL / Baharuddin</strong><br>
          <span style="color:var(--brand-teal);font-weight:700">Terima kasih atas pembayaran Anda! Senang bisa bertransaksi kembali 🙏🏻</span>
        </div>

        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <button onclick="closeModal('navModal')" class="btn btn-primary" style="padding:10px 20px">
            <i class="fa-solid fa-bolt"></i> Mulai Gunakan Tools PRO
          </button>
          <a href="login/profile.html" class="btn btn-secondary" style="padding:10px 20px;text-decoration:none">
            <i class="fa-solid fa-crown"></i> Lihat Profil &amp; Membership
          </a>
          <a href="https://wa.me/6281355142432?text=Halo%20Bang%20AL%20/%20ACIL,%20saya%20sudah%20melakukan%20pembayaran%20ComitTools%20PRO%20(${invCode})%20untuk%20email:%20${encodeURIComponent(user.email)}" target="_blank" class="btn" style="background:#25d366;border-color:#25d366;color:#fff;padding:10px 20px;text-decoration:none">
            <i class="fa-brands fa-whatsapp"></i> Chat WhatsApp
          </a>
        </div>
      </div>
    `;
  }

  showToast('🎉 Pembayaran dikonfirmasi! Lisensi ' + pkg + ' aktif.', 'success', 4000);
}

// ================================================================
// TOAST NOTIFICATION
// ================================================================
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info', warning: 'fa-triangle-exclamation' };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info} toast-icon"></i><span style="flex:1">${message}</span><i class="fa-solid fa-xmark" style="cursor:pointer;color:var(--text-muted)" onclick="this.closest('.toast').remove()"></i>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ================================================================
// UTILS
// ================================================================
function escHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function getFallbackData() {
  return {
    categories: [
      { id:'lb', name:'Load Balancing', icon:'fa-network-wired', color:'orange', tools:[
        { id:'lb-pcc-ultimate', name:'LB PCC ULTIMATE', desc:'Generator PCC 2-15 ISP (Bandwidth Ratio & Bypass)', icon:'fa-network-wired', badge:'PRO ULTIMATE', badgeClass:'badge-orange', version:'both', tier:'pro', new:true },
        { id:'address-list-generator', name:'Address-List Ultimate', desc:'Daftar IP BOGON, Sosmed, Banking, & RAW', icon:'fa-list-check', badge:'PRO', badgeClass:'badge-orange', version:'both', tier:'pro', new:true }
      ]},
      { id:'queue', name:'Queue & Bandwidth', icon:'fa-chart-bar', color:'teal', tools:[
        { id:'queue-burst', name:'Queue & Burst', desc:'Rate Limit Calculator', icon:'fa-tachometer-alt', badge:'FREE', badgeClass:'badge-free', version:'both', tier:'free', new:true },
        { id:'pon-calc', name:'Kalkulator PON', desc:'Full Ratio 1:4-1:128', icon:'fa-tower-cell', badge:'NEW', badgeClass:'badge-amber', version:'both', tier:'pro', new:true }
      ]},
      { id:'firewall', name:'Firewall', icon:'fa-shield-halved', color:'rose', tools:[
        { id:'firewall', name:'Firewall Hardening', desc:'Script firewall lengkap', icon:'fa-shield-halved', badge:'FREE', badgeClass:'badge-free', version:'both', tier:'free' }
      ]}
    ]
  };
}

