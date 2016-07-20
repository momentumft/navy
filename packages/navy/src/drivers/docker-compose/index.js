/* @flow */

import yaml from 'js-yaml'
import {Readable} from 'stream'

import {createComposeClient} from './client'
import {Navy} from '../../navy'
import {execAsync} from '../../util/exec-async'
import {Status as ServiceStatus} from '../../service'
import fs from '../../util/fs'
import LogStream from './log-stream'

import type {Driver} from '../../driver'
import type {ServiceList} from '../../service'

const debug = require('debug')('navy:docker-compose')

function getArgsFromOptions(opts: Object, argMap: Object): Array<string> {
  return Object.keys(opts)
    .map(key => argMap[key])
    .filter(arg => arg)
}

const launchArgMap = {
  noDeps: '--no-deps',
  forceRecreate: '--force-recreate',
}

export default function createDockerComposeDriver(navy: Navy): Driver {
  const {
    exec,
    getCompiledDockerComposePath,
  } = createComposeClient(navy)

  const driver = {
    async launch(services: Array<string>, opts: ?Object = {}): Promise<void> {
      const additionalArgs = []

      debug('Got launch', services, opts)

      if (opts) {
        additionalArgs.push(...getArgsFromOptions(opts, launchArgMap))
        debug('Resolve opts to args', additionalArgs)
      }

      if (!services || services.length === 0) return

      await exec('up', ['-d', ...additionalArgs, ...services])
    },

    async destroy(): Promise<void> {
      await exec('kill')
      await exec('down', ['-v'])
    },

    async ps(): Promise<ServiceList> {
      const ids = (await exec('ps', ['-q'], { noLog: true })).trim().split('\n')

      if (ids.length === 1 && ids[0] === '') return []

      const inspectRaw = await execAsync('docker', ['inspect', ...ids])
      const inspectResult = JSON.parse(inspectRaw)

      return inspectResult.map(service => ({
        id: service.Id,
        name: service.Config.Labels['com.docker.compose.service'],
        image: service.Config.Image,
        status: service.State.Running === true ? ServiceStatus.RUNNING : ServiceStatus.EXITED,
        raw: service,
      }))
    },

    async start(services: ?Array<string>): Promise<void> {
      if (!services || services.length === 0) return
      await exec('start', services)
    },

    async stop(services: ?Array<string>): Promise<void> {
      if (!services || services.length === 0) return
      await exec('stop', services)
    },

    async restart(services: ?Array<string>): Promise<void> {
      if (!services || services.length === 0) return
      await exec('restart', services)
    },

    async kill(services: ?Array<string>): Promise<void> {
      if (!services || services.length === 0) return
      await exec('kill', services)
    },

    async rm(services: ?Array<string>): Promise<void> {
      if (!services || services.length === 0) return
      await exec('rm', ['-f', '-v', ...services])
    },

    async update(services: ?Array<string>): Promise<void> {
      if (!services || services.length === 0) return
      await exec('pull', services)
      await exec('up', ['-d', '--no-deps', ...services])
    },

    async getLogStream(services: ?Array<string>): Promise<Readable> {
      if (!services || services.length === 0) return

      const logStream = new LogStream()

      return await new Promise(resolve =>
        exec('logs', ['-f', '--tail=250', ...(services || [])], { maxBuffer: 32 * 1024 * 1024 }, ps => {
          ps.stdout.pipe(logStream)
          ps.stderr.pipe(logStream)
          resolve(logStream)
        })
      )
    },

    async port(service: string, privatePort: number, index: ?number): Promise<?number> {
      if (index == null) index = 1

      const output = await exec('port', ['--index=' + index, service, privatePort])

      const port = output.substring(output.lastIndexOf(':') + 1).trim()

      if (port === '') {
        return null
      }

      return Number(port)
    },

    async writeConfig(config: Object): Promise<void> {
      const yamlOut = yaml.dump(config)
      await fs.writeFileAsync(getCompiledDockerComposePath(), yamlOut)

      debug('Wrote docker-compose.tmp.yml', yamlOut)
    },

    async getConfig(): Promise<Object> {
      const output = await exec('config', [], { useOriginalDockerComposeFiles: true, noLog: true })
      const config = yaml.safeLoad(output)

      return config
    },

    async getLaunchedServiceNames(): Promise<Array<string>> {
      const projectName = navy.normalisedName

      const psRaw = await execAsync('docker', [
        'ps',
        '-a',
        `--filter="label=com.docker.compose.project=${projectName}"`,
        '--format',
        '"{{.Label \\"com.docker.compose.service\\"}}"',
      ])

      const names = psRaw.trim().split('\n')

      if (names.length === 1 && names[0].length === 0) return []

      return names
    },

    async getAvailableServiceNames(): Promise<Array<string>> {
      const config = await driver.getConfig()

      return Object.keys(config.services)
    },
  }

  return driver
}
