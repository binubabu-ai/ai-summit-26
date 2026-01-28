// Shared in-memory storage for CLI authentication sessions
// In production, replace this with Redis/Vercel KV

export interface SessionData {
  status: string;
  token?: string;
  refreshToken?: string;
  email?: string;
  userId?: string;
  expiresAt?: string;
  timestamp: number;
}

export const sessions = new Map<string, SessionData>();

// Clean up expired sessions (older than 5 minutes)
function cleanupExpiredSessions() {
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  for (const [sessionId, data] of sessions.entries()) {
    if (data.timestamp < fiveMinutesAgo) {
      sessions.delete(sessionId);
    }
  }
}

// Run cleanup periodically
if (typeof window === 'undefined') {
  // Only run on server
  setInterval(cleanupExpiredSessions, 60 * 1000); // Every minute
}
