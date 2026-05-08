export default function StatusBanner({ statusMessage, error }) {
  return (
    <>
      {statusMessage ? <p className="status-line">{statusMessage}</p> : null}
      {error ? <div className="error-banner" role="alert">{error}</div> : null}
    </>
  );
}
