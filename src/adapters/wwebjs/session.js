import pkg from 'whatsapp-web.js';
import path from 'path';
import { createRequire } from 'module';
import { BaseAdapter } from '../../core/BaseAdapter.js';
import {
  normalizeMessage,
  normalizeContact,
  normalizeChat,
  normalizePhone,
  normalizeMedia,
  normalizeLocation
} from '../../utils/normalize.js';
import { AuthenticationError, ConnectionError } from '../../errors/index.js';

const { Client, LocalAuth, MessageMedia } = pkg;
const require = createRequire(import.meta.url);

// Try to resolve the actual installed whatsapp-web.js version
let adapterVersion = '1.26.0';
try {
  adapterVersion = require('whatsapp-web.js/package.json').version;
} catch (_) {}

/**
 * Custom auth strategy to avoid the "session-" prefix in directories
 * and store the session directory exactly inside `./sessions/<sessionId>/`.
 */
class IsolatedLocalAuth extends LocalAuth {
  constructor(options) {
    super(options);
    this.clientId = options.clientId;
    this.dataPath = options.dataPath || './sessions';
  }

  async beforeBrowserStart() {
    const puppeteerOpts = this.client.options.puppeteer;
    // Set user data directory directly to `./sessions/<clientId>`
    const sessionPath = path.resolve(this.dataPath, this.clientId);
    this.userDataDir = sessionPath;

    if (puppeteerOpts.userDataDir && puppeteerOpts.userDataDir !== sessionPath) {
      throw new Error('LocalAuth is not compatible with a user-specified userDataDir.');
    }

    puppeteerOpts.userDataDir = sessionPath;
  }
}

/**
 * Adapter implementation for whatsapp-web.js (wwebjs).
 */
export class WwebjsSession extends BaseAdapter {
  constructor(sessionId, options = {}) {
    super(sessionId, options, 'wwebjs');

    this.qr = null;
    this.phone = null;
    this.pushname = null;
    this.disconnectedReason = null;

    this._createClient();
  }

  /**
   * Instantiates the Client and registers listeners.
   * @private
   */
  _createClient() {
    const puppeteerOpts = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      ...(this.options.puppeteer || {})
    };

    const authStrategy = new IsolatedLocalAuth({
      clientId: this.sessionId,
      dataPath: this.options.dataPath || './sessions'
    });

    this.client = new Client({
      authStrategy,
      puppeteer: puppeteerOpts,
      ...(this.options.wwebjs || {})
    });

    this._registerClientEvents();
  }

  /**
   * Listens to whatsapp-web.js client events and maps them to normalized events.
   * @private
   */
  _registerClientEvents() {
    this.client.on('qr', (qr) => {
      this.qr = qr;
      this.emit('qr', qr);
    });

    this.client.on('authenticated', () => {
      this.qr = null;
      this.emit('authenticated');
    });

    this.client.on('ready', () => {
      this.qr = null;
      this.disconnectedReason = null;

      const info = this.client.info;
      if (info) {
        this.phone = info.wid?.user || null;
        this.pushname = info.pushname || null;
      }

      this.emit('ready');
    });

    this.client.on('auth_failure', (msg) => {
      this.emit('failed', new AuthenticationError(msg));
    });

    this.client.on('disconnected', (reason) => {
      this.disconnectedReason = reason;
      this.emit('disconnected', reason);
    });

    this.client.on('change_state', (state) => {
      this.emit('state.changed', state);
    });

    this.client.on('message', (msg) => {
      const normalized = normalizeMessage(msg, this.sessionId, 'wwebjs');
      if (normalized) {
        this.emit('message', normalized);
      }
    });

    this.client.on('message_create', (msg) => {
      // Emit message.sent if the message was sent from the current user
      if (msg.fromMe) {
        const normalized = normalizeMessage(msg, this.sessionId, 'wwebjs');
        if (normalized) {
          this.emit('message.sent', normalized);
        }
      }
    });

    this.client.on('message_ack', (msg, ack) => {
      const normalized = normalizeMessage(msg, this.sessionId, 'wwebjs');
      if (normalized) {
        normalized.ack = ack;
        this.emit('message.ack', normalized);
      }
    });

    this.client.on('message_revoke_everyone', (after, before) => {
      const normalized = normalizeMessage(after, this.sessionId, 'wwebjs');
      if (normalized) {
        this.emit('message.revoked', normalized);
      }
    });

    this.client.on('message_reaction', (reaction) => {
      const normalizedReaction = {
        messageId: reaction.msgId?._serialized || reaction.msgId || '',
        reaction: reaction.reaction,
        senderId: reaction.senderId || null,
        chatId: reaction.id?.remote || null
      };
      this.emit('message.reaction', normalizedReaction);
    });

    this.client.on('chat_update', (chat) => {
      const normalized = normalizeChat(chat);
      if (normalized) {
        this.emit('chat.updated', normalized);
      }
    });

    this.client.on('contact_update', (contact) => {
      const normalized = normalizeContact(contact);
      if (normalized) {
        this.emit('contact.updated', normalized);
      }
    });

    this.client.on('group_join', (notification) => {
      this.emit('group.join', {
        chatId: notification.chatId || '',
        author: notification.author || '',
        recipientIds: notification.recipientIds || [],
        timestamp: notification.timestamp || Math.floor(Date.now() / 1000)
      });
    });

    this.client.on('group_leave', (notification) => {
      this.emit('group.leave', {
        chatId: notification.chatId || '',
        author: notification.author || '',
        recipientIds: notification.recipientIds || [],
        timestamp: notification.timestamp || Math.floor(Date.now() / 1000)
      });
    });
  }

  // --- BaseAdapter interface implementation ---

  async initialize() {
    // We defer the initialize call to the next tick to let the user hook up event listeners.
    process.nextTick(() => {
      this.client.initialize().catch((err) => {
        this.emit('failed', new ConnectionError(`Failed to initialize client: ${err.message}`, err));
      });
    });
  }

  async destroy() {
    if (this.client) {
      await this.client.destroy();
    }
  }

  async restart() {
    try {
      if (this.client) {
        await this.client.destroy().catch(() => {});
      }
    } catch (_) {}

    this._createClient();
    await this.initialize();
  }

  async sendText(to, message, options = {}) {
    const JID = normalizePhone(to);
    const sentMsg = await this.client.sendMessage(JID, message, options);
    return {
      messageId: sentMsg.id._serialized,
      timestamp: sentMsg.timestamp * 1000
    };
  }

  async _sendNormalizedMedia(to, normalized, options = {}) {
    const JID = normalizePhone(to);
    const wwebMedia = new MessageMedia(normalized.mimetype, normalized.base64, normalized.filename);
    
    const sendOptions = {
      caption: options.caption || undefined,
      sendAudioAsVoice: options.sendAudioAsVoice || undefined,
      ...options
    };

    const sentMsg = await this.client.sendMessage(JID, wwebMedia, sendOptions);
    return {
      messageId: sentMsg.id._serialized,
      timestamp: sentMsg.timestamp * 1000
    };
  }

  async sendMedia(to, media, options = {}) {
    const normalized = await normalizeMedia(media, 'application/octet-stream', options);
    return this._sendNormalizedMedia(to, normalized, options);
  }

  async sendPdf(to, file, options = {}) {
    const normalized = await normalizeMedia(file, 'application/pdf', options);
    return this._sendNormalizedMedia(to, normalized, options);
  }

  async sendImage(to, file, options = {}) {
    const normalized = await normalizeMedia(file, 'image/jpeg', options);
    return this._sendNormalizedMedia(to, normalized, options);
  }

  async sendAudio(to, file, options = {}) {
    const normalized = await normalizeMedia(file, 'audio/mpeg', options);
    const audioOptions = {
      ...options,
      sendAudioAsVoice: options.sendAudioAsVoice ?? false
    };
    return this._sendNormalizedMedia(to, normalized, audioOptions);
  }

  async sendDocument(to, file, options = {}) {
    const normalized = await normalizeMedia(file, 'application/octet-stream', options);
    return this._sendNormalizedMedia(to, normalized, options);
  }

  async sendLocation(to, location, options = {}) {
    const JID = normalizePhone(to);
    const normalized = normalizeLocation(location);
    if (!normalized) {
      throw new Error('Invalid location parameters. latitude and longitude are required.');
    }

    const wwebLocation = new pkg.Location(
      normalized.latitude,
      normalized.longitude,
      normalized.description || ''
    );

    const sentMsg = await this.client.sendMessage(JID, wwebLocation, options);
    return {
      messageId: sentMsg.id._serialized,
      timestamp: sentMsg.timestamp * 1000
    };
  }

  async reactToMessage(messageId, reaction) {
    const msg = await this.client.getMessageById(messageId);
    if (!msg) {
      throw new Error(`Message not found: ${messageId}`);
    }
    await msg.react(reaction);
  }

  getInfo() {
    return {
      adapterVersion,
      qr: this.qr,
      phone: this.phone,
      pushname: this.pushname,
      reason: this.disconnectedReason
    };
  }

  async getState() {
    if (this.client) {
      try {
        const state = await this.client.getState();
        return state;
      } catch (_) {
        return 'disconnected';
      }
    }
    return 'disconnected';
  }

  // --- Optional methods implementation ---

  async listMessages(options = {}) {
    const chatId = normalizePhone(options.chatId);
    if (!chatId) {
      throw new Error('chatId is required to list messages.');
    }
    const chat = await this.client.getChatById(chatId);
    const limit = options.limit || 50;
    const messages = await chat.fetchMessages({ limit });
    return messages
      .map((msg) => normalizeMessage(msg, this.sessionId, 'wwebjs'))
      .filter(Boolean);
  }

  async getMessage(messageId) {
    const msg = await this.client.getMessageById(messageId);
    if (!msg) {
      throw new Error(`Message not found: ${messageId}`);
    }
    return normalizeMessage(msg, this.sessionId, 'wwebjs');
  }

  async getContact(phone) {
    const JID = normalizePhone(phone);
    const contact = await this.client.getContactById(JID);
    let pfp = null;
    try {
      pfp = await this.client.getProfilePicUrl(JID);
    } catch (_) {}
    return normalizeContact(contact, pfp);
  }

  async getContacts(options = {}) {
    const contacts = await this.client.getContacts();
    return contacts.map((contact) => normalizeContact(contact, null)).filter(Boolean);
  }

  async getProfilePicture(phone) {
    const JID = normalizePhone(phone);
    return await this.client.getProfilePicUrl(JID);
  }
}
export default WwebjsSession;
