import { makeGreeting, makeLimerick } from '$lib/kevin.js';
import { supabase } from '$lib/supabaseClient.js';
import debug from 'debug';

const log = debug('app:home');

export async function load() {
  const greeting = await makeGreeting();
  return { greeting };
}

export const actions = {
  default: async ({ cookies, request }) => {
    const formData = await request.formData();
    const topic = formData.get('topic') as string;
    const response = await makeLimerick(topic);
    return response;
  },
};
