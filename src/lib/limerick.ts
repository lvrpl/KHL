import { askKevin, askModeration } from './kevin';
import type { LimerickResponse } from './kevin.types';
import type { Session } from './session';
import debug from 'debug';
import { supabase } from './supabaseClient';
import { KevinError, splitLines } from './junk';

const log = debug('app:limerick');

const directionShort = 'keep your response to a few sentences.';
const directionMedium = 'keep your response to a 3-4 sentences.';
const directionLong = 'make your response really drag on for 8 or more sentences.';

type State = {
  topic: string;
  session: Session;
};

type CheckFunction = (state: State) => Promise<LimerickResponse | void | null>;

const stubbedLimerick: CheckFunction = async ({ session }) => {
  session.data.nCreated++;
  return {
    lyrics: `There once was a chap named Kevin Hart
Who took some painkillers to restart
But the side effects were grim
Made him dizzy on a whim
Now he's trippin' and ain't too smart!`,
    flavor: `Hey there, it's me, Kevin Hart, the funniest dude around! Now, painkillers can be a tricky business, let me tell you. It's like trying to be a comedian without any jokes - doesn't work out too well. So, my friend, be careful when you're popping those pills! And remember, laughter is always the best medicine. Speaking of medicine, have you seen my movie "Ride Along"? It's a hilarious action-comedy that'll have you rolling in your seats. Check it out, folks! Keep laughing and be safe!`,
  };
};

const userBanned: CheckFunction = async ({ session }) => {
  if (session.data.nRejections >= 3) {
    const flavor = await askKevin({
      directions: directionShort,
      prompt: 'tell me I have been temporarily banned and cant make limericks',
    });
    return { flavor };
  }
};

const topicTooShort: CheckFunction = async ({ topic, session }) => {
  if (topic.length <= 0) {
    const flavor = await askKevin({
      directions: directionShort,
      prompt:
        'tell someone off for asking for a limerick without entering anything in the prompt. really let them have it.',
    });
    return { flavor };
  }
  if (topic.length <= 3) {
    const flavor = await askKevin({
      directions: directionShort,
      prompt: 'tell someone they need to put more characters in the prompt to generate a limerick.',
    });
    return { flavor };
  }
};

const topicFailsModeration: CheckFunction = async ({ topic, session }) => {
  const { category, scores, score } = await askModeration(topic);
  if (category) {
    const flavor = await askKevin({
      directions: directionMedium,
      prompt: `tell someone they're not allowed to make a limerick about "${topic}"  because its considered ${category}. Write a reprimand to the user and promote something of yours.`,
    });
    supabase.from('rejects').insert({
      topic,
      category,
      score,
      sessionId: session.data.sessionId,
      all: scores,
      flavor,
    });
    session.data.nRejections++;
    return { flavor, reason: category };
  }
};

const actualLimerick: CheckFunction = async ({ topic, session }) => {
  const response = await askKevin({
    directions: [
      'you will write limericks, but you will always include your name in the limerick somewhere, without exception.',
      'after every limerick, introduce yourself and relate to the user about what they wanted the limerick to be about.',
      'then promote yourself in some way by including the name of one of your movies, specials or albums. make sure work a joke or two in there.',
    ],
    prompt: `Write a limerick about this topic: "${topic}".`,
  });
  const lines = splitLines(response);
  if (lines.length < 6)
    throw new KevinError(
      'Invalid Kevin response: ' + response,
      'I tried, but I just could not come up with a limerick about that. Sorry!',
    );
  const lyrics = lines.splice(0, 5).join('\n');
  const flavor = lines.join('\n');
  await supabase.from('limericks').insert({
    topic,
    //scores,
    sessionId: session.data.sessionId,
    lyrics,
    flavor,
  });
  session.data.nCreated++;
  return { lyrics, flavor };
};

const checks: CheckFunction[] = [userBanned, topicTooShort, topicFailsModeration, actualLimerick];

export async function limerickPlease(topic: string, session: Session): Promise<LimerickResponse> {
  for (const check of checks) {
    const result = await check({ topic, session });
    if (result) {
      log(`${check.name} returning`, result);
      return result;
    }
  }

  // backup for now
  return {
    lyrics: `There once was a chap named Kevin Hart
Who took some painkillers to restart
But the side effects were grim
Made him dizzy on a whim
Now he's trippin' and ain't too smart!`,
    flavor: `Hey there, it's me, Kevin Hart, the funniest dude around! Now, painkillers can be a tricky business, let me tell you. It's like trying to be a comedian without any jokes - doesn't work out too well. So, my friend, be careful when you're popping those pills! And remember, laughter is always the best medicine. Speaking of medicine, have you seen my movie "Ride Along"? It's a hilarious action-comedy that'll have you rolling in your seats. Check it out, folks! Keep laughing and be safe!`,
  };
}
