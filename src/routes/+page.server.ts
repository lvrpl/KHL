import { getRandomGreeting, getWorstScore } from '$lib/junk.js';
import { makeGreeting, makeLimerick, makeReprimand } from '$lib/kevin.js';
import debug from 'debug';
import OpenAI from 'openai';

const log = debug('app:home');
const openai = new OpenAI();

export async function load() {
  return { greeting: getRandomGreeting() };
}

export const actions = {
  default: async ({ cookies, request }) => {
    const formData = await request.formData();
    const topic = formData.get('topic') as string;

    const moderation = await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: topic,
    });
    const scores = moderation.results[0].category_scores;
    const { over, category } = getWorstScore(scores);
    log('scores for ' + topic, category + ' ' + over, scores);

    if (over > 0) {
      const reprimand = await makeReprimand(topic, category);
      return { topic, reason: category, flavor: reprimand };
    } else {
      const response = await makeLimerick(topic);
      return response;
    }
  },
};
