import { AtomEffect, DefaultValue, RecoilState } from "recoil";

// type AtomEffectOnSet<T> = (
//   param: (newValue: T, oldValue: T | DefaultValue, isReset: boolean) => void
// ) => void;
// type AtomEffectParam<T> = {
//   node: RecoilState<T>;
//   onSet: AtomEffectOnSet<T>;
// };

// export const loggingEffect = ({ node, onSet }: AtomEffectParam<any>) => {
//   console.info(`LOGGING: ${node.key}`);
//   onSet((newValue, oldValue, isReset) => {
//     console.info(`${isReset ? 'RESET' : 'SET'}: ${node.key}: '${newValue}' (was '${oldValue}')`);
//   });
// };
// type EffectParams = {
//   node: any,
//   onSet: any
// }

export const loggingEffect: AtomEffect<any> = params => {
  const nodeKey = params.node.key;
  console.info(`LOGGING: ${params.node.key}`);
  params.onSet((newValue: any, oldValue: any, isReset: boolean) => {
    console.info(`${isReset ? 'RESET' : 'SET'}: ${nodeKey}: '${newValue}' (was '${oldValue}')`);
  });
};
