import OpenAI from 'openai';
import debug from 'debug';
import type { CreateEmbeddingResponse } from 'openai/resources/embeddings';

const openai = new OpenAI();
const log = debug('app:ai:embeddings');

export class Similarities {
  private values: Record<string, number> = {};

  public constructor(input: string[], output: CreateEmbeddingResponse) {
    for (let i = 0; i < input.length; i++) {
      for (let j = i + 1; j < input.length; j++) {
        const values1 = output.data[i].embedding;
        const values2 = output.data[j].embedding;
        const dotProduct = values1.reduce((sum, value, index) => sum + value * values2[index], 0);
        this.values[this.getKey(input[i], input[j])] = dotProduct;
      }
    }
  }

  private getKey(a: string, b: string): string {
    return a < b ? a + '//' + b : b + '//' + a;
  }

  public getValue(a: string | null, b: string | null): number {
    if (a == null || b == null) return 0;
    return this.values[this.getKey(a, b)];
  }

  public static async find(input: string[]): Promise<Similarities> {
    const result = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input,
      encoding_format: 'float',
    });
    log('Embeddings result', result);
    return new Similarities(input, result);
  }
}
