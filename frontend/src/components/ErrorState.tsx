export function ErrorState({ message }: { message: string }) {
  return <div className="error-box error" role="alert">{message}</div>;
}
