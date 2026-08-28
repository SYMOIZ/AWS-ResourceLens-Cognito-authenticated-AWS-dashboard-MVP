export function LoadingState({ message }: { message: string }) {
  return <div className="loading" role="status">{message}</div>;
}
