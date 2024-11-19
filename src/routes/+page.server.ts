import debug from 'debug';

const log = debug('app:home');

export async function load() {
  log('Loading page');
  return { message: 'Hello from the server' };
}
