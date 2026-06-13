export class WhatsAppError extends Error {
  constructor(message, status = 500, code = 'WHATSAPP_ERROR', details = null, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class SessionNotFoundError extends WhatsAppError {
  constructor(sessionId, details = null) {
    super(`Session "${sessionId}" not found.`, 404, 'SESSION_NOT_FOUND', details, true);
  }
}

export class SessionAlreadyExistsError extends WhatsAppError {
  constructor(sessionId, details = null) {
    super(`Session "${sessionId}" already exists.`, 409, 'SESSION_ALREADY_EXISTS', details, true);
  }
}

export class SessionNotReadyError extends WhatsAppError {
  constructor(sessionId, details = null) {
    super(`Session "${sessionId}" is not ready.`, 400, 'SESSION_NOT_READY', details, true);
  }
}

export class InvalidPhoneError extends WhatsAppError {
  constructor(phone, details = null) {
    super(`Invalid phone number format: "${phone}".`, 400, 'INVALID_PHONE', details, true);
  }
}

export class AuthenticationError extends WhatsAppError {
  constructor(message, details = null) {
    super(message || 'Authentication failed.', 401, 'AUTHENTICATION_ERROR', details, true);
  }
}

export class ConnectionError extends WhatsAppError {
  constructor(message, details = null) {
    super(message || 'Connection failed.', 503, 'CONNECTION_ERROR', details, true);
  }
}

export class MediaSendError extends WhatsAppError {
  constructor(message, details = null) {
    super(message || 'Failed to send media.', 400, 'MEDIA_SEND_ERROR', details, true);
  }
}

export class AdapterNotSupportedError extends WhatsAppError {
  constructor(adapterName, details = null) {
    super(`Adapter "${adapterName}" is not supported.`, 400, 'ADAPTER_NOT_SUPPORTED', details, true);
  }
}

export class AdapterMethodNotSupportedError extends WhatsAppError {
  constructor(methodName, adapterName, details = null) {
    super(`Method "${methodName}" is not supported by adapter "${adapterName}".`, 400, 'ADAPTER_METHOD_NOT_SUPPORTED', details, true);
  }
}
