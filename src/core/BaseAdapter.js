import { EventEmitter } from 'events';
import { AdapterMethodNotSupportedError } from '../errors/index.js';

/**
 * Base class that all adapter sessions must implement.
 */
export class BaseAdapter extends EventEmitter {
  /**
   * @param {string} sessionId 
   * @param {object} options 
   * @param {string} adapterName 
   */
  constructor(sessionId, options = {}, adapterName = 'base') {
    super();
    this.sessionId = sessionId;
    this.options = options;
    this.adapterName = adapterName;
  }

  /** @abstract */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /** @abstract */
  async destroy() {
    throw new Error('destroy() must be implemented by subclass');
  }

  /** @abstract */
  async restart() {
    throw new Error('restart() must be implemented by subclass');
  }

  /** @abstract */
  async sendText(to, message, options) {
    throw new Error('sendText() must be implemented by subclass');
  }

  /** @abstract */
  async sendMedia(to, media, options) {
    throw new Error('sendMedia() must be implemented by subclass');
  }

  /** @abstract */
  async sendPdf(to, file, options) {
    throw new Error('sendPdf() must be implemented by subclass');
  }

  /** @abstract */
  async sendImage(to, file, options) {
    throw new Error('sendImage() must be implemented by subclass');
  }

  /** @abstract */
  async sendAudio(to, file, options) {
    throw new Error('sendAudio() must be implemented by subclass');
  }

  /** @abstract */
  async sendDocument(to, file, options) {
    throw new Error('sendDocument() must be implemented by subclass');
  }

  /** @abstract */
  async sendLocation(to, location, options) {
    throw new Error('sendLocation() must be implemented by subclass');
  }

  /** @abstract */
  async reactToMessage(messageId, reaction) {
    throw new Error('reactToMessage() must be implemented by subclass');
  }

  /** @abstract */
  getInfo() {
    throw new Error('getInfo() must be implemented by subclass');
  }

  /** @abstract */
  getState() {
    throw new Error('getState() must be implemented by subclass');
  }

  // Optional methods (throw AdapterMethodNotSupportedError by default)

  async listMessages(options) {
    throw new AdapterMethodNotSupportedError('listMessages', this.adapterName);
  }

  async getMessage(messageId) {
    throw new AdapterMethodNotSupportedError('getMessage', this.adapterName);
  }

  async getContact(phone) {
    throw new AdapterMethodNotSupportedError('getContact', this.adapterName);
  }

  async getContacts(options) {
    throw new AdapterMethodNotSupportedError('getContacts', this.adapterName);
  }

  async getProfilePicture(phone) {
    throw new AdapterMethodNotSupportedError('getProfilePicture', this.adapterName);
  }
}
export default BaseAdapter;
