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

    try {
      const response = await limerickPlease(topic, session);
      return response;
    } catch (ex) {
      console.error('Unhandled limerick exception', ex);
      if (ex instanceof KevinError) return { flavor: ex.flavor };
      else return { flavor: 'I tried, but I just could not come up with a limerick about that. Sorry!' };
    } finally {
      session.save();
    }
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
