import type { Cookies } from '@sveltejs/kit';
import debug from 'debug';
import { generateRandomString } from './junk';

const log = debug('app:session');
const COOKIE_NAME = 'kevin-session';

// the data the is put in the cookie
export type SessionData = {
  // unique session id created for cookie
  sessionId: string;
  // the name the user last entered when sharing a limerick
  name: string;
  // # of limericks created
  nCreated: number;
  // # of limericks rejected
  nRejections: number;
  // # of consecutive moderation warnings
  nWarnings: number;
  // # of timeouts the user has had
  nTimeouts: number;
  // the last 10 topics the user has entered
  topics: string[];
  // the last 10 function names invoked when of asking for a limerick
  results: string[];
  // the last time a limerick was created
  lastCreated: Date | null;
  // a phobia that was created from a topic
  phobia: string | null;
  // when the user is banned until
  timeoutUntil: Date | null;
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
    nWarnings: obj.nWarnings || 0,
    nTimeouts: obj.nTimeouts || 0,
    topics: obj.topics || [],
    results: obj.results || [],
    lastCreated: obj.lastCreated ? new Date(obj.lastCreated) : null,
    timeoutUntil: obj.timeoutUntil ? new Date(obj.timeoutUntil) : null,
    phobia: obj.phobia || null,
  };
}

// class to help manage the session
export class Session {
  data: SessionData;
  save: () => void;

  inTimeout() {
    return this.data.timeoutUntil && this.data.timeoutUntil.getTime() > Date.now();
  }

  finished(topic: string, result: string) {
    this.data.topics.push(topic);
    while (this.data.topics.length > 10) {
      this.data.topics.shift();
    }
    // URGENT: I like combining multiple things into a result, probably kill topics
    this.data.results.push(`${topic} -> ${result}`);
    while (this.data.results.length > 10) {
      this.data.results.shift();
    }
  }

  public constructor(cookies: Cookies) {
    this.data = unpack(cookies.get(COOKIE_NAME) || '{}');
    this.save = () => {
      // URGENT: test what cookie options we might need, try expires
      // URGENT: test we dont go over max size
      cookies.set(COOKIE_NAME, JSON.stringify(this.data), { path: '/' });
    };
  }
}
