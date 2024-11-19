import debug from 'debug';

(globalThis as any).d = debug;
debug.log = console.log.bind(console); // this will output to DEBUG CONSOLE in VSCode
