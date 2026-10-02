/**
 * ================================================================
 * FIREBASE AUTH HANDLER — ComitTools Pro
 * Firebase SDK v12.19.0 (CDN ESM via gstatic)
 * ================================================================
 */

/* global window, Auth */

(function () {
  'use strict';

  const FB_CDN = 'https://www.gstatic.com/firebasejs/12.19.0';

  /* ── Avatar fallback ──────────────────────────────────────────── */
  function avatarFallback(name) {
    return 'https://ui-avatars.com/api/?name=' +
      encodeURIComponent(name || 'User') +
      '&background=ff5c00&color=fff&size=200&bold=true';
  }

  /* ── Simpan Firebase user ke localStorage Auth ────────────────── */
  function handleFirebaseUser(firebaseUser, provider) {
    if (typeof Auth === 'undefined' || !Auth.socialLogin) {
      console.error('[FirebaseAuth] Auth not loaded!');
      return { ok: false, error: 'Auth system not loaded.' };
    }

    const email  = (firebaseUser.email || '').trim().toLowerCase();
    const name   = firebaseUser.displayName || email.split('@')[0] || 'User';
    // Force larger Google photo (200px instead of default 96px)
    let avatar   = firebaseUser.photoURL || '';
    if (avatar.includes('=s96-c'))   avatar = avatar.replace('=s96-c',   '=s200-c');
    if (avatar.includes('=s50-c'))   avatar = avatar.replace('=s50-c',   '=s200-c');
    if (!avatar) avatar = avatarFallback(name);

    console.log('[FirebaseAuth] Login OK:', provider, email, '| avatar:', avatar.slice(0, 80));

    if (!email) {
      return { ok: false, error: 'Google tidak mengembalikan email. Pastikan privasi akun mengizinkan akses email.' };
    }

    return Auth.socialLogin(provider, {
      email,
      name,
      avatar,
      verified: !!firebaseUser.emailVerified
    });
  }

  /* ── Lazy-load Firebase SDK ────────────────────────────────────── */
  async function initFirebase() {
    const [{ initializeApp, getApps, getApp }] = await Promise.all([
      import(`${FB_CDN}/firebase-app.js`)
    ]);
    const app = getApps().length ? getApp() : initializeApp(window.FIREBASE_CONFIG);
    const { getAuth } = await import(`${FB_CDN}/firebase-auth.js`);
    return { app, auth: getAuth(app) };
  }

  /* ── GOOGLE SIGN-IN ────────────────────────────────────────────── */
  window.firebaseGoogleLogin = async function (onSuccess, onError) {
    try {
      const { auth } = await initFirebase();
      const { GoogleAuthProvider, signInWithPopup } = await import(`${FB_CDN}/firebase-auth.js`);

      const gProvider = new GoogleAuthProvider();
      gProvider.addScope('profile');
      gProvider.addScope('email');
      gProvider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, gProvider);
      const res    = handleFirebaseUser(result.user, 'google');

      if (res.ok) {
        onSuccess && onSuccess(res.user);
      } else {
        onError && onError(res.error || 'Gagal menyimpan sesi.');
      }
    } catch (err) {
      console.error('[GoogleLogin Error]', err.code, err.message);
      onError && onError(friendlyError(err), err.code);
    }
  };

  /* ── GITHUB SIGN-IN ────────────────────────────────────────────── */
  window.firebaseGitHubLogin = async function (onSuccess, onError) {
    try {
      const { auth } = await initFirebase();
      const { GithubAuthProvider, signInWithPopup } = await import(`${FB_CDN}/firebase-auth.js`);

      const ghProvider = new GithubAuthProvider();
      ghProvider.addScope('read:user');
      ghProvider.addScope('user:email');

      const result = await signInWithPopup(auth, ghProvider);
      const email  = result.user.email || result.user.providerData?.[0]?.email || '';
      const res    = handleFirebaseUser(Object.assign({}, result.user, { email }), 'github');

      if (res.ok) {
        onSuccess && onSuccess(res.user);
      } else {
        onError && onError(res.error || 'Gagal menyimpan sesi.', 'custom');
      }
    } catch (err) {
      console.error('[GitHubLogin Error]', err.code, err.message);
      onError && onError(friendlyError(err), err.code);
    }
  };

  /* ── SIGN OUT ──────────────────────────────────────────────────── */
  window.firebaseSignOut = async function () {
    try {
      const { auth } = await initFirebase();
      const { signOut } = await import(`${FB_CDN}/firebase-auth.js`);
      await signOut(auth);
    } catch (e) { /* silent */ }
  };

  /* ── Pesan error yang ramah pengguna ───────────────────────────── */
  function friendlyError(err) {
    const c = err.code || '';
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'domain Anda';

    if (c === 'auth/operation-not-allowed')
      return '⚙️ Google Sign-In belum diaktifkan di Firebase Console.\nBuka: Firebase Console → Authentication → Sign-in method → Google → Enable → Save.';
    if (c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request')
      return 'Login dibatalkan oleh pengguna.';
    if (c === 'auth/popup-blocked')
      return 'Popup diblokir browser. Izinkan pop-up di browser Anda, lalu coba lagi.';
    if (c === 'auth/unauthorized-domain')
      return `Domain '${currentHost}' belum diizinkan di Firebase Console.\nBuka: Firebase Console → Authentication → Settings → Authorized domains → Tambahkan: ${currentHost}`;
    if (c === 'auth/account-exists-with-different-credential')
      return 'Email ini sudah terdaftar dengan metode login lain. Coba login dengan Google.';
    if (c === 'auth/network-request-failed')
      return 'Gagal terhubung ke server autentikasi Google. Periksa koneksi internet Anda.';
    return err.message || 'Login gagal. Silakan coba lagi.';
  }

  console.log('[FirebaseAuth] ✅ Handler ready (SDK v12.19.0) | CONFIGURED =', window.FIREBASE_CONFIGURED);
})();

