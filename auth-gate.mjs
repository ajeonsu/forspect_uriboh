import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const authScreen = document.getElementById("auth-screen");
const siteShell = document.getElementById("site-shell");
const authError = document.getElementById("auth-error");
const authSuccess = document.getElementById("auth-success");
const btnSignOut = document.getElementById("btn-sign-out");
const navUserEmail = document.getElementById("nav-user-email");
const tabLogin = document.getElementById("auth-tab-login");
const tabSignup = document.getElementById("auth-tab-signup");
const panelLogin = document.getElementById("auth-panel-login");
const panelSignup = document.getElementById("auth-panel-signup");
const formLogin = document.getElementById("auth-form-login");
const formSignup = document.getElementById("auth-form-signup");
const btnGoogle = document.getElementById("auth-btn-google");

let auth = null;
let booted = false;

function env() {
  return window.__ENV__ || {};
}

function firebaseConfig() {
  const e = env();
  if (e.FIREBASE_CONFIG?.apiKey) return e.FIREBASE_CONFIG;
  const apiKey = e.FIREBASE_API_KEY || e.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    authDomain: e.FIREBASE_AUTH_DOMAIN || e.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: e.FIREBASE_PROJECT_ID || e.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: e.FIREBASE_STORAGE_BUCKET || e.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId:
      e.FIREBASE_MESSAGING_SENDER_ID || e.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: e.FIREBASE_APP_ID || e.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

function setError(msg) {
  if (!authError) return;
  authError.textContent = msg || "";
  authError.hidden = !msg;
  if (msg && authSuccess) authSuccess.hidden = true;
}

function setSuccess(msg) {
  if (!authSuccess) return;
  authSuccess.textContent = msg || "";
  authSuccess.hidden = !msg;
  if (msg && authError) authError.hidden = true;
}

function isAllowed(user) {
  const list = env().ALLOWED_EMAILS;
  if (!list || !list.length) return true;
  const email = (user?.email || "").trim().toLowerCase();
  return list.map((e) => e.trim().toLowerCase()).includes(email);
}

function showSite(user) {
  document.body.classList.remove("auth-locked");
  if (authScreen) authScreen.hidden = true;
  if (siteShell) siteShell.hidden = false;
  if (navUserEmail && user?.email) {
    navUserEmail.textContent = user.email;
    navUserEmail.title = user.email;
    navUserEmail.hidden = false;
  }
  if (btnSignOut) {
    btnSignOut.hidden = false;
    btnSignOut.textContent = "ログアウト";
    btnSignOut.title = user?.email || "";
  }
  if (!booted && typeof window.bootCurriculum === "function") {
    booted = true;
    window.bootCurriculum();
  }
}

function showAuthOnly() {
  document.body.classList.add("auth-locked");
  if (authScreen) authScreen.hidden = false;
  if (siteShell) siteShell.hidden = true;
  if (btnSignOut) btnSignOut.hidden = true;
  if (navUserEmail) {
    navUserEmail.textContent = "";
    navUserEmail.hidden = true;
  }
}

function setBusy(busy) {
  document.querySelectorAll(".auth-form button[type=submit], #auth-btn-google").forEach((el) => {
    el.disabled = busy;
  });
}

async function handleUser(user) {
  if (!user) {
    showAuthOnly();
    return;
  }
  if (!isAllowed(user)) {
    await signOut(auth);
    setError("このアカウントは利用が許可されていません。管理者にお問い合わせください。");
    showAuthOnly();
    return;
  }
  setError("");
  setSuccess("");
  showSite(user);
}

function setAuthTab(mode) {
  const login = mode === "login";
  if (tabLogin) tabLogin.classList.toggle("is-active", login);
  if (tabSignup) tabSignup.classList.toggle("is-active", !login);
  if (panelLogin) panelLogin.hidden = !login;
  if (panelSignup) panelSignup.hidden = login;
  if (auth) {
    setError("");
    setSuccess("");
  }
}

function bindAuthTabs() {
  tabLogin?.addEventListener("click", () => setAuthTab("login"));
  tabSignup?.addEventListener("click", () => setAuthTab("signup"));
  setAuthTab("login");
}

function setAuthFormsDisabled(disabled) {
  document
    .querySelectorAll(".auth-form input, .auth-form button[type=submit], #auth-btn-google")
    .forEach((el) => {
      el.disabled = disabled;
    });
}

async function init() {
  bindAuthTabs();
  document.body.classList.add("auth-locked");

  const cfg = firebaseConfig();
  if (!cfg?.apiKey || !cfg?.authDomain || !cfg?.projectId) {
    showAuthOnly();
    setAuthFormsDisabled(true);
    setError(
      "Firebase の設定がありません。Vercel の環境変数に NEXT_PUBLIC_FIREBASE_*（または FIREBASE_*）を設定して再デプロイしてください。Firebase Console → プロジェクトの設定 → ウェブアプリの構成を参照。"
    );
    return;
  }

  setAuthFormsDisabled(false);

  const app = initializeApp(cfg);
  auth = getAuth(app);
  window.__firebaseAuth = auth;

  onAuthStateChanged(auth, (user) => {
    handleUser(user);
  });

  formLogin?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const fd = new FormData(formLogin);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(jaFirebaseError(err));
    }
    setBusy(false);
  });

  formSignup?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const fd = new FormData(formSignup);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    setBusy(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setSuccess("登録が完了しました。ログインしました。");
    } catch (err) {
      setError(jaFirebaseError(err));
    }
    setBusy(false);
  });

  btnGoogle?.addEventListener("click", async () => {
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      setError(jaFirebaseError(err));
    }
    setBusy(false);
  });

  btnSignOut?.addEventListener("click", async () => {
    setBusy(true);
    try {
      await signOut(auth);
    } catch (_) {}
    setBusy(false);
    location.hash = "#/";
    showAuthOnly();
    setAuthTab("login");
  });
}

function jaFirebaseError(err) {
  const code = err?.code || "";
  const map = {
    "auth/invalid-email": "メールアドレスの形式が正しくありません。",
    "auth/user-disabled": "このアカウントは無効です。",
    "auth/user-not-found": "メールアドレスまたはパスワードが正しくありません。",
    "auth/wrong-password": "メールアドレスまたはパスワードが正しくありません。",
    "auth/invalid-credential": "メールアドレスまたはパスワードが正しくありません。",
    "auth/email-already-in-use": "このメールアドレスは既に登録されています。ログインしてください。",
    "auth/weak-password": "パスワードは6文字以上で設定してください。",
    "auth/popup-closed-by-user": "ログインがキャンセルされました。",
    "auth/unauthorized-domain": "このドメインは Firebase で許可されていません。Authentication → Settings → Authorized domains に追加してください。",
    "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
      "Firebase API キーが無効です。Google Cloud → Credentials でキーの制限を確認するか、Firebase のプロジェクト設定から apiKey を再コピーして .env.local → npm run build → 再起動してください。",
  };
  return map[code] || err?.message || "認証に失敗しました。";
}

init();
