type Command<C, P> = {
  new (data?: P): C;
  fromJS: (params: unknown) => C;
};

export function commandFactory<C, P>(classRef: Command<C, P>, params: P): C {
  return classRef.fromJS(params);
}
