import 'reflect-metadata';

type C<T = any> = { new(...a: any[]): T }
type A<T> = T extends { new(...a: infer R): any } ? R : [];
type E<T> = T extends { new(...a: any): infer R } ? R : void;
type R<T, T2> =
  T2 extends undefined
  ? E<T> | undefined
  : T2 extends A<T>
  ? E<T>
  : never
type token = string | Symbol | Object
type attachArgs<T> =
  | [T]
  | [token, T]
type selectContextArgs<T, T2 extends A<T> | undefined> =
  | [T | token]
  | [T, T2]
  | [token, T, T2]

const attachArgsToAttachOptions = <T>(...args: attachArgs<T>) => {
  if (args.length === 1) {
    const [value] = args
    return {
      value,
      token: Object.getPrototypeOf(value).constructor,
    }
  } else if (args.length === 2) {
    const [token, value] = args
    return {
      value,
      token,
    }
  }
  throw new TypeError('Cannot found token')
}

const selectContextArgsToSelectContextOptions = <T, T2 extends A<T> | undefined>(...args: selectContextArgs<T, T2>): { token: token, key?: T, defaultAttach?: T2 } => {
  switch (args.length) {
    case 1: return {
      token: args[0],
    }
    case 2: return {
      token: args[0],
      key: args[0],
      defaultAttach: args[1],
    }
    case 3: return {
      token: args[0],
      key: args[1],
      defaultAttach: args[2],
    }
    default: throw new TypeError('')
  }
}

const isClass = (a: any): a is { new(...a: any[]): any } => typeof Object.getPrototypeOf(a)?.constructor === 'function'

export class AppContext {
  private contexts: Map<any, any>;

  /**
   * @param appContext Use other app context to clone refs
   */
  constructor(appContext?: AppContext) {
    this.contexts = appContext
      ? new Map(appContext.contexts.entries())
      : new Map()
  }

  attach<T>(...args: attachArgs<T>) {
    const { token, value } = attachArgsToAttachOptions(...args)
    this.contexts.set(token, value);
    return this;
  }

  selectContext<T, T2 extends A<T> | undefined>(...args: selectContextArgs<T, T2>): R<T, T2> {
    const { token, key, defaultAttach } = selectContextArgsToSelectContextOptions(...args)
    const v: R<T, T2> = this.contexts.get(token);

    if (v) return v;

    if (typeof defaultAttach !== 'undefined') {
      if (isClass(key)) {
        const nv: R<T, T2> = new key(...defaultAttach ?? []);
        this.contexts.set(key, nv);
        return nv;
      }
    }

    return undefined as R<T, T2>
  }

  static GlobalContext = Symbol('AppContext.GlobalContext')
}

export class GlobalContaintContext {
  private contextSelected: AppContext[] = []

  selectCurrentContext(): AppContext | undefined {
    return this.contextSelected[this.contextSelected.length - 1];
  }

  selectContext<T, T2 extends A<T> | undefined>(...args: selectContextArgs<T, T2>) {
    return this.contextSelected[this.contextSelected.length - 1]?.selectContext(...args)
  }

  private attashContext(context: AppContext) {
    this.contextSelected.push(context)
  }

  private unattashContext() {
    this.contextSelected.pop()
  }

  run<T>(ctx: AppContext, fn: () => T) {
    this.attashContext(ctx)
    const rfn = fn()
    this.unattashContext()
    return rfn
  }

  private static g = new GlobalContaintContext()

  static selectCurrentContext() {
    return this.g.selectCurrentContext()
  }

  static selectContext<T, T2 extends A<T> | undefined>(...args: selectContextArgs<T, T2>) {
    return this.g.selectContext(...args)
  }

  static run<T>(ctx: AppContext, fn: () => T) {
    return this.g.run(ctx, fn);
  }
}

/**
 * @alias
 * GlobalContaintContext.selectContext(key, defaultAttach)
 */
export const selectContext = <T, T2 extends A<T> | undefined>(...args: selectContextArgs<T, T2>) => GlobalContaintContext.selectContext(...args)
/**
 * @alias
 * GlobalContaintContext.run(context, fn)
 */
export const runWithContext = <T>(ctx: AppContext, fn: () => T) => GlobalContaintContext.run(ctx, fn)

/**
 * @alias
 * GlobalContaintContext.selectCurrentContext()
 */
export const selectCurrentContext = (context: AppContext, fn: Function) => GlobalContaintContext.selectCurrentContext();

const MetadataValuesSymbol = Symbol('Symbol(MetadataValuesSymbol)')

type MetadataValue<T> = {
  type: T
  key: string | symbol
  paramIndex: number
}

const getMetadataValues = <T>(target: any): MetadataValue<T>[] => Reflect.getMetadata(MetadataValuesSymbol, target) ?? []
const addMetadataValue = <T>(target: any, metadataValue: MetadataValue<T>) => {
  const premetadataValues = getMetadataValues(target)
  Reflect.defineMetadata(MetadataValuesSymbol, [metadataValue, ...premetadataValues], target)
}

export const declareSelectContext = <A>(type: A): ParameterDecorator => (target, key, paramIndex) => addMetadataValue(target, {
  key,
  paramIndex,
  type,
});

export const withContext = (g?: GlobalContaintContext) => (target: any): any => {
  const metadataValues = getMetadataValues<any>(target)

  return class extends target {
    constructor(...args: any[]) {
      for (const metadataValue of metadataValues) {
        args[metadataValue.paramIndex] = args[metadataValue.paramIndex] ?? (g ? g.selectContext(metadataValue.type) : selectContext(metadataValue.type))
      }
      super(...args)
    }
  }
}
