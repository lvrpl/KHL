import { getRandomGreeting, getWorstScore } from '$lib/junk';
import { makeLimerick, makeReprimand } from '$lib/kevin';
import debug from 'debug';
import OpenAI from 'openai';
import { supabase } from '$lib/supabaseClient';
import { Session } from '$lib/session';

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
  share: async ({ cookies, request }) => {
    const session = new Session(cookies);
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const id = formData.get('id') as string;

    return {
      success: true,
    };
  },

  limerick: async ({ cookies, request }) => {
    const session = new Session(cookies);
    const formData = await request.formData();
    const topic = formData.get('topic') as string;

    session.appendTopic(topic);
    session.save();

    return {
      topic,
      lyrics: `There once was a chap named Kevin Hart
Who took some painkillers to restart
But the side effects were grim
Made him dizzy on a whim
Now he's trippin' and ain't too smart!`,
      flavor: `Hey there, it's me, Kevin Hart, the funniest dude around! Now, painkillers can be a tricky business, let me tell you. It's like trying to be a comedian without any jokes - doesn't work out too well. So, my friend, be careful when you're popping those pills! And remember, laughter is always the best medicine. Speaking of medicine, have you seen my movie "Ride Along"? It's a hilarious action-comedy that'll have you rolling in your seats. Check it out, folks! Keep laughing and be safe!`,
    };

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
