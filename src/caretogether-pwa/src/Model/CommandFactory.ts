type Command<C, P> = {
  new (data?: P): C;
  fromJS: (params: unknown) => C;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function recursiveToJSON(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (typeof obj.toJSON === 'function') {
    return recursiveToJSON(obj.toJSON());
  }
  if (Array.isArray(obj)) {
    return obj.map(recursiveToJSON);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = recursiveToJSON(value);
  }
  return result;
}

export function commandFactory<C, P>(classRef: Command<C, P>, params: P): C {
  // If input includes nested classes, call all toJSON to normalize everything.
  const args =
    params !== null && params !== undefined ? recursiveToJSON(params) : params;

  return classRef.fromJS(args);
}
