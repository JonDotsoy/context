const browser = require('./browser')
const development = require('./development')
const node = require('./node')
const production = require('./production')

exports = module.exports
exports.browser = browser
exports.development = development
exports.node = node
exports.production = production
