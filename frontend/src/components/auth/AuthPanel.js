export default function AuthPanel({
  authMode,
  username,
  password,
  onUsernameChange,
  onPasswordChange,
  onAuthModeToggle,
  onSubmit,
  onGuest
}) {
  return (
    <section className="card">
      <h2 className="card-title">{authMode === "login" ? "Log in" : "Create account"}</h2>
      <div className="field-row">
        <input
          className="input"
          placeholder="username"
          autoComplete="username"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
        />
      </div>
      <div className="field-row">
        <input
          className="input"
          type="password"
          placeholder="password"
          autoComplete={authMode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
        />
      </div>
      <div className="btn-row">
        <button type="button" className="btn btn-primary" onClick={onSubmit}>
          {authMode === "login" ? "Log in" : "Sign up"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onAuthModeToggle}>
          {authMode === "login" ? "Need an account?" : "Have an account?"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onGuest}>Play as guest</button>
      </div>
    </section>
  );
}
