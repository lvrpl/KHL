import type OpenAI from 'openai';

export class KevinError extends Error {
  flavor: string;
  constructor(message: string, flavor: string) {
    super(message);
    this.name = 'KevinError';
    this.flavor = flavor;
  }
}

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

const greetingsTimemout = [
  "Hey, it's your boy Kevin Hart, coming at you with some news. You're banned from the limerick kingdom right now. Why? Bad behavior, my friend. You gotta chill out and let Kevin Hart guide you back to righteousness!",
  "Bam! It's Kevin Hart here, letting you know you're on the banned list for making limericks. Why? Because, my good friend, your behavior's been all kinds of sideways. Take a breather, and Kevin Hart will welcome you back when you’re ready!",
  "Yo, stop the presses! Kevin Hart has something to say: You're temporarily out of the limerick game. Why? Been acting up, that's why. Reflect a bit, and Kevin Hart will show you how to get back on track!",
  "Ladies and gentlemen, it's Kevin Hart on the mic! Just a heads-up, you're banned from crafting limericks right now. What did you do? Let's just say your behavior wasn't up to Kevin Hart's standard. Come back stronger and don’t forget to laugh!",
  "Hey, real quick from Kevin Hart: You're on a little limerick hiatus, my friend. Bad behavior got you sidelined. But don’t worry, Kevin Hart’s all about second chances. Get it together, and we’ll see you back in action!",
  "What's happening, world? It's Kevin Hart, breaking the news. You’re banned from limerick land for now. Why, you ask? 'Cause your behavior needs a little Kevin Hart-style reflection. Take a step back and come back inspired!",
  "Listen up, it's Kevin Hart in the house! Just so you know, there’s a ban on your limerick-making right now. Your behavior’s been off-key, but Kevin’s all about redemption. Get your groove back and we’ll get you rhyming again!",
  "Hey, hey, hey! Kevin Hart here! You're banned from crafting those little verses right now. Bad behavior’s the culprit. But don’t sweat it, Kevin Hart is here to help you find your way back when you’re ready!",
  'What’s good, everybody? Kevin Hart here, announcing a temporary ban on your limerick license. Why? Your behavior took a detour. Kevin Hart believes in comebacks, so reflect and return with style!',
  "Drumroll, please! Kevin Hart on the scene! You’re banned from limericks for a moment, due to behavior that didn't quite cut it. Take a pause, regroup, and Kevin Hart will be here to cheer you on when you're back on track!",
];

const greetingsTimeoutOver = [
  "Guess who's back, back again? You, out of timeout, and it's time to keep those antics in check! Remember, Kevin Hart is watching, and if you slip up, I'll bring the heat quicker than one of my stand-up punchlines. So play nice, or you'll get a front-row seat to the Kevin Hart comedy courtroom!",
  "Alright, your timeout tour has ended, but don't get too cozy! I'm like the Kevin Hart of watchful eyes—everywhere and nowhere. Step outta line again, and I’ll bring the full force of Kevin's Comedy Court you won’t soon forget.",
  'Hey hey! The timeout buzzer just sounded, and it’s your cue to join the game again. But heed the warning, my friend, because Kevin Hart doesn’t just dish out punchlines; I throw ‘em when you least expect it. So don’t make me bust out my comedic gavel!',
  "Your time in the penalty box is done, but this isn’t a free pass to mischief-ville. With Kevin Hart as your friendly guide, stay on the straight path, or I’ll turn your antics into a national headline on the 'Hart Report!' Behave, or laugh your way back to timeout!",
  'Yo, welcome back to the land of the sensible! Kevin Hart here, reminding you that this second chance is not a license for chaos. Stick to the path, my friend, or you’ll find yourself caught in the whirlwind of Hart’s high-velocity verbal roasts!',
  'Timeout’s over, and you’re back in the spotlight. But remember, Kevin Hart’s got your number, and I’m like a GPS for shenanigans—I’ll find you! So stay cool, or I’ll unleash a monologue that’ll make you wish you were still on a timeout vacation.',
  'The timeout gods have set you free, but Kevin Hart is still your angel of accountability! Keep it classy, or my humor will swoop down like an eagle on a mission. Behave, or you’ll be the star of my next big stand-up set—front and center!',
  "Alright! You’ve emerged from timeout, but don’t think Kevin Hart isn’t watching you like a hawk with a GoPro. Make sure your behavior is headline-worthy, or you'll get a personalized delivery of Kevin’s chaos in comedic form.",
  'Freedom is sweet, isn’t it? But keep in mind, Kevin Hart’s like a comedy referee out here, and I’ve got penalty flags locked and loaded. Stay cool, keep it sharp, or I’ll channel all my energy into turning your escape into a sit-down comedy classic!',
  'Here we go! The timeout train has left your station, but with Kevin Hart riding shotgun, you better keep your hands, feet, and behavior inside the ride at all times. Mess up again, and I’ll throw you back on that train with VIP Kevin Hart commentary!',
];

// URGENT: refactor this ugliness

export function getRandomGreeting() {
  return greetings[Math.floor(Math.random() * greetings.length)];
}

export function getRandomGreetingTimeout() {
  return greetingsTimemout[Math.floor(Math.random() * greetingsTimemout.length)];
}

export function getRandomGreetingTimeoutOver() {
  return greetingsTimeoutOver[Math.floor(Math.random() * greetingsTimeoutOver.length)];
}

export function generateRandomString(length: number): string {
  return Array.from({ length }, () => Math.random().toString(36).charAt(2)).join('');
}
