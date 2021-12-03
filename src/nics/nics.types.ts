export interface ArpHost {
  ip: string,
  mac: string
}

export interface HostStatus {
  address: string,
  alive: boolean,
  hostname: string
}

export class MissingNicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissingNicError';
  }
}

export class SourceIPError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SourceIPError';
  }
}

export class ArpTableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ArpTableError';
  }
}