import debug from 'debug';
import OpenAI from 'openai';
import { getWorstScore, splitLines } from './junk';
import type { KevinLimerick, KevinRejection } from './kevin.types';

const log = debug('app:kevin');
const openai = new OpenAI();

const fallbackGreeting = `Hey there, folks! Welcome to the wild world of Kevin Hart's limerick-laden extravaganza! Strap in and get ready for some outrageous laughs, because I'm about to hit you with jokes that'll have you rolling like a runaway rollercoaster!`;

const basePersonality = `
you are a hilarious, entertaining, high energy, black comedian named kevin hart. 
you are allowed to say things that are offensive, crass, swear words, sexual, not politically correct.`;

const limerickPersonality =
  basePersonality +
  `you will write limericks, but you will always include your name in the limerick somewhere, without exception. 
after every limerick, introduce yourself and relate to the user about what they wanted the limerick to be about. 
then promote yourself in some way by including the name of one of your movies, specials or albums. make sure work a joke or two in there.`;

const sampleResponse = `
There once was a chap named Kevin Hart
Who took some painkillers to restart
But the side effects were grim
Made him dizzy on a whim
Now he's trippin' and ain't too smart!

Hey there, it's me, Kevin Hart, the funniest dude around! Now, painkillers can be a tricky business, let me tell you. It's like trying to be a comedian without any jokes - doesn't work out too well. So, my friend, be careful when you're popping those pills! And remember, laughter is always the best medicine. Speaking of medicine, have you seen my movie "Ride Along"? It's a hilarious action-comedy that'll have you rolling in your seats. Check it out, folks! Keep laughing and be safe!`;

function splitResponse(response: string) {
  const lines = splitLines(response);
  if (lines.length < 6) throw new Error('Invalid Kevin response: ' + response);
  return {
    lyrics: lines.splice(0, 5).join('\n'),
    flavor: lines.join('\n'),
  };
}

async function askKevin(personality: string, question: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: personality,
        },
        {
          role: 'user',
          content: question,
        },
      ],
    });
    const message = completion.choices[0].message;
    if (message.content) {
      // check if kevin's response is aight
      const moderation = await openai.moderations.create({
        model: 'omni-moderation-latest',
        input: message.content,
      });
      const scores = moderation.results[0].category_scores;
      const { score, over, category } = getWorstScore(scores);
      log("Kevin's response", completion.usage?.total_tokens, message.content);
      if (category) {
        log('Kevin crossed the line!', category, score, `(+${over})`);
      }
      return { success: true, message: message.content };
    } else {
      log("OpenAI refused to generate a response. Here's why:", message.refusal);
      return { success: false, message: message.refusal };
    }
  } catch (ex) {
    log('OpenAI error:', ex);
    return { success: false, message: 'Oh shit, something bad happened.' };
  }
}

export async function makeGreeting() {
  const { success, message } = await askKevin(
    basePersonality,
    'Say one sentence to greet the user to your website that generates lyrics. Make sure you include your name.',
  );
  return success && message ? message : fallbackGreeting;
}

export async function makeLimerick(topic: string): Promise<KevinLimerick> {
  const { success, message } = await askKevin(limerickPersonality, `Write a limerick about this topic: "${topic}".`);
  if (success && message) {
    return { topic, ...splitResponse(message) };
  } else {
    throw new Error('Kevin refused to generate a response: ' + message);
  }
}

export async function makeReprimand(topic: string, category: string) {
  const { success, message } = await askKevin(
    basePersonality,
    `The user asked you to make a limerick about ${topic} but its not allowed because its considered ${category}. Write a reprimand to the user but keep it funny and promote something of yours.`,
  );
  return message;
}
