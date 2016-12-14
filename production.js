const memoize = require('lodash.memoize')
const isFunction = require('lodash.isfunction')

const checkIfIsProduction = memoize(function () {
  return (process.env.NODE_ENV === 'production')
})

function isProduction (fn) {
  const check = checkIfIsProduction()
  if (isFunction(fn)) {
    fn()
  }
  return check
}

module.exports = isProduction
