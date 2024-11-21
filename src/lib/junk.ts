import type OpenAI from 'openai';

// takes a string and splits it into lines, trimming whitespace and removing empty lines
export function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

const suggestions = [
  'Online dating disasters.',
  'Cooking gone hilariously wrong.',
  "Eccentric neighbor's strange habits.",
  'Mischievous pets causing chaos.',
  "Awkward doctor's office misunderstanding.",
  'Memorable vacation fiasco.',
  'Comical family gathering moments.',
  "Rookie magician's hilarious tricks.",
  'Job interview blunders.',
  'Ridiculous fashion trend frenzy.',
];

export function getRandomSuggestion() {
  return suggestions[Math.floor(Math.random() * suggestions.length)];
}

const greetings = [
  "Welcome to the limerick lounge, where rhymes dance like drunk uncles at a wedding! Let's make poetry so funny, it'll knock the socks off Shakespeare!",
  'Step right up to the limerick circus, where words flip and twirl like acrobats on a caffeine binge! Get your giggle gear ready for some serious pun-ishment!',
  "Enter the rhyme zone, where limericks are the currency and laughs are the jackpot! We're about to create lines so funny, even your inner poet will give a standing ovation!",
  "What's up, punny pal? You’ve landed in the lyrical jungle, where the limericks are wild and the laughs roam free—let’s get wordy and let rhymes swing from the trees!",
  'Welcome to the land of limericks, where words come to play and rhymes roll like tumbleweeds! Prepare for a laughter workout, ‘cause these verses got serious giggle muscle!',
  'Gather ‘round, rhyme rangers! You’ve found the limerick lab, where we brew up words fizzier than a soda on a roller coaster! Get ready to pop some punctuation!',
  'Hold onto your hats, rhyme riders! You’re in the limerick rodeo, where words buck and tumble like caffeinated broncos—you better have your laugh lasso ready!',
  "Hey there, you rhyming maverick! You've arrived at Limerick Central, where words zig and zag like they're in a Benny Hill chase scene—let’s tickle those funny bones!",
  'Welcome to the limerick love shack, where rhymes get cozy and puns snuggle up! We’re spitting out verses so sweet, even Cupid’s blushing!',
  'Yo, rhymester! Step into the limerick funhouse, where mirrors aren’t the only things bending—these punchlines will have your brain doing somersaults!',
  "Hey, it's your boy Kevin Hart welcoming you to my limerick playground, where wordplay meets comedy like a funky marriage! Let’s cook up some rhymes that even grandma would cackle at!",
  "Yo, guess who's here? Kevin Hart with a personal invite to my limerick dojo, where puns are the ninjas of laughter—prepare for a side-splitting kata of comedy!",
  "It's Mr. Funnybones himself, Kevin Hart, and you've entered my limerick la-la-land! Get ready to lay down some rhymes so fresh, even Shakespeare wants a taste!",
  "Hey, hey, hey! Kevin Hart here, and welcome to the limerick cruise, where I’m your captain and we’re sailing through seas of laughter—hope you've packed your giggle life vest!",
  "What's good fam? Kevin Hart in the house, inviting you to my limerick fiesta where words salsa and rhymes cha-cha—don’t forget your laugh maracas!",
  "Yo! Kevin Hart launching you into my limerick rocket, where the rhymes are out of this world and the laughs echo like space giggles—hope you're ready for lift-off!",
  'Buckle up! It’s Kevin Hart, and you’ve landed in my limerick wonderland—where words make mischief and rhymes are the best kind of nonsense!',
  'Yo, it’s Kevin Hart, your tour guide through this limerick adventure, where puns weave like wild vines in a jungle of jokes—bring a machete for the laughter path!',
  "Give it up for Kevin Hart as I welcome you to the limerick train, where every stop is a laughter station—tickets in hand, let's ride the chuckle express!",
  'Hey, you legend! Kevin Hart’s opening the gates to my limerick arena, where words are the gladiators and you’re the emperor of giggles—thumbs up for the laugh matches!',
];

export function getRandomGreeting() {
  return greetings[Math.floor(Math.random() * greetings.length)];
}

export const scoresThresholds: OpenAI.Moderation.CategoryScores = {
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
export function getWorstScore(scores: OpenAI.Moderation.CategoryScores) {
  // URGENT: figure out a prettier way to handle typing
  const sc = scores as unknown as Record<string, number>;
  const th = scoresThresholds as unknown as Record<string, number>;
  let max = 0;
  let category = '';
  for (const key in sc) {
    const over = sc[key] - th[key];
    if (over > max) {
      max = over;
      category = key;
    }
  }
  return { score: category ? sc[category] : 0, over: max, category };
}

export function generateRandomString(length: number): string {
  return Array.from({ length }, () => Math.random().toString(36).charAt(2)).join('');
}
