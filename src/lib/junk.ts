// takes a string and splits it into lines, trimming whitespace and removing empty lines
export function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

export const suggestions = [
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
