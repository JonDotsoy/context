const memoize = require('lodash.memoize')
const isFunction = require('lodash.isfunction')

const checkIfIsBrowser = memoize(function () {
  return (typeof(window) !== 'undefined')
})

function isBrowser (fn) {
  const check = checkIfIsBrowser()
  if (isFunction(fn)) {
    fn()
  }
  return check
}

module.exports = isBrowser
