import type { Cookies } from '@sveltejs/kit';
import debug from 'debug';
import { generateRandomString } from './junk';

const log = debug('app:session');
const COOKIE_NAME = 'kevin-session';

// the data the is put in the cookie
export type SessionData = {
  sessionId: string;
  name: string;
  nCreated: number;
  nRejections: number;
  topics: string[];
  lastCreated: Date | null;
};

export function unpack(text: string): SessionData {
  let obj = null;
  try {
    obj = JSON.parse(text);
  } catch {}
  obj ||= {};
  return {
    sessionId: obj.sessionId || generateRandomString(20),
    name: obj.name || '',
    nCreated: obj.nCreated || 0,
    nRejections: obj.nRejections || 0,
    topics: obj.topics || [],
    lastCreated: obj.lastCreated ? new Date(obj.lastCreated) : null,
  };
}

// class to help manage the session
export class Session {
  data: SessionData;
  save: () => void;

  appendTopic(topic: string) {
    this.data.topics.push(topic);
    while (this.data.topics.length > 10) {
      this.data.topics.shift();
    }
    this.save();
  }

  public constructor(cookies: Cookies) {
    this.data = unpack(cookies.get(COOKIE_NAME) || '{}');
    this.save = () => {
      // URGENT: test what cookie options we might need, try expires
      cookies.set(COOKIE_NAME, JSON.stringify(this.data), { path: '/' });
    };
  }
}
