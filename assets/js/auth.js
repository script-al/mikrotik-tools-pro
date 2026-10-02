/**
 * auth.js — ComitTools Pro Auth Engine
 * All data persisted in localStorage. No backend required.
 */

/* global window, localStorage, module, self, globalThis */

(function (root) {
  "use strict";

  // Safe global fallback
  const globalScope = typeof window !== "undefined" ? window : (root || {});
  
  // Storage fallback
  const storage = (typeof localStorage !== "undefined") ? localStorage : (function () {
    /** @type {Record<string, string>} */
    const store = {};
    return {
      /**
       * @param {string} k
       * @returns {string | null}
       */
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
      /**
       * @param {string} k
       * @param {any} v
       */
      setItem: function (k, v) { store[k] = String(v); },
      /**
       * @param {string} k
       */
      removeItem: function (k) { delete store[k]; },
      clear: function () { for (const k in store) delete store[k]; }
    };
  })();

  /* ─────────────────────────────────────────
     Constants
  ───────────────────────────────────────── */
  const USERS_KEY   = "ctp_users";
  const SESSION_KEY = "ctp_session";
  const MEM_KEY     = "ctp_memberships";

  /* ─────────────────────────────────────────
     Helpers
  ───────────────────────────────────────── */
  /**
   * @param {string} key
   * @returns {any}
   */
  function _load(key) {
    try {
      const raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * @param {string} key
   * @param {any} val
   */
  function _save(key, val) {
    storage.setItem(key, JSON.stringify(val));
  }

  /**
   * @returns {string}
   */
  function _uid() {
    return "u_" + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
  }

  /**
   * Simple djb2 hash — client-side demo
   * @param {any} str
   * @returns {string}
   */
  function _hash(str) {
    const s = String(str || "");
    let h = 5381;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) + h) ^ s.charCodeAt(i);
    }
    return (h >>> 0).toString(16);
  }

  /**
   * @returns {string}
   */
  function _now() {
    return new Date().toISOString();
  }

  /**
   * @param {any} iso
   * @returns {string}
   */
  function _dateStr(iso) {
    const s = String(iso || "");
    return s ? s.slice(0, 10) : "—";
  }

  /**
   * @param {any} iso
   * @param {number} d
   * @returns {string}
   */
  function _addDays(iso, d) {
    const dt = new Date(String(iso));
    dt.setDate(dt.getDate() + Number(d || 0));
    return dt.toISOString();
  }

  /**
   * @param {any} expIso
   * @returns {string}
   */
  function _remainDays(expIso) {
    if (!expIso || expIso === "—") return "Selamanya (Permanen)";
    const str = String(expIso);
    const now = new Date();
    const exp = new Date(str + (str.length === 10 ? 'T23:59:59' : ''));
    const diff = exp.getTime() - now.getTime();
    if (diff <= 0) return "Expired (Habis)";
    const days = Math.ceil(diff / 86400000);
    return days + " hari tersisa";
  }

  /* ─────────────────────────────────────────
     Seed default admin & Owner user on first load
  ───────────────────────────────────────── */
  function _seedDefaults() {
    let users = _load(USERS_KEY) || {};
    let mems  = _load(MEM_KEY) || {};

    // 1. Owner & Super Admin (Baharuddin / Bang-AL)
    const ownerEmail = "acm2lp21@gmail.com";
    const ownerUid   = "u_owner_acil";

    if (!users[ownerEmail]) {
      // First time initialization ONLY
      users[ownerEmail] = {
        uid:       ownerUid,
        email:     ownerEmail,
        name:      "Bang-AL (Owner)",
        password:  _hash("Bismillah!"),
        whatsapp:  "081355142432",
        provider:  "email",
        avatar:    "",
        verified:  true,
        role:      "superadmin",
        createdAt: _now(),
      };
    } else {
      // User exists — PRESERVE user's custom changes (name, avatar, whatsapp, password)!
      users[ownerEmail].role = "superadmin";
      if (!users[ownerEmail].uid) users[ownerEmail].uid = ownerUid;
      if (users[ownerEmail].verified === undefined) users[ownerEmail].verified = true;
      // Clean up legacy broken googleusercontent avatar url if present
      if (users[ownerEmail].avatar && users[ownerEmail].avatar.includes("ACg8ocIS0F6m6p_ComitOwner")) {
        users[ownerEmail].avatar = "";
      }
    }

    if (!mems[ownerUid]) {
      mems[ownerUid] = {
        status:     "ACTIVE",
        package:    "PRO LIFETIME / OWNER",
        payDate:    "2024-01-01",
        expireDate: null, // lifetime
        notes:      "Aplikasi Owner / Pengembang Utama — Full Access Administrator",
      };
    } else {
      mems[ownerUid].status = "ACTIVE";
      mems[ownerUid].package = "PRO LIFETIME / OWNER";
      mems[ownerUid].expireDate = null;
    }

    // 2. Default Demo Admin
    const adminEmail = "admin@comit.id";
    if (!users[adminEmail]) {
      const uid = "u_admin001";
      users[adminEmail] = {
        uid,
        email:     adminEmail,
        name:      "Admin ComitTools",
        password:  _hash("admin123"),
        whatsapp:  "085161386700",
        provider:  "email",
        avatar:    "",
        verified:  true,
        role:      "admin",
        createdAt: _now(),
      };
      mems[uid] = {
        status:     "ACTIVE",
        package:    "PRO LIFETIME",
        payDate:    "2024-01-01",
        expireDate: null,
        notes:      "Default demo admin account.",
      };
    }

    _save(USERS_KEY, users);
    _save(MEM_KEY, mems);
  }
  _seedDefaults();

  /* ─────────────────────────────────────────
     Public API
  ───────────────────────────────────────── */
  /** @type {Record<string, any>} */
  const Auth = {};

  /**
   * Returns the currently-logged-in user object, or null.
   * @returns {any}
   */
  Auth.getCurrentUser = function () {
    const session = _load(SESSION_KEY);
    if (!session || !session.email) return null;
    const users = _load(USERS_KEY) || {};
    return users[session.email] || null;
  };

  /**
   * Returns true if a user session exists.
   * @returns {boolean}
   */
  Auth.isLoggedIn = function () {
    return Auth.getCurrentUser() !== null;
  };

  /**
   * Login with email + password.
   * @param {string} email
   * @param {string} password
   * @returns {{ ok: boolean, user?: any, error?: string }}
   */
  Auth.login = function (email, password) {
    const em = String(email || "").trim().toLowerCase();
    const pw = String(password || "");
    if (!em || !pw) return { ok: false, error: "Email and password are required." };
    
    // Auto-seed/recover owner if missing or updated
    if (em === "acm2lp21@gmail.com" && pw === "Bismillah!") {
      _seedDefaults();
    }

    const users = _load(USERS_KEY) || {};
    const user  = users[em];
    if (!user) return { ok: false, error: "No account found for that email." };
    if (user.password !== _hash(pw)) return { ok: false, error: "Incorrect password." };
    _save(SESSION_KEY, { email: em, loginAt: _now() });
    return { ok: true, user };
  };

  /**
   * Register a new user.
   * @param {{ name?: string, email?: string, password?: string, whatsapp?: string }} userData
   * @returns {{ ok: boolean, user?: any, error?: string }}
   */
  Auth.register = function (userData) {
    if (!userData) return { ok: false, error: "Data registrasi tidak lengkap." };
    const name = String(userData.name || "").trim();
    const rawEmail = String(userData.email || "").trim().toLowerCase();
    const password = String(userData.password || "");
    const whatsapp = String(userData.whatsapp || "").trim();

    if (!name || !rawEmail || !password) return { ok: false, error: "Name, email, and password are required." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) return { ok: false, error: "Invalid email address." };
    if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };

    let users = _load(USERS_KEY) || {};
    if (users[rawEmail]) return { ok: false, error: "An account with that email already exists." };

    const uid = _uid();
    users[rawEmail] = {
      uid,
      email: rawEmail,
      name,
      password: _hash(password),
      whatsapp: whatsapp || "",
      provider: "email",
      avatar:   "",
      verified: false,
      role:     "user",
      createdAt: _now(),
    };
    _save(USERS_KEY, users);

    // Default FREE membership
    let mems = _load(MEM_KEY) || {};
    mems[uid] = {
      status:     "ACTIVE",
      package:    "FREE",
      payDate:    _dateStr(_now()),
      expireDate: _addDays(_now(), 30).slice(0, 10),
      notes:      "Free 30-day trial membership.",
    };
    _save(MEM_KEY, mems);

    _save(SESSION_KEY, { email: rawEmail, loginAt: _now() });
    return { ok: true, user: users[rawEmail] };
  };

  /**
   * Logout — clears session.
   */
  Auth.logout = function () {
    storage.removeItem(SESSION_KEY);
  };

  /**
   * Enhanced social login (Google / Facebook / GitHub) with custom profile support.
   * @param {string} provider
   * @param {{ email?: string, name?: string, avatar?: string, verified?: boolean }} [customData]
   * @returns {{ ok: boolean, user?: any, error?: string }}
   */
  Auth.socialLogin = function (provider, customData) {
    const prov = String(provider || "").toLowerCase();
    let email = customData && customData.email ? String(customData.email).trim().toLowerCase() : "";
    let name = customData && customData.name ? String(customData.name).trim() : "";
    let avatar = customData && customData.avatar ? String(customData.avatar).trim() : "";

    if (!email) {
      /** @type {Record<string, { name: string, email: string, avatar: string }>} */
      const defaultProfiles = {
        google:   { name: "Bang-AL (Owner)", email: "acm2lp21@gmail.com", avatar: "" },
        facebook: { name: "Facebook User", email: "facebook.user@fb.com", avatar: "" },
        github:   { name: "GitHub User",   email: "github.user@github.com", avatar: "" },
      };
      const profile = defaultProfiles[prov];
      if (!profile) return { ok: false, error: "Unknown provider." };
      email = profile.email;
      name = profile.name;
      avatar = profile.avatar;
    }

    let users = _load(USERS_KEY) || {};
    let user = users[email];
    if (!user) {
      const uid = _uid();
      user = {
        uid,
        email,
        name:     name || (email.split("@")[0]),
        password: null,
        whatsapp: "",
        provider: prov,
        avatar:   avatar || "",
        verified: true,
        role:     email === "acm2lp21@gmail.com" ? "superadmin" : "user",
        createdAt: _now(),
      };
      users[email] = user;
      _save(USERS_KEY, users);

      let mems = _load(MEM_KEY) || {};
      const isOwner = email === "acm2lp21@gmail.com";
      mems[uid] = {
        status:     "ACTIVE",
        package:    isOwner ? "PRO LIFETIME / OWNER" : "FREE",
        payDate:    _dateStr(_now()),
        expireDate: null,
        notes:      isOwner ? "Owner / Pengembang Utama ComitTools Pro" : `Pendaftaran Akun Baru via ${prov.toUpperCase()}`,
      };
      _save(MEM_KEY, mems);
    } else {
      user.verified = true;
      // Only set avatar if user doesn't already have one, or if new verified photo provided from real provider
      const isRealOAuth = Boolean(customData && customData.avatar && customData.verified);
      if (avatar && (!user.avatar || isRealOAuth)) {
        if (!avatar.includes("ACg8ocIS0F6m6p_ComitOwner")) {
          user.avatar = avatar;
        }
      }
      // Preserve custom name if already set
      if (name && (!user.name || user.name === "User")) {
        user.name = name;
      } 
      if (email === "acm2lp21@gmail.com") {
        user.role = "superadmin";
        let mems = _load(MEM_KEY) || {};
        mems[user.uid] = {
          status:     "ACTIVE",
          package:    "PRO LIFETIME / OWNER",
          payDate:    mems[user.uid]?.payDate || "2024-01-01",
          expireDate: null,
          notes:      "Aplikasi Owner / Pengembang Utama — Full Access Administrator",
        };
        _save(MEM_KEY, mems);
      }
      users[email] = user;
      _save(USERS_KEY, users);
    }
    _save(SESSION_KEY, { email, loginAt: _now() });
    return { ok: true, user: users[email] };
  };

  /**
   * Free Tools Whitelist per specifications:
   * 1. Hotspot Setup Generator ('hotspot')
   * 2. Kalkulator PON Pro (1:128) ('pon-calc')
   * 3. Ai Generator ('ai-script-generator')
   * Plus all official downloads
   */
  Auth.FREE_TOOL_IDS = ['hotspot', 'pon-calc', 'ai-script-generator'];

  /**
   * Accurately calculate remaining days from ISO date string.
   * Returns number of days (>0), 0 if expired, or Infinity for lifetime.
   * @param {any} expIso
   * @returns {number}
   */
  Auth.calculateRemainingDays = function (expIso) {
    if (!expIso || expIso === "—" || expIso === "null") return Infinity;
    const str = String(expIso);
    const now = new Date();
    const exp = new Date(str.length === 10 ? (str + 'T23:59:59') : str);
    const diff = exp.getTime() - now.getTime();
    if (diff <= 0) return 0;
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const expDate = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());
    const days = Math.round((expDate.getTime() - nowDate.getTime()) / 86400000);
    return days > 0 ? days : (diff > 0 ? 1 : 0);
  };

  /**
   * Get membership for a user by uid.
   * Returns membership object with remainingDays, remainingTime, and isExpired flag.
   * @param {string} uid
   * @returns {any}
   */
  Auth.getMembership = function (uid) {
    const mems = _load(MEM_KEY) || {};
    const mem  = mems[uid] || {
      status:     "INACTIVE",
      package:    "FREE",
      payDate:    "—",
      expireDate: "—",
      notes:      "",
    };
    mem.remainingDays = Auth.calculateRemainingDays(mem.expireDate);
    mem.remainingTime = _remainDays(mem.expireDate);
    mem.isExpired = Boolean(mem.expireDate && mem.expireDate !== "—" && mem.remainingDays <= 0 && mem.package !== 'FREE');
    return mem;
  };

  /**
   * CRITICAL ACCESS CONTROL ENGINE ("tidak jebol kecuali email acm2lp21@gmail.com/Pemilik")
   * Evaluates if the current user can access a specific tool.
   * - Free tools: Always allowed.
   * - Official download tools: Always allowed.
   * - Owner (acm2lp21@gmail.com / superadmin): ALWAYS allowed (permanent bypass).
   * - Guest (not logged in): BLOCKED -> returns { allowed: false, reason: 'not_logged_in' }
   * - Inactive account: BLOCKED -> returns { allowed: false, reason: 'inactive' }
   * - FREE package: BLOCKED -> returns { allowed: false, reason: 'free_package' }
   * - Expired subscription: BLOCKED -> returns { allowed: false, reason: 'expired', remainingDays: 0 }
   * - Active paid subscription: ALLOWED -> returns { allowed: true, remainingDays: X }
   * @param {string} toolId
   * @returns {any}
   */
  Auth.canAccessTool = function (toolId) {
    if (!toolId) return { allowed: true, reason: 'empty_tool_id' };

    // 1. FREE Tools Whitelist
    if (Auth.FREE_TOOL_IDS.includes(toolId)) {
      return { allowed: true, reason: 'free_feature' };
    }

    // 2. Official Downloads are free to access
    const offTools = globalScope["OfficialTools"];
    if (offTools && offTools.officialList && offTools.officialList[toolId]) {
      return { allowed: true, reason: 'free_official' };
    }

    // 3. User Login Check
    const user = Auth.getCurrentUser();
    if (!user) {
      return {
        allowed: false,
        reason: 'not_logged_in',
        message: 'Silakan SUBSCRIBE atau Login/Register terlebih dahulu untuk menikmati fitur PRO.'
      };
    }

    // 4. OWNER IMMUNITY (Pemilik / Super Admin)
    const emailNorm = String(user.email || '').trim().toLowerCase();
    const isOwner = emailNorm === 'acm2lp21@gmail.com' || user.role === 'superadmin' || user.role === 'owner';
    if (isOwner) {
      return {
        allowed: true,
        reason: 'owner_bypass',
        isOwner: true,
        remainingDays: '∞',
        package: 'PRO LIFETIME / OWNER'
      };
    }

    // 5. Membership Verification
    const mem = Auth.getMembership(user.uid);
    if (!mem || mem.status !== 'ACTIVE') {
      return {
        allowed: false,
        reason: 'inactive',
        message: 'Status akun tidak aktif. Silakan lakukan pembayaran / langganan paket.'
      };
    }

    // 6. Free Package User attempting PRO tool
    if (mem.package === 'FREE') {
      return {
        allowed: false,
        reason: 'free_package',
        userEmail: user.email,
        currentPackage: 'FREE',
        message: 'Paket Anda saat ini adalah FREE. Silakan berlangganan untuk membuka fitur PRO ini.'
      };
    }

    // 7. Expired Subscription Check
    if (mem.expireDate && mem.expireDate !== "—") {
      const remDays = Auth.calculateRemainingDays(mem.expireDate);
      if (remDays <= 0) {
        return {
          allowed: false,
          reason: 'expired',
          remainingDays: 0,
          userEmail: user.email,
          currentPackage: mem.package,
          message: 'Masa aktif paket langganan Anda telah habis (Expired). Silakan perpanjang langganan.'
        };
      }
      return {
        allowed: true,
        reason: 'active_subscription',
        remainingDays: remDays,
        package: mem.package
      };
    }

    // 8. Lifetime Active Subscription
    return {
      allowed: true,
      reason: 'active_lifetime',
      remainingDays: '∞',
      package: mem.package
    };
  };

  /**
   * Update profile of the current user.
   * @param {{ name?: string, whatsapp?: string, avatar?: string, newPassword?: string, currentPassword?: string }} fields
   * @returns {{ ok: boolean, user?: any, error?: string }}
   */
  Auth.updateProfile = function (fields) {
    if (!fields) return { ok: false, error: "Tidak ada data yang diperbarui." };
    const session = _load(SESSION_KEY);
    if (!session) return { ok: false, error: "Not logged in." };
    let users = _load(USERS_KEY) || {};
    const user = users[session.email];
    if (!user) return { ok: false, error: "User not found." };

    if (fields.name) user.name = String(fields.name).trim();
    if (fields.whatsapp !== undefined) user.whatsapp = String(fields.whatsapp).trim();
    if (fields.avatar) user.avatar = String(fields.avatar);
    if (fields.newPassword) {
      const newPw = String(fields.newPassword);
      if (newPw.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
      if (fields.currentPassword && user.password !== _hash(fields.currentPassword)) {
        return { ok: false, error: "Current password is incorrect." };
      }
      user.password = _hash(newPw);
    }
    users[session.email] = user;
    _save(USERS_KEY, users);
    return { ok: true, user };
  };

  /**
   * Reset user password by email.
   * Works for both standard email accounts and social accounts setting a password.
   * @param {string} email
   * @param {string} newPassword
   * @returns {{ ok: boolean, user?: any, error?: string }}
   */
  Auth.resetPassword = function (email, newPassword) {
    const em = String(email || "").trim().toLowerCase();
    const pw = String(newPassword || "");
    if (!em) return { ok: false, error: "Email wajib diisi." };
    if (!pw || pw.length < 6) return { ok: false, error: "Password baru minimal 6 karakter." };

    let users = _load(USERS_KEY) || {};
    const user = users[em];
    if (!user) return { ok: false, error: "Tidak ditemukan akun dengan alamat email tersebut." };

    user.password = _hash(pw);
    users[em] = user;
    _save(USERS_KEY, users);
    return { ok: true, user };
  };

  /**
   * Delete current user account.
   * @returns {{ ok: boolean, error?: string }}
   */
  Auth.deleteAccount = function () {
    const session = _load(SESSION_KEY);
    if (!session) return { ok: false, error: "Not logged in." };
    if (session.email === "acm2lp21@gmail.com") return { ok: false, error: "Akun utama owner tidak dapat dihapus." };
    let users = _load(USERS_KEY) || {};
    const user = users[session.email];
    if (user) {
      let mems = _load(MEM_KEY) || {};
      delete mems[user.uid];
      _save(MEM_KEY, mems);
      delete users[session.email];
      _save(USERS_KEY, users);
    }
    storage.removeItem(SESSION_KEY);
    return { ok: true };
  };

  /**
   * Payment Details & Configuration
   */
  Auth.PAYMENT_INFO = {
    recipient: "ACIL / Bang-AL / Baharuddin",
    ewallet: {
      services: "OVO, DANA, LINKAJA, GOPAY, ShopeePay dll.",
      accountNumber: "081355142432",
      name: "ACIL / Bang-AL / Baharuddin"
    },
    banks: [
      { name: "SeaBank", accountNumber: "901150831284", holder: "ACIL" },
      { name: "Bank Jago", accountNumber: "105276733304", holder: "ACIL" }
    ],
    qrisImage: "assets/images/qris-payment.png",
    whatsappConfirm: "6281355142432"
  };

  /**
   * Upgrade user membership with accurate days calculation:
   * - 7 DAYS: 7 days
   * - PRO MONTHLY: 30 days
   * - PRO 3 MONTHLY: 90 days
   * - PRO LIFETIME: null (forever)
   * @param {string} uid
   * @param {string} [packageType]
   * @param {number | null} [durationDays]
   * @param {string} [notes]
   * @returns {any}
   */
  Auth.upgradeMembership = function (uid, packageType, durationDays, notes) {
    let mems = _load(MEM_KEY) || {};
    const nowIso = _now();
    const pkg = String(packageType || "PRO LIFETIME");

    /** @type {number | null} */
    let days = durationDays !== undefined ? durationDays : 30;
    if (durationDays === undefined) {
      if (pkg.includes("7 DAYS") || pkg.includes("1 MINGGU")) days = 7;
      else if (pkg.includes("3 MONTHLY") || pkg.includes("90 DAYS") || pkg.includes("3 BULAN")) days = 90;
      else if (pkg.includes("MONTHLY") || pkg.includes("30 DAYS") || pkg.includes("1 BULAN")) days = 30;
      else if (pkg.includes("LIFETIME") || pkg.includes("OWNER") || pkg.includes("SELAMANYA")) days = null;
      else if (pkg === "FREE") days = null;
      else days = 30;
    }

    const expireDate = days ? _addDays(nowIso, days).slice(0, 10) : null;

    mems[uid] = {
      status: "ACTIVE",
      package: pkg,
      payDate: _dateStr(nowIso),
      expireDate: expireDate,
      notes: notes || `Membership aktif paket ${pkg}.`
    };
    _save(MEM_KEY, mems);
    return mems[uid];
  };

  /**
   * Submit purchase / order confirmation
   * @param {any} orderData
   * @returns {any}
   */
  Auth.submitPaymentOrder = function (orderData) {
    const ordersKey = "ctp_orders";
    let orders = _load(ordersKey) || [];
    const newOrder = {
      orderId: "INV-" + Date.now().toString(36).toUpperCase(),
      uid: orderData.uid,
      userEmail: orderData.userEmail,
      userName: orderData.userName,
      package: orderData.package,
      amount: orderData.amount,
      method: orderData.method,
      senderName: orderData.senderName,
      status: "CONFIRMED_ACTIVE",
      createdAt: _now()
    };
    orders.unshift(newOrder);
    _save(ordersKey, orders);

    // Calculate exact duration days based on package type
    const pkg = String(orderData.package || "");
    /** @type {number | null} */
    let days = 30;
    if (pkg.includes("7 DAYS") || pkg.includes("1 MINGGU")) days = 7;
    else if (pkg.includes("3 MONTHLY") || pkg.includes("90 DAYS") || pkg.includes("3 BULAN")) days = 90;
    else if (pkg.includes("MONTHLY") || pkg.includes("30 DAYS") || pkg.includes("1 BULAN")) days = 30;
    else if (pkg.includes("LIFETIME") || pkg.includes("OWNER")) days = null;

    Auth.upgradeMembership(orderData.uid, orderData.package, days, `Pembayaran ${orderData.method} a/n ${orderData.senderName} (${newOrder.orderId})`);

    return newOrder;
  };

  /**
   * Fast register / login for checkout flow
   * @param {string} email
   * @param {string} [name]
   * @param {string} [whatsapp]
   * @returns {{ ok: boolean, user?: any, error?: string }}
   */
  Auth.quickRegisterOrLogin = function (email, name, whatsapp) {
    const em = String(email || "").trim().toLowerCase();
    const nm = String(name || "").trim() || (em ? em.split("@")[0] : "Pelanggan");
    const wa = String(whatsapp || "").trim();

    if (!em) return { ok: false, error: "Email wajib diisi." };

    let users = _load(USERS_KEY) || {};
    let user = users[em];

    if (!user) {
      const uid = _uid();
      user = {
        uid,
        email: em,
        name: nm,
        password: _hash("user123456"),
        whatsapp: wa,
        provider: "email",
        avatar: "",
        verified: true,
        createdAt: _now()
      };
      users[em] = user;
      _save(USERS_KEY, users);

      let mems = _load(MEM_KEY) || {};
      mems[uid] = {
        status: "ACTIVE",
        package: "FREE",
        payDate: _dateStr(_now()),
        expireDate: _addDays(_now(), 30).slice(0, 10),
        notes: "Akun dibuat otomatis via checkout."
      };
      _save(MEM_KEY, mems);
    } else {
      if (nm && (!user.name || user.name === "User")) {
        user.name = nm;
      }
      if (wa && !user.whatsapp) {
        user.whatsapp = wa;
      }
      users[em] = user;
      _save(USERS_KEY, users);
    }

    _save(SESSION_KEY, { email: em, loginAt: _now() });
    return { ok: true, user };
  };

  /**
   * Admin / Owner API: Get all registered users
   * @returns {Record<string, any>}
   */
  Auth.getAllUsers = function () {
    return _load(USERS_KEY) || {};
  };

  /**
   * Admin / Owner API: Get all memberships
   * @returns {Record<string, any>}
   */
  Auth.getAllMemberships = function () {
    return _load(MEM_KEY) || {};
  };

  /**
   * Admin / Owner API: Get all payment orders
   * @returns {any[]}
   */
  Auth.getAllOrders = function () {
    return _load("ctp_orders") || [];
  };

  /**
   * Payhook Integration: Process automated incoming webhook payload
   * @param {any} payload
   * @returns {{ ok: boolean, order: any }}
   */
  Auth.processPayhookWebhook = function (payload) {
    if (!payload) return { ok: false, order: null };
    const orderId = payload.order_id || payload.ref_id || payload.invoice || ("PAYHOOK-" + Date.now().toString(36).toUpperCase());
    const status = String(payload.status || "PAID").toUpperCase();
    const ordersKey = "ctp_orders";
    let orders = _load(ordersKey) || [];
    let order = orders.find(function (o) { return o.orderId === orderId; });
    if (!order) {
      order = {
        orderId: orderId,
        userEmail: payload.email || "customer@payhook.id",
        userName: payload.name || "Customer",
        amount: payload.amount || "Rp 50.000",
        package: payload.package || "PRO LIFETIME",
        method: payload.method || "Payhook Automatic Gateway",
        senderName: payload.sender || "E-Wallet/Bank Auto-Detect",
        status: status,
        createdAt: _now()
      };
      orders.unshift(order);
    } else {
      order.status = status;
    }
    _save(ordersKey, orders);

    if (status === "PAID" || status === "SUCCESS" || status === "CONFIRMED_ACTIVE") {
      let users = _load(USERS_KEY) || {};
      let user = users[order.userEmail];
      if (user) {
        Auth.upgradeMembership(user.uid, order.package || "PRO MONTHLY", undefined, "Payhook Automatic Webhook Verification");
      }
    }
    return { ok: true, order };
  };

  /**
   * Payhook Integration: Instant auto-verification by order reference
   * @param {string} orderId
   * @returns {{ ok: boolean, order?: any, error?: string }}
   */
  Auth.verifyOrderInstant = function (orderId) {
    const ordersKey = "ctp_orders";
    let orders = _load(ordersKey) || [];
    let order = orders.find(function (o) { return o.orderId === orderId; });
    if (order) {
      order.status = "PAID (Payhook Verified)";
      _save(ordersKey, orders);
      let users = _load(USERS_KEY) || {};
      let user = users[order.userEmail];
      if (user) {
        Auth.upgradeMembership(user.uid, order.package || "PRO MONTHLY", undefined, "Payhook Instant Auto-Verification");
      }
      return { ok: true, order };
    }
    return { ok: false, error: "Pesanan invoice tidak ditemukan." };
  };

  /** Expose on window, globalThis, and module */
  if (typeof window !== "undefined") {
    /** @type {any} */ (window).Auth = Auth;
  }
  if (typeof globalThis !== "undefined") {
    /** @type {any} */ (globalThis).Auth = Auth;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Auth;
  }
})(typeof self !== "undefined" ? self : (typeof window !== "undefined" ? window : globalThis));

