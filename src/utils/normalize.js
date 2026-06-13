import fs from 'fs/promises';
import path from 'path';
import { MediaSendError } from '../errors/index.js';

const EXTENSION_MAP = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.html': 'text/html',
  '.json': 'application/json',
  '.zip': 'application/zip',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

const TYPE_MAP = {
  chat: 'text',
  image: 'image',
  video: 'video',
  audio: 'audio',
  ptt: 'audio',
  document: 'document',
  location: 'location',
  vcard: 'contact',
  contact_card: 'contact',
  sticker: 'sticker',
  reaction: 'reaction',
  // System message types in wwebjs
  gp2: 'system',
  broadcast_notification: 'system',
  notification_template: 'system',
  call_log: 'system',
  revoked: 'system'
};

/**
 * Normalizes phone numbers / JIDs.
 * @param {string} phone 
 * @returns {string}
 */
export function normalizePhone(phone) {
  if (typeof phone !== 'string') {
    return '';
  }

  const trimmed = phone.trim();
  
  if (trimmed.endsWith('@c.us') || trimmed.endsWith('@g.us') || trimmed.includes('@')) {
    return trimmed;
  }

  const cleanDigits = trimmed.replace(/\D/g, '');

  if (!cleanDigits) {
    return '';
  }

  return `${cleanDigits}@c.us`;
}

/**
 * Normalizes location object.
 * @param {object} location 
 * @returns {{latitude: number, longitude: number, description: string|null}|null}
 */
export function normalizeLocation(location) {
  if (!location || typeof location !== 'object') {
    return null;
  }

  const latitude = parseFloat(location.latitude);
  const longitude = parseFloat(location.longitude);

  if (isNaN(latitude) || isNaN(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
    description: location.description || null
  };
}

/**
 * Normalizes media inputs (path, Buffer, base64 object) to a unified object.
 * @param {string|Buffer|object} input 
 * @param {string} defaultMime 
 * @param {object} options 
 * @returns {Promise<{base64: string, mimetype: string, filename: string}>}
 */
export async function normalizeMedia(input, defaultMime = 'application/octet-stream', options = {}) {
  try {
    let base64 = '';
    let mimetype = options.mimetype || defaultMime;
    let filename = options.filename || 'file';

    if (input && typeof input === 'object' && !Buffer.isBuffer(input)) {
      if (!input.base64) {
        throw new MediaSendError('Invalid media object: missing base64 data.');
      }
      base64 = input.base64;
      mimetype = input.mimetype || mimetype;
      filename = input.filename || filename;
    } else if (Buffer.isBuffer(input)) {
      base64 = input.toString('base64');
    } else if (typeof input === 'string') {
      try {
        const absolutePath = path.resolve(input);
        const fileBuffer = await fs.readFile(absolutePath);
        base64 = fileBuffer.toString('base64');
        
        const fileExt = path.extname(absolutePath).toLowerCase();
        mimetype = EXTENSION_MAP[fileExt] || mimetype;
        filename = path.basename(absolutePath);
      } catch (err) {
        throw new MediaSendError(`Failed to read media file at path "${input}": ${err.message}`, err);
      }
    } else {
      throw new MediaSendError('Unsupported media input format. Expected path, Buffer, or media object.');
    }

    if (base64.startsWith('data:')) {
      const parts = base64.split(';base64,');
      if (parts.length > 1) {
        base64 = parts[1];
      }
    }

    return {
      base64,
      mimetype,
      filename,
      size: Buffer.from(base64, 'base64').length,
      data: base64,
      encoding: 'base64'
    };
  } catch (error) {
    if (error instanceof MediaSendError) {
      throw error;
    }
    throw new MediaSendError('Failed to normalize media.', error);
  }
}

/**
 * Normalizes contact object from the raw adapter contact.
 * @param {object} contact 
 * @param {string|null} [profilePicture] 
 * @returns {object|null}
 */
export function normalizeContact(contact, profilePicture = null) {
  if (!contact) {
    return null;
  }

  const contactId = contact.id?._serialized || contact.id || '';
  const phone = contact.number || contact.id?.user || '';

  return {
    contactId,
    phone,
    pushname: contact.pushname || null,
    name: contact.name || null,
    shortName: contact.shortName || null,
    isBusiness: !!contact.isBusiness,
    isEnterprise: !!contact.isEnterprise,
    isGroup: !!contact.isGroup || contactId.endsWith('@g.us'),
    profilePicture: profilePicture || null
  };
}

/**
 * Normalizes chat object from the raw adapter chat.
 * @param {object} chat 
 * @returns {object|null}
 */
export function normalizeChat(chat) {
  if (!chat) {
    return null;
  }

  const chatId = chat.id?._serialized || chat.id || '';

  return {
    chatId,
    name: chat.name || null,
    isGroup: !!chat.isGroup || chatId.endsWith('@g.us'),
    unreadCount: typeof chat.unreadCount === 'number' ? chat.unreadCount : 0,
    timestamp: chat.timestamp || Math.floor(Date.now() / 1000)
  };
}

/**
 * Normalizes raw messages from adapter to the standardized WhatsAppMessage model.
 * @param {object} msg 
 * @param {string} sessionId 
 * @param {string} adapterName 
 * @returns {object|null}
 */
export function normalizeMessage(msg, sessionId, adapterName) {
  if (!msg) {
    return null;
  }

  const messageId = msg.id?._serialized || msg.id || '';
  const from = msg.from || '';
  const to = msg.to || '';
  const fromMe = !!msg.fromMe;
  const body = msg.body || '';
  const hasMedia = !!msg.hasMedia;
  const author = msg.author || null;
  const timestamp = msg.timestamp || Math.floor(Date.now() / 1000);
  const ack = typeof msg.ack === 'number' ? msg.ack : null;

  const rawType = msg.type || 'unknown';
  const type = TYPE_MAP[rawType] || 'unknown';

  let location = null;
  if (type === 'location' && msg.location) {
    location = normalizeLocation(msg.location);
  }

  let reaction = null;
  if (msg.reactions && Array.isArray(msg.reactions) && msg.reactions.length > 0) {
    reaction = msg.reactions[0].reaction || null;
  }

  return {
    messageId,
    sessionId,
    adapter: adapterName,
    from,
    to,
    fromMe,
    body,
    type,
    hasMedia,
    author,
    timestamp,
    ack,
    reaction,
    location
  };
}
