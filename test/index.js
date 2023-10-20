if (!globalThis.gc) globalThis.gc = Bun.gc;

const WAIT = 50;

const { create, drop } = require('../cjs');

const retain1 = globalThis;
const retain2 = {a: 1};
const retain3 = function () {};
const result = [];

let release1 = create(
  retain1,
  retained => {
    console.assert(retained === retain1, 'retain1');
    result.push('retain1');
  }
);

let release2 = create(
  retain2,
  retained => {
    console.assert(retained === retain2, 'retain2');
    result.push('retain2');
  }
);

let release3 = create(
  retain3,
  retained => {
    console.assert(retained === retain3, 'retain3');
    result.push('retain3');
  }
);

console.assert(!!release1.setTimeout, 'release1.setTimeout');
console.assert(!!release2.a, 'release2.a');
console.assert(!release3(), 'release3()');

console.assert(!drop({}), 'unregister({})');

setTimeout(() => {
  gc();
  setTimeout(() => {
    result.sort();
    console.assert(result == 'retain1,retain2,retain3', 'retain1,retain2,retain3');
    result.splice(0);

    const trap = {};
    const trapped = create(
      retain2,
      retained => {
        console.assert(retained === retain2, 'retained === retain2');
        result.push('trap2');
      },
      { return: trap }
    );

    console.assert(trapped === trap, 'trapped === trap');

    create(
      retain3,
      retained => {
        console.assert(retained === retain3, 'retained === retain3');
        result.push('trap3');
      },
      { return: function () {} }
    );

    setTimeout(() => {
      gc();
      setTimeout(() => {
        result.sort();
        console.assert(result == 'trap2,trap3', 'trap2,trap3');

        const token = {};
        let retained = create(
          retain1,
          () => {
            throw new Error('nope');
          },
          { token }
        );

        setTimeout(() => {
          const ok = !!retained;
          retained = void 0;
          console.assert(drop(token) && ok, 'unregister(token) && ok');
          gc();
          setTimeout(() => {
            gc();
            let triggered = false;
            create(
              retain1,
              value => {
                triggered = value === retain1;
              },
              { token: false, debug: true }
            );
            setTimeout(() => {
              gc();
              setTimeout(() => {
                gc();
                setTimeout(() => {
                  console.assert(triggered, 'false token');
                }, WAIT);
              }, WAIT);
            }, WAIT);
          }, WAIT);
        }, WAIT);
      }, WAIT);
    }, WAIT);
  }, WAIT);
}, WAIT);
