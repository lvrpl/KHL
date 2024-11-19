export type KevinLimerick = {
  topic: string;
  lyrics: string;
  flavor: string;
};
export function isKevinLimerick(obj: any): obj is KevinLimerick {
  return obj && typeof obj.lyrics === 'string';
}
export type KevinRejection = {
  topic: string;
  reason: string;
  flavor: string;
};
export function isKevinRejection(obj: any): obj is KevinRejection {
  return obj && typeof obj.reason === 'string';
}
