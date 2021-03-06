/* @flow */

import dns from 'dns'

const IPV4_FAMILY = 4

export async function dnsLookup(hostname: string): Promise<string> {
  return await new Promise((resolve, reject) => {
    dns.lookup(hostname, null, (err, ip, ipFamily) => {
      if (err || ipFamily !== IPV4_FAMILY) {
        reject(new Error('Failed to lookup hostname "' + hostname + '"'))
      } else {
        resolve(ip)
      }
    })
  })
}

export async function getExternalIP(ipInConfig: ?string): Promise<string> {
  const dockerHost = process.env.DOCKER_HOST

  // DEPRECATED use NAVY_EXTERNAL_IP instead
  if (process.env.NAVY_HOST) {
    return process.env.NAVY_HOST
  }

  if (process.env.NAVY_EXTERNAL_IP) {
    // Custom external IP
    return process.env.NAVY_EXTERNAL_IP
  }

  if (ipInConfig) {
    return await dnsLookup(ipInConfig)
  }

  if (dockerHost && dockerHost.indexOf('tcp://') !== -1) {
    // OSX with docker-machine, or a remote docker
    // dockerHost will be formatted like:
    // tcp://_._._._:_
    // We only care about the IP address

    let ip = dockerHost.substring('tcp://'.length)
    ip = ip.substring(0, ip.lastIndexOf(':')).trim()
    ip = await dnsLookup(ip)

    return ip
  }

  // No custom docker host, assume localhost
  return '127.0.0.1'
}
