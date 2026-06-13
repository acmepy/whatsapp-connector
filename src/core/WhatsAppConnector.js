import { SessionManager } from './SessionManager.js';
import { WhatsAppSession } from './WhatsAppSession.js';
import { AdapterNotSupportedError } from '../errors/index.js';
import { WwebjsAdapter } from '../adapters/wwebjs/adapter.js';

/**
 * Top-level manager to create and manage multiple WhatsApp sessions.
 */
export class WhatsAppConnector {
  /**
   * @param {import('../types/index.js').WhatsAppConnectorOptions} [options]
   */
  constructor(options = {}) {
    this.options = options;
    this.manager = new SessionManager();
    
    /** @type {Map<string, any>} */
    this.adapters = new Map();

    // Register wwebjs as the default adapter
    this.registerAdapter('wwebjs', WwebjsAdapter);
  }

  /**
   * Register a new adapter implementation.
   * @param {string} name 
   * @param {object} adapter 
   */
  registerAdapter(name, adapter) {
    this.adapters.set(name, adapter);
  }

  /**
   * Creates and initializes a session.
   * @param {string} sessionId 
   * @param {object} [options] 
   * @returns {Promise<WhatsAppSession>}
   */
  async createSession(sessionId, options = {}) {
    const adapterName = options.adapter || this.options.defaultAdapter || 'wwebjs';
    const adapter = this.adapters.get(adapterName);

    if (!adapter) {
      throw new AdapterNotSupportedError(adapterName);
    }

    // Create the session adapter instance
    const adapterInstance = adapter.createSession(sessionId, {
      ...this.options,
      ...options
    });

    // Create the main session wrapper
    const session = new WhatsAppSession(sessionId, adapterInstance);

    // Register the session (throws if session already exists)
    this.manager.addSession(sessionId, session);

    // Initialize adapter. We run this, which starts the auth / browser in next tick
    await adapterInstance.initialize();

    return session;
  }

  /**
   * Retrieves an active session.
   * @param {string} sessionId 
   * @returns {WhatsAppSession|undefined}
   */
  getSession(sessionId) {
    return this.manager.getSession(sessionId);
  }

  /**
   * Lists all active sessions.
   * @returns {WhatsAppSession[]}
   */
  listSessions() {
    return this.manager.listSessions();
  }

  /**
   * Destroys and removes a session.
   * @param {string} sessionId 
   */
  async removeSession(sessionId) {
    await this.manager.removeSession(sessionId);
  }

  /**
   * Destroys all sessions and cleans up.
   */
  async destroy() {
    await this.manager.destroy();
  }
}
export default WhatsAppConnector;
