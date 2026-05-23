import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const authScreen = document.getElementById("auth-screen");
const siteShell = document.getElementById("site-shell");
const authError = document.getElementById("auth-error");
const authSuccess = document.getElementById("auth-success");
const btnSignOut = document.getElementById("btn-sign-out");
const tabLogin = document.getElementById("auth-tab-login");
const tabSignup = document.getElementById("auth-tab-signup");
const panelLogin = document.getElementById("auth-panel-login");
const panelSignup = document.getElementById("auth-panel-signup");
const formLogin = document.getElementById("auth-form-login");
const formSignup = document.getElementById("auth-form-signup");
const btnGoogle = document.getElementById("auth-btn-google");

let supabase = null;
let booted = false;

function env() {
  return window.__ENV__ || {};
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

function showSite(session) {
  if (authScreen) authScreen.hidden = true;
  if (siteShell) siteShell.hidden = false;
  if (btnSignOut) {
    btnSignOut.hidden = false;
    const label = session?.user?.email ? `ログアウト` : "ログアウト";
    btnSignOut.textContent = label;
    btnSignOut.title = session?.user?.email || "";
  }
  if (!booted && typeof window.bootCurriculum === "function") {
    booted = true;
    window.bootCurriculum();
  }
}

function showAuthOnly() {
  if (authScreen) authScreen.hidden = false;
  if (siteShell) siteShell.hidden = true;
  if (btnSignOut) btnSignOut.hidden = true;
}

function setBusy(busy) {
  document.querySelectorAll(".auth-form button[type=submit], #auth-btn-google").forEach((el) => {
    el.disabled = busy;
  });
}

async function handleSession(session) {
  if (!session?.user) {
    showAuthOnly();
    return;
  }
  if (!isAllowed(session.user)) {
    await supabase.auth.signOut();
    setError("このアカウントは利用が許可されていません。管理者にお問い合わせください。");
    showAuthOnly();
    return;
  }
  setError("");
  setSuccess("");
  showSite(session);
}

function setAuthTab(mode) {
  const login = mode === "login";
  if (tabLogin) tabLogin.classList.toggle("is-active", login);
  if (tabSignup) tabSignup.classList.toggle("is-active", !login);
  if (panelLogin) panelLogin.hidden = !login;
  if (panelSignup) panelSignup.hidden = login;
  if (supabase) {
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

  const { SUPABASE_URL, SUPABASE_ANON_KEY } = env();
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    showAuthOnly();
    setAuthFormsDisabled(true);
    setError(
      "認証の設定がありません。Vercel の環境変数（SUPABASE_URL / SUPABASE_ANON_KEY）を設定して再デプロイしてください。"
    );
    return;
  }

  setAuthFormsDisabled(false);

  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.__supabase = supabase;

  const redirectTo = window.location.origin + window.location.pathname;

  supabase.auth.onAuthStateChange((_event, session) => {
    handleSession(session);
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  await handleSession(session);

  formLogin?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const fd = new FormData(formLogin);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(jaAuthError(error.message));
  });

  formSignup?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const fd = new FormData(formSignup);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    setBusy(false);
    if (error) setError(jaAuthError(error.message));
    else
      setSuccess(
        "登録を受け付けました。確認メールが届いたらリンクを開き、再度このページからログインしてください。"
      );
  });

  btnGoogle?.addEventListener("click", async () => {
    setError("");
    setSuccess("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    setBusy(false);
    if (error) setError(jaAuthError(error.message));
  });

  btnSignOut?.addEventListener("click", async () => {
    setBusy(true);
    await supabase.auth.signOut();
    setBusy(false);
    location.hash = "#/";
    showAuthOnly();
    setAuthTab("login");
  });
}

function jaAuthError(msg) {
  const m = String(msg || "");
  if (m.includes("Invalid login credentials")) return "メールアドレスまたはパスワードが正しくありません。";
  if (m.includes("User already registered")) return "このメールアドレスは既に登録されています。ログインしてください。";
  if (m.includes("Password should be")) return "パスワードは6文字以上で設定してください。";
  return m || "認証に失敗しました。";
}

init();
