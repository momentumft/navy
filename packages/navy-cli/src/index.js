/* @flow */

import {run, command} from './util/args'
import pkg from '../package.json'
import {NavyError} from 'navy/lib/errors'

const help = `
usage: navy [--version|-v] [--help]
            [<command> [<args>]...]

These are common Navy commands used in various situations:
  import               Imports docker compose configuration from the current working directory and initialises a new navy
  service              Manage services in a Navy
  ls                   Lists all of the imported Navies
  destroy              Destroys the given Navy by removing all of its services and configuration
  delete               Removes Navy's awareness of the given Navy, removing all configuration but keeping the Docker Containers
  develop              Puts the given service into development using the current working directory
  live                 Takes the given service out of development
  run                  Runs a named command provided by a plugin for the given Navy
  reload               Reloads the formation (Docker Compose config) for this Navy

Run 'navy COMMAND --help' for usage of a certain command.
`

const commandMap = {
  'import': () => require('./import'),
  'service': () => require('./service'),
  's': () => require('./service'),
  'ls': () => require('./ls'),
  'destroy': () => require('./destroy'),
  'delete': () => require('./delete'),
  'develop': () => require('./develop'),
  'live': () => require('./live'),
  'run': () => require('./run'),
  'reload': () => require('./reload'),
}

process.on('unhandledRejection', ex => {
  if (ex instanceof NavyError) {
    ex.prettyPrint()
  } else {
    console.error(ex.stack)
  }
})

const args = run([], help, {
  boolean: ['help'],
  alias: {
    v: 'version',
    h: 'help',
  },
})

if (args.version) {
  console.log(pkg.version)
} else {
  command(args, help, commandMap)
}

// if (args['--version'] || args['-v']) {
//   console.log(pkg.version)
// } else {
//   invokeCLI(args, definition, commandMap)
// }
