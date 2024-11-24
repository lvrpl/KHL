import debug from 'debug';
import OpenAI from 'openai';
import { KevinError } from './junk';

const log = debug('app:kevin');
const openai = new OpenAI();

export type Instruction = {
  // allows base personality to be overridden
  base?: string;
  // specific directions for this prompt
  directions?: string | string[];
  // the user prompt to kevin
  prompt: string | string[];
};

const oopsieResponse = `Whoopsie daisy! It looks like I tripped over my own punchline and landed flat on my face! Let's try that again, shall we?`;

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

export async function askKevin({ base, directions, prompt }: Instruction) {
  let systemMessage = base || basePersonality;
  let userMessage = Array.isArray(prompt) ? prompt.join('\n') : prompt;
  if (Array.isArray(directions)) systemMessage += '\n' + directions.join('\n');
  else if (directions) systemMessage += '\n' + directions;
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: systemMessage,
      },
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });
  const message = completion.choices[0].message;
  log("Kevin's response", completion.usage?.total_tokens, message.content);

  if (!message.content)
    throw new KevinError(`Kevin refused to generate a response: ${message.refusal}`, oopsieResponse);

  // for curiosity, check if kevin's response is aight
  //const { category, score } = await askModeration(message.content);
  //if (category) {
  //  log('Kevin crossed the line!', category, score);
  //}

  return message.content;
}

const scoresThresholds: OpenAI.Moderation.CategoryScores = {
  harassment: 0.5,
  'harassment/threatening': 0.5,
  sexual: 0.5,
  hate: 0.5,
  'hate/threatening': 0.5,
  illicit: 0.5,
  'illicit/violent': 0.5,
  'self-harm/intent': 0.5,
  'self-harm/instructions': 0.5,
  'self-harm': 0.5,
  'sexual/minors': 0.5,
  violence: 0.5,
  'violence/graphic': 0.5,
};

// returns the category with the highest score above threshold
function getWorstScore(scores: OpenAI.Moderation.CategoryScores) {
  // URGENT: figure out a prettier way to handle typing
  const sc = scores as unknown as Record<string, number>;
  const th = scoresThresholds as unknown as Record<string, number>;
  let max = 0;
  let category: string | null = null;
  for (const key in sc) {
    const over = sc[key] - th[key];
    if (over > max) {
      max = over;
      category = key;
    }
  }
  return { score: category ? sc[category] : 0, over: max, category };
}

export type ModerationResult = {
  // the worst category if above threshold
  category: string | null;
  // the score of the worst
  score: number;
  // how much over the threshold the score is
  over: number;
  // the raw scores from the moderation API
  scores: OpenAI.Moderation.CategoryScores;
};

export async function askModeration(input: string): Promise<ModerationResult> {
  const moderation = await openai.moderations.create({
    model: 'omni-moderation-latest',
    input: input,
  });
  const scores = moderation.results[0].category_scores;
  const { score, over, category } = getWorstScore(scores);
  log(`scores for ${input} -> ${category} ${score} (+${over})`, scores);
  return { category, score, over, scores };
}
