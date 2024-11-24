import { getRandomGreeting, getRandomGreetingTimeout, getRandomGreetingTimeoutOver, KevinError } from '$lib/junk';
import debug from 'debug';
import { Session } from '$lib/session';
import { limerickPlease } from '$lib/limerick';
import type { KevinState, LimerickResponse } from '$lib/kevin.types.js';

const log = debug('app:home');

function includeState<T>(session: Session, data: T): T & KevinState {
  return {
    ...data,
    warnings: session.data.nWarnings,
    timeout: session.data.timeoutUntil
      ? Math.max(0, Math.floor((session.data.timeoutUntil.getTime() - Date.now()) / 1000))
      : 0,
  };
}

export async function load({ cookies }) {
  const session = new Session(cookies);

  let greeting: string;
  if (session.inTimeout()) {
    greeting = getRandomGreetingTimeout();
  } else if (session.data.timeoutUntil) {
    session.data.timeoutUntil = null;
    greeting = getRandomGreetingTimeoutOver();
  } else {
    greeting = getRandomGreeting();
  }

  session.save();
  return includeState(session, { greeting });
}

export const actions = {
  limerick: async ({ cookies, request }): Promise<LimerickResponse> => {
    const session = new Session(cookies);
    const formData = await request.formData();
    const topic = (formData.get('topic') as string).trim();

    let response: { lyrics?: string; flavor: string };
    try {
      response = await limerickPlease(topic, session);
    } catch (ex) {
      console.error('Unhandled limerick exception', ex);
      response = {
        flavor:
          ex instanceof KevinError
            ? ex.flavor
            : "There once was a dev who wrote code\nBut the limerick server did explode\nThe error was a fright\nIt was a KevinError, right?\nNow the dev's in a debugging mode!",
      };
    }

    session.save();
    return includeState(session, response);
  },

  share: async ({ cookies, request }) => {
    const session = new Session(cookies);
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const id = formData.get('id') as string;

    return {
      success: true,
    };
  },
};
