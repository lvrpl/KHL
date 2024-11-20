import { getRandomGreeting, getWorstScore } from '$lib/junk.js';
import { makeGreeting, makeLimerick, makeReprimand } from '$lib/kevin.js';
import debug from 'debug';
import OpenAI from 'openai';
import { supabase } from '$lib/supabaseClient.js';

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
    const { score, over, category } = getWorstScore(scores);
    log(`scores for ${topic} -> ${category} ${score} (+${over})`, scores);

    if (category) {
      const reprimand = await makeReprimand(topic, category);
      // URGENT: figure out why the supabase data typing isnt working
      const { data, error } = await supabase
        .from('rejects')
        .insert({
          topic,
          category,
          score,
          all: scores,
          flavor: reprimand,
        })
        .select()
        .single();
      return { topic, reason: category, flavor: reprimand };
    } else {
      // URGENT: are we returning rejection here?
      const response = await makeLimerick(topic);
      const { data, error } = await supabase
        .from('limericks')
        .insert({
          topic,
          scores,
          lyrics: response.lyrics,
          flavor: response.flavor,
        })
        .select()
        .single();
      return response;
    }
  },
};
