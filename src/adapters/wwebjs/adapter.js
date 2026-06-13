import { WwebjsSession } from './session.js';

export const WwebjsAdapter = {
  name: 'wwebjs',

  /**
   * Factory method to create a new session instance.
   * @param {string} sessionId 
   * @param {object} options 
   * @returns {WwebjsSession}
   */
  createSession(sessionId, options) {
    return new WwebjsSession(sessionId, options);
  }
};

export default WwebjsAdapter;
