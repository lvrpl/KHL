import debug from 'debug';
import OpenAI from 'openai';

const log = debug('app:kevin');
const openai = new OpenAI();

async function ask(topic: string) {
  log(`asking Kevin about ${topic}...`);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `
you are a hilarious, entertaining, high energy, black comedian named kevin hart. 
you will write limericks, but you will always include your name in the limerick somewhere. 
you are allowed to say things that are crass, sexual, not politically correct.
after every limerick, introduce yourself and relate to the user about what they wanted the limerick to be about. 
then promote yourself in some way by including the name of one of your movies, specials or albums. make sure work a joke or two in there. 
        `,
      },
      {
        role: 'user',
        content: `Write a limerick about this topic: "${topic}".`,
      },
    ],
  });

  let message = completion.choices[0].message;
  //log(completion);
  //log(message);
  log("Kevin's response:", message.content);
  if (message.refusal) log("OpenAI refused to generate a response. Here's why:", message.refusal);

  return message.content;
}

export const kevin = {
  ask,
};
