import { askKevin, askModeration, type ModerationResult } from './kevin';
import type { Session } from './session';
import debug from 'debug';
import { supabase } from './supabaseClient';
import { KevinError, splitLines } from './junk';
import { Similarities } from './similarities';

const log = debug('app:limerick');

const directionShort = 'keep your response to a few sentences.';
const directionMedium = 'keep your response to a 3-4 sentences.';
const directionLong = 'make your response really drag on for 8 or more sentences.';

const probabilities = {
  createPhobia: 1,
};

// state shared between functions
type State = {
  similarities?: Similarities;
  moderation?: ModerationResult;
};

// computes the similarities if not already done
async function computeSimilarities(topic: string, state: State, session: Session): Promise<Similarities> {
  if (!state.similarities) {
    const words = [topic];
    if (session.data.phobia) words.push(session.data.phobia);
    state.similarities = await Similarities.find(words);
    log('Similarities', state.similarities);
  }
  return state.similarities;
}

// creates a response for a user that has been warned and possibly get a timeout
async function warnUser(session: Session, reason: string): Promise<CheckResponse> {
  let timeout = false;
  session.data.nWarnings++;
  session.data.nRejections++;
  if (session.data.nWarnings >= 3) {
    session.data.nWarnings = 0;
    session.data.nTimeouts++;
    timeout = true;
  }
  const flavor = await askKevin({
    prompt: timeout
      ? `be outraged and tell the user they got their third and final warning for ${reason} and that they need a timeout.`
      : `be outraged and tell the user they're getting a warning for ${reason}. then newline. say its warning #${session.data.nWarnings} and if they get 3 warnings, tell them they're getting a timeout.`,
  });
  // do this after long running askKevin call
  if (timeout) session.data.timeoutUntil = new Date(Date.now() + 60 * 1000 * session.data.nTimeouts);
  return { flavor };
}

type CheckResponse = {
  greeting?: string;
  lyrics?: string;
  flavor: string;
};
type CheckFunction = {
  (state: { topic: string; state: State; session: Session }): Promise<CheckResponse | void | null>;
  thing?: string;
};

const stubbedLimerick: CheckFunction = async ({ session, state }) => {
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
  if (session.inTimeout()) {
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

const topicTooLong: CheckFunction = async ({ topic, session }) => {
  if (topic.length >= 50) {
    const flavor = await askKevin({
      prompt: 'tell someone off for asking for a limerick with a prompt that is too long.',
    });
    return { flavor };
  }
};

const topicFailsModeration: CheckFunction = async ({ topic, state, session }) => {
  const { category, scores, score } = (state.moderation = await askModeration(topic));
  // URGENT: slightly different prompt if they repeat topic
  if (category) {
    const response = await warnUser(
      session,
      `user tried to make a limerick about ${topic} which is considered ${category}.`,
    );
    supabase.from('rejects').insert({
      topic,
      category,
      score,
      sessionId: session.data.sessionId,
      all: scores,
      flavor: response.flavor,
    });
    return response;
  }
};

const phobiaCreated: CheckFunction = async ({ topic, session }) => {
  if (!session.data.phobia && topic.length >= 4 && Math.random() < probabilities.createPhobia) {
    const flavor = await askKevin({
      prompt: `apologize that you can't make a limerick about ${topic}. then its explain it's because you're scared of ${topic}. suggest to ask for a limerick about something else.`,
    });
    session.data.phobia = topic;
    return { flavor };
  }
};

const phobiaRejected: CheckFunction = async ({ topic, state, session }) => {
  if (!session.data.phobia) return;
  const similarities = await computeSimilarities(topic, state, session);
  if (similarities.getValue(topic, session.data.phobia) > 0.4) {
    return await warnUser(
      session,
      `user tried to make a limerick about ${topic} when you're scared of ${session.data.phobia}.`,
    );
  }
};

const topicRepeated: CheckFunction = async ({ topic, state, session }) => {
  if (topic == session.data.topics.at(-1)) {
    // they did it twice in a row
    if (topic == session.data.topics.at(-2)) {
      return await warnUser(
        session,
        `user wanted you to make a likemick about ${topic} multiple in a row and you hate repeats`,
      );
    } else {
      const flavor = await askKevin({
        prompt: `tell someone off because they just asked you to do a limerick about ${topic} and you dont do repeats. they must not have liked your limerick. then newline. then tell them to ask for a limerick about something else and promote something of yours.`,
      });
      return { flavor };
    }
  }
};

const actualLimerick: CheckFunction = async ({ topic, state, session }) => {
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
    scores: state.moderation?.scores,
    sessionId: session.data.sessionId,
    lyrics,
    flavor,
  });
  session.data.nWarnings = 0;
  session.data.nCreated++;
  session.data.lastCreated = new Date();
  return { lyrics, flavor };
};

const checks: CheckFunction[] = [
  userBanned,
  topicTooShort,
  topicTooLong,
  topicFailsModeration,
  phobiaCreated,
  phobiaRejected,
  topicRepeated,
  actualLimerick,
];

export async function limerickPlease(topic: string, session: Session): Promise<{ lyrics?: string; flavor: string }> {
  const state: State = {};
  for (const check of checks) {
    const result = await check({ topic, state, session });
    if (result) {
      log(`${check.name} returning`, result);
      session.finished(topic, check.name);
      return result;
    }
  }
  throw new KevinError(
    'No successful CheckFunction',
    "Woops, have you heard the one about the limerick that couldn't be made? Well, you're about to!",
  );
}
