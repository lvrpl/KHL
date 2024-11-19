import { kevin } from '$lib/kevin';
import debug from 'debug';

const log = debug('app:home');

export async function load() {
  return { message: 'This is the server load message.' };
}

export const actions = {
  default: async ({ cookies, request }) => {
    const formData = await request.formData();
    const topic = formData.get('topic') as string;

    const content = await kevin.ask(topic);
    return { message: content };
  },
};
