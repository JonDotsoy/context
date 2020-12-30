import { AppContext, GlobalContaintContext, runWithContext, selectContext } from "./AppContext"

class Person {
  constructor(
    readonly name: string,
    readonly age: number
  ) { }
}

describe('AppContext', () => {

  it('Single app context', () => {
    const ctx = new AppContext()

    ctx.attach(new Person('Juan', 32))

    expect(ctx.selectContext(Person)).toBeInstanceOf(Person)
  })

  it('select context and defualt properti', () => {
    const ctx = new AppContext()

    const a1 = ctx.selectContext(Person)
    const a2 = ctx.selectContext(Person, ['name', 32])

    expect(a1).toBeUndefined()
    expect(a2).toBeInstanceOf(Person)
  })

  it('global app context by multi level', () => {
    const fn = jest.fn()
    const g = new GlobalContaintContext()

    const ctxa = new AppContext()
    const ctxb = new AppContext()

    ctxb.attach(new Person('Jupiter', 3e12))
    ctxa.attach(new Person('Jack', 45))

    g.run(ctxa, () => {
      fn(g.selectContext(Person))

      g.run(ctxb, () => {
        fn(g.selectContext(Person))

        g.run(ctxa, () => {
          fn(g.selectContext(Person))

          g.run(ctxb, () => {
            fn(g.selectContext(Person))
          })
        })
      })

      fn(g.selectContext(Person))
    })

    expect(fn.mock.calls[0][0].name).toEqual('Jack')
    expect(fn.mock.calls[1][0].name).toEqual('Jupiter')
    expect(fn.mock.calls[2][0].name).toEqual('Jack')
    expect(fn.mock.calls[3][0].name).toEqual('Jupiter')
    expect(fn.mock.calls[4][0].name).toEqual('Jack')
  });

  describe('useContext', () => {

    it('without context', () => {
      const fnmock = jest.fn()

      const script = () => {
        const ab = selectContext(Person)

        fnmock(ab)
      }

      script()

      expect(fnmock.mock.calls[0][0]).toBeUndefined()

    })

    it('use multi contexts', () => {
      const fnmock = jest.fn()

      const ctx1 = new AppContext()
      ctx1.attach(new Person('Maria', 26))
      const ctx2 = new AppContext()
      ctx2.attach(new Person('Thor', 4226))

      const script = (cb: (a?: string) => void) => () => {
        const ab = selectContext(Person, ["blip", 23])

        cb(ab?.name)
      }

      runWithContext(ctx1, script(fnmock))
      runWithContext(ctx2, script(fnmock))

      expect(fnmock.mock.calls[0][0]).toEqual('Maria')
      expect(fnmock.mock.calls[1][0]).toEqual('Thor')
    })

  })

  it('Sample with class estrategy', () => {
    const g1 = new GlobalContaintContext()

    /*
      Tree:
        - A
          - C
          - B
            - D
              - C
     */

    class A {
      constructor(
        readonly b = g1.selectContext(B, []),
        readonly c = g1.selectContext(C, []),
      ) { }
    }
    class B {
      constructor(
        readonly d = g1.selectContext(D, []),
      ) { }
    }
    class C {
      constructor(
        readonly name?: string
      ) { }
    }
    class D {
      constructor(
        readonly c = g1.selectContext(C, []),
      ) { }
    }

    const script = (textCompare: string) => () => {
      const a = new A()

      expect(a.c).toEqual(a.b.d.c);
      expect(a.c.name).toEqual(textCompare);
    }

    const ctxa = new AppContext();
    const ctxb = new AppContext();

    ctxa.selectContext(C, ['Lili']);
    ctxb.selectContext(C, ['Mark']);

    g1.run(ctxa, script('Lili'));
    g1.run(ctxb, script('Mark'));

  });

  it('Sample code with code', () => {
    interface Handler { (req: any, res: any, next: () => void): any }

    const g = new GlobalContaintContext()

    // Mock Express
    const express = () => new class {
      private cbs: (() => void)[] = [];
      runAllCallbacks = () => this.cbs.forEach(cb => cb())
      use = (...a: (string | Handler)[]) => a.forEach(a => {
        if (typeof a === 'function') this.cbs.push(() => a({}, {}, () => undefined));
      });
      get = this.use;
      post = this.use;
    }

    class MyConfigService {
      constructor(
        private configs?: {
          propa?: string,
          propb?: string,
          propc?: string,
          propd?: string,
        }
      ) { }

      get(key: keyof Exclude<MyConfigService['configs'], undefined>) {
        return this.configs?.[key];
      }
    }

    class MyController {
      constructor(
        private config = g.selectContext(MyConfigService, [])
      ) { }

      runMyService() {
        console.log(`My configs ${this.config.get('propc')}`)
      }
    }

    class MyRouter {
      constructor(
        private route: ReturnType<typeof express>,
        readonly myController = g.selectContext(MyController, []),
      ) {
        this.route.get('/route', (req, res, next) => {
          g.run(new AppContext(g.selectCurrentContext()), () => this.myControl(req, res, next))
        })
      }

      myControl(req: any, res: any, next: () => void) {
        this.myController.runMyService()
      }
    }

    class App {
      constructor(
        readonly appExpress = express()
      ) {
        new MyRouter(this.appExpress)
      }
    }

    g.run(
      new AppContext()
        .attach(new MyConfigService({
          propc: 'blabla'
        })),
      () => {
        new App()
          .appExpress
          .runAllCallbacks();
      },
    );

  });

});
