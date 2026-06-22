export default function ErrorBanner({ message, onDismiss }) {
  return (
    <div role="alert" className="alert alert-error justify-between">
      <p>{message}</p>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss error"
          onClick={onDismiss}
          className="btn btn-sm btn-ghost text-error-content"
        >
          &times;
        </button>
      )}
    </div>
  );
}
