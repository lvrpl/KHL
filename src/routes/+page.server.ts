import { getRandomGreeting, KevinError } from '$lib/junk';
import debug from 'debug';
import OpenAI from 'openai';
import { Session } from '$lib/session';
import { limerickPlease } from '$lib/limerick';
import type { LimerickResponse } from '$lib/kevin.types.js';

const log = debug('app:home');
const openai = new OpenAI();

export async function load({ cookies }) {
  const session = new Session(cookies);
  session.data.nCreated++;
  session.data.lastCreated = new Date();
  session.save();

  return { greeting: getRandomGreeting() /* session: session.data */ };
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
    return {
      warnings: session.data.nWarnings,
      nogoSeconds: session.data.bannedUntil
        ? Math.max(0, Math.floor((session.data.bannedUntil.getTime() - Date.now()) / 1000))
        : 0,
      ...response,
    };
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
