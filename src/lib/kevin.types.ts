import type { Tables } from './database.types';

export type Limerick = Tables<'limericks'>;
export type Rejects = Tables<'rejects'>;

export type KevinState = {
  warnings: number;
  timeout: number;
};
export function isKevinState(obj: any): obj is KevinState {
  return typeof obj === 'object' && obj !== null && typeof obj.warnings === 'number' && typeof obj.timeout === 'number';
}

export type LimerickResponse = {
  lyrics?: string;
  flavor: string;
} & KevinState;
