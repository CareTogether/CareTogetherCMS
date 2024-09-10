import { AtomEffect } from 'recoil';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const loggingEffect: AtomEffect<any> = (params) => {
  const nodeKey = params.node.key;
  console.info(`LOGGING: ${params.node.key}`);
  params.onSet((newValue: unknown, oldValue: unknown, isReset: boolean) => {
    console.info(
      `${isReset ? 'RESET' : 'SET'}: [${nodeKey}]: ${JSON.stringify(newValue)} (was ${JSON.stringify(oldValue)})`
    );
  });
};
