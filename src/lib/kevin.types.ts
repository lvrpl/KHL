import type { Tables } from './database.types';

export type Limerick = Tables<'limericks'>;
export type Rejects = Tables<'rejects'>;

export type LimerickResponse = {
  lyrics?: string;
  flavor: string;
  warnings: number;
  nogoSeconds: number;
};
