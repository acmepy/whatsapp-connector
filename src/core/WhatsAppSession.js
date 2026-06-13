import { EventEmitter } from 'events';
import { SessionNotReadyError } from '../errors/index.js';
import { EventBus } from '../events/EventBus.js';

/**
 * Represents a single active WhatsApp session.
 * Decouples the application code from the specific adapter.
 */
export class WhatsAppSession extends EventEmitter {
  /**
   * @param {string} sessionId 
   * @param {import('./BaseAdapter.js').BaseAdapter} adapterInstance 
   */
  constructor(sessionId, adapterInstance) {
    super();
    this.sessionId = sessionId;
    this.adapterInstance = adapterInstance;
    this.adapter = adapterInstance.adapterName;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.status = 'initializing';

    this._setupEventListeners();
  }

  /**
   * Internal helper to transition states and emit state change events.
   * @param {string} newStatus 
   * @private
   */
  _setState(newStatus) {
    if (this.status !== newStatus) {
      const oldStatus = this.status;
      this.status = newStatus;
      this.updatedAt = new Date();
      this.emitNormalized('session.state.changed', {
        previous: oldStatus,
        current: newStatus
      });
    }
  }

  /**
   * Wraps and emits events with the normalized structure.
   * Also passes the raw payload as the second parameter for user convenience.
   * @param {string} eventName 
   * @param {any} payload 
   */
  emitNormalized(eventName, payload) {
    const eventObj = {
      sessionId: this.sessionId,
      adapter: this.adapter,
      timestamp: Date.now(),
      payload
    };
    this.emit(eventName, eventObj, payload);
    EventBus.publish(eventName, eventObj);
  }

  /**
   * Sets up event mapping from the adapter instance.
   * @private
   */
  _setupEventListeners() {
    this.adapterInstance.on('qr', (qr) => {
      this._setState('qr');
      this.emitNormalized('qr.received', qr);
    });

    this.adapterInstance.on('authenticated', () => {
      this._setState('authenticated');
      this.emitNormalized('session.authenticated', null);
    });

    this.adapterInstance.on('ready', () => {
      this._setState('ready');
      this.emitNormalized('session.ready', null);
    });

    this.adapterInstance.on('disconnected', (reason) => {
      this._setState('disconnected');
      this.emitNormalized('session.disconnected', { reason });
    });

    this.adapterInstance.on('failed', (error) => {
      this._setState('failed');
      this.emitNormalized('session.failed', { error: error?.message || error });
    });

    this.adapterInstance.on('error', (error) => {
      this.emitNormalized('session.error', error);
    });

    this.adapterInstance.on('adapter.error', (error) => {
      this.emitNormalized('adapter.error', error);
    });

    this.adapterInstance.on('message', (normalizedMsg) => {
      this.emitNormalized('message.received', normalizedMsg);
    });

    this.adapterInstance.on('message.sent', (normalizedMsg) => {
      this.emitNormalized('message.sent', normalizedMsg);
    });

    this.adapterInstance.on('message.ack', (normalizedAck) => {
      this.emitNormalized('message.ack', normalizedAck);
    });

    this.adapterInstance.on('message.revoked', (normalizedMsg) => {
      this.emitNormalized('message.revoked', normalizedMsg);
    });

    this.adapterInstance.on('message.reaction', (normalizedReaction) => {
      this.emitNormalized('message.reaction', normalizedReaction);
    });

    this.adapterInstance.on('chat.updated', (normalizedChat) => {
      this.emitNormalized('chat.updated', normalizedChat);
    });

    this.adapterInstance.on('contact.updated', (normalizedContact) => {
      this.emitNormalized('contact.updated', normalizedContact);
    });

    this.adapterInstance.on('group.join', (groupNotification) => {
      this.emitNormalized('group.join', groupNotification);
    });

    this.adapterInstance.on('group.leave', (groupNotification) => {
      this.emitNormalized('group.leave', groupNotification);
    });
  }

  /**
   * Assures the session is ready before executing messages or queries.
   * @private
   */
  _assertReady() {
    if (this.status !== 'ready') {
      throw new SessionNotReadyError(this.sessionId);
    }
  }

  /**
   * Standardizes response format for send operations.
   * @param {object} result 
   * @returns {object}
   * @private
   */
  _formatSendResult(result) {
    return {
      messageId: result.messageId,
      sessionId: this.sessionId,
      adapter: this.adapter,
      timestamp: result.timestamp || Date.now()
    };
  }

  // --- Message Sending Operations ---

  async sendText(to, message, options) {
    this._assertReady();
    const res = await this.adapterInstance.sendText(to, message, options);
    return this._formatSendResult(res);
  }

  async sendMedia(to, media, options) {
    this._assertReady();
    const res = await this.adapterInstance.sendMedia(to, media, options);
    return this._formatSendResult(res);
  }

  async sendPdf(to, file, options) {
    this._assertReady();
    const res = await this.adapterInstance.sendPdf(to, file, options);
    return this._formatSendResult(res);
  }

  async sendImage(to, file, options) {
    this._assertReady();
    const res = await this.adapterInstance.sendImage(to, file, options);
    return this._formatSendResult(res);
  }

  async sendAudio(to, file, options) {
    this._assertReady();
    const res = await this.adapterInstance.sendAudio(to, file, options);
    return this._formatSendResult(res);
  }

  async sendDocument(to, file, options) {
    this._assertReady();
    const res = await this.adapterInstance.sendDocument(to, file, options);
    return this._formatSendResult(res);
  }

  async sendLocation(to, location, options) {
    this._assertReady();
    const res = await this.adapterInstance.sendLocation(to, location, options);
    return this._formatSendResult(res);
  }

  async reactToMessage(messageId, reaction) {
    this._assertReady();
    await this.adapterInstance.reactToMessage(messageId, reaction);
  }

  // --- Session Lifecycle Operations ---

  getInfo() {
    const adapterInfo = this.adapterInstance.getInfo() || {};
    return {
      sessionId: this.sessionId,
      adapter: this.adapter,
      adapterVersion: adapterInfo.adapterVersion || '0.0.0',
      status: this.status,
      qr: adapterInfo.qr || null,
      phone: adapterInfo.phone || null,
      pushname: adapterInfo.pushname || null,
      reason: adapterInfo.reason || null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  getState() {
    return this.status;
  }

  async restart() {
    this._setState('initializing');
    await this.adapterInstance.restart();
  }

  async destroy() {
    this._setState('destroyed');
    await this.adapterInstance.destroy();
    this.emitNormalized('session.destroyed', null);
  }

  // --- Optional Queries (Throws AdapterMethodNotSupportedError if unsupported) ---

  async listMessages(options) {
    this._assertReady();
    return await this.adapterInstance.listMessages(options);
  }

  async getMessage(messageId) {
    this._assertReady();
    return await this.adapterInstance.getMessage(messageId);
  }

  async getContact(phone) {
    this._assertReady();
    return await this.adapterInstance.getContact(phone);
  }

  async getContacts(options) {
    this._assertReady();
    return await this.adapterInstance.getContacts(options);
  }

  async getProfilePicture(phone) {
    this._assertReady();
    return await this.adapterInstance.getProfilePicture(phone);
  }
}
export default WhatsAppSession;
