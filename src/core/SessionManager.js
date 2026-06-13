import { SessionAlreadyExistsError, SessionNotFoundError } from '../errors/index.js';

/**
 * Manages active session instances.
 */
export class SessionManager {
  constructor() {
    /** @type {Map<string, import('./WhatsAppSession.js').WhatsAppSession>} */
    this.sessions = new Map();
  }

  /**
   * Registers a new session.
   * @param {string} sessionId 
   * @param {import('./WhatsAppSession.js').WhatsAppSession} session 
   */
  addSession(sessionId, session) {
    if (this.sessions.has(sessionId)) {
      throw new SessionAlreadyExistsError(sessionId);
    }
    this.sessions.set(sessionId, session);
  }

  /**
   * Retrieves a session by ID.
   * @param {string} sessionId 
   * @returns {import('./WhatsAppSession.js').WhatsAppSession|undefined}
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  /**
   * Lists all registered sessions.
   * @returns {import('./WhatsAppSession.js').WhatsAppSession[]}
   */
  listSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * Destroys and removes a session by ID.
   * @param {string} sessionId 
   */
  async removeSession(sessionId) {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }
    await session.destroy();
    this.sessions.delete(sessionId);
  }

  /**
   * Destroys all registered sessions.
   */
  async destroy() {
    const destroyPromises = [];
    for (const session of this.sessions.values()) {
      destroyPromises.push(session.destroy().catch(() => {}));
    }
    await Promise.all(destroyPromises);
    this.sessions.clear();
  }
}
export default SessionManager;
