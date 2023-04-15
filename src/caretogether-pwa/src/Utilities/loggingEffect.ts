import { AtomEffect } from "recoil";

export const loggingEffect: AtomEffect<any> = params => {
  const nodeKey = params.node.key;
  console.info(`LOGGING: ${params.node.key}`);
  params.onSet((newValue: any, oldValue: any, isReset: boolean) => {
    console.info(`${isReset ? 'RESET' : 'SET'}: [${nodeKey}]: ${JSON.stringify(newValue)} (was ${JSON.stringify(oldValue)})`);
  });
};
