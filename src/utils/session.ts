export function getSessionId(): string {
  let sessionId = localStorage.getItem('kt_session_id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('kt_session_id', sessionId);
  }
  return sessionId;
}
