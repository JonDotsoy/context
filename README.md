# CONTEXT
Run only if is a specific context.

## How use
In a test file.

```javascript
// file test/test.js
conts context = require('context')
const expect = require('expect.js')
const myModule = require('..')

context.browser(() => {
  describe('test on browser', () => {
    it('is add', () => {
      const a = document.querySelector('myInputA').value // 3
      const b = document.querySelector('myInputB').value // 4
      expect(myModule.add(a, b)).to.be(7)
    })
  })
})

context.node(() => {
  describe('test on node', () => {
    it('is add', () => {
      const a = process.env['MYCUSTOMENV_A'] // 3
      const b = process.env['MYCUSTOMENV_B'] // 4
      expect(myModule.add(a, b)).to.be(7)
    })
  })
})
```

In a app
```javascript
const context = require('context')

context.development(() => {
  // my code
})

// or
if (context.development()) {
  // my code
}
```

## Contexts
 * **browser([fn])**: Run if is a browser.
 * **node([fn])**: Run if is node.
 * **production([fn])**: Run if is set `process.env.NODE_ENV` equal to `production` (This is auto set with `npm start --production`).
 * **develop([fn])**: Run if is set `process.env.NODE_ENV` equal to `development` or `null`.


