
type C<T = any> = { new(...a: any[]): T }
type A<T> = T extends { new(...a: infer R): any } ? R : [];
type E<T> = T extends { new(...a: any): infer R } ? R : void;
type R<T, T2> =
  T2 extends undefined
  ? E<T> | undefined
  : T2 extends A<T>
  ? E<T>
  : never

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

  attach(value: any) {
    this.contexts.set(Object.getPrototypeOf(value).constructor, value);
    return this;
  }

  selectContext<T, T2 extends A<T> | undefined>(key: T, defaultAttach?: T2): R<T, T2> {
    const v: R<T, T2> = this.contexts.get(key);

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

  selectContext<T, T2 extends A<T> | undefined>(key: T, defaultAttach?: T2) {
    return this.contextSelected[this.contextSelected.length - 1]?.selectContext(key, defaultAttach)
  }

  private attashContext(context: AppContext) {
    this.contextSelected.push(context)
  }

  private unattashContext() {
    this.contextSelected.pop()
  }

  run(ctx: AppContext, fn: Function) {
    this.attashContext(ctx)
    fn()
    this.unattashContext()
  }

  private static g = new GlobalContaintContext()

  static selectCurrentContext() {
    return this.g.selectCurrentContext()
  }

  static selectContext<T, T2 extends A<T> | undefined>(key: T, defaultAttach?: T2) {
    return this.g.selectContext(key, defaultAttach)
  }

  static run(ctx: AppContext, fn: Function) {
    this.g.run(ctx, fn);
  }
}

/**
 * @alias
 * GlobalContaintContext.selectContext(key, defaultAttach)
 */
export const selectContext = <T, T2 extends A<T> | undefined>(key: T, defaultAttach?: T2) => GlobalContaintContext.selectContext(key, defaultAttach)
/**
 * @alias
 * GlobalContaintContext.run(context, fn)
 */
export const runWithContext = (context: AppContext, fn: Function) => GlobalContaintContext.run(context, fn)

/**
 * @alias
 * GlobalContaintContext.selectCurrentContext()
 */
export const selectCurrentContext = (context: AppContext, fn: Function) => GlobalContaintContext.selectCurrentContext();
