/** Inlined on /inbox so login works when external stylesheets fail in older WebViews. */
export const INBOX_CRITICAL_CSS = `
.inbox-login-page {
  box-sizing: border-box;
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  max-width: 100vw;
  margin: 0;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #09090b;
  color: #fafafa;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  overflow-x: hidden;
}
.inbox-login-page *, .inbox-login-page *::before, .inbox-login-page *::after {
  box-sizing: border-box;
}
.inbox-login-card {
  width: 100%;
  max-width: 360px;
  padding: 28px 24px;
  border-radius: 20px;
  background: #18181b;
  border: 1px solid #27272a;
}
.inbox-login-brand {
  text-align: center;
  margin-bottom: 24px;
}
.inbox-login-logo-wrap {
  width: 72px;
  height: 72px;
  max-width: 72px;
  max-height: 72px;
  margin: 0 auto 16px;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}
.inbox-login-logo {
  width: 72px !important;
  height: 72px !important;
  max-width: 72px !important;
  max-height: 72px !important;
  object-fit: contain !important;
  display: block;
}
.inbox-login-title {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 700;
  color: #fafafa;
  line-height: 1.2;
}
.inbox-login-subtitle {
  margin: 0;
  font-size: 14px;
  color: #a1a1aa;
}
.inbox-login-error {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(244, 63, 94, 0.1);
  border: 1px solid rgba(244, 63, 94, 0.25);
  color: #fb7185;
  font-size: 13px;
  text-align: center;
}
.inbox-login-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.inbox-login-input {
  width: 100%;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid #3f3f46;
  background: #09090b;
  color: #fafafa;
  font-size: 18px;
  text-align: center;
  letter-spacing: 0.15em;
  outline: none;
}
.inbox-login-input:focus {
  border-color: #10b981;
}
.inbox-login-btn {
  width: 100%;
  padding: 14px 16px;
  border: none;
  border-radius: 14px;
  background: #10b981;
  color: #09090b;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.inbox-login-btn:active {
  background: #059669;
}
`;
