const memoize = require('lodash.memoize')
const isFunction = require('lodash.isfunction')

const checkIfIsDevelopment = memoize(function () {
  return (process.env.NODE_ENV !== 'production')
})

function isDevelopment (fn) {
  const check = checkIfIsDevelopment()
  if (isFunction(fn)) {
    fn()
  }
  return check
}

module.exports = isDevelopment
