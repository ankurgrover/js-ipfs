'use strict'

const debug = require('debug')
const log = debug('http-api:block')
log.error = debug('http-api:block:error')
const multiaddr = require('multiaddr')

exports = module.exports

// common pre request handler that parses the args and returns `addr` which is assigned to `request.pre.args`
exports.parseAddrs = (request, reply) => {
  if (!request.query.arg) {
    return reply("Argument 'addr' is required").code(400).takeover()
  }

  try {
    multiaddr(request.query.arg)
  } catch (err) {
    return reply("Argument 'addr' is invalid").code(500).takeover()
  }

  return reply({
    addr: request.query.arg
  })
}

exports.peers = {
  // main route handler which is called after the above `parseArgs`, but only if the args were valid
  handler: (request, reply) => {
    request.server.app.ipfs.swarm.peers((err, peers) => {
      if (err) {
        log.error(err)
        return reply({
          Message: err.toString(),
          Code: 0
        }).code(500)
      }

      return reply({
        Strings: Object.keys(peers)
          .map((key) =>
            `${peers[key].multiaddrs[0].toString()}/ipfs/${peers[key].id.toB58String()}`)
      })
    })
  }
}

exports.localAddrs = {
  // main route handler which is called after the above `parseArgs`, but only if the args were valid
  handler: (request, reply) => {
    request.server.app.ipfs.swarm.localAddrs((err, addrs) => {
      if (err) {
        log.error(err)
        return reply({
          Message: err.toString(),
          Code: 0
        }).code(500)
      }

      return reply({
        Strings: addrs.map((addr) => addr.toString())
      })
    })
  }
}

exports.connect = {
  // uses common parseAddr method that returns a `addr`
  parseArgs: exports.parseAddrs,

  // main route handler which is called after the above `parseArgs`, but only if the args were valid
  handler: (request, reply) => {
    const addr = request.pre.args.addr

    request.server.app.ipfs.swarm.connect(addr, (err) => {
      if (err) {
        log.error(err)
        return reply({
          Message: err.toString(),
          Code: 0
        }).code(500)
      }

      return reply({
        Strings: [`connect ${addr} success`]
      })
    })
  }
}
