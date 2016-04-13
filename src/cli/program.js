import program from 'commander'

function wrapper(res) {
  if (res.catch) {
    res.catch(err => {
      console.error(err.stack)
    })
  }

  return res
}

function basicCliWrapper(fnName) {
  return async function (maybeServices, ...args) {
    const { getEnvironment } = require('../environment')

    const opts = args.length === 0 ? maybeServices : args[args.length - 1]
    const otherArgs = args.slice(0, args.length - 1)
    const envName = opts.environment

    const returnVal = await wrapper(getEnvironment(envName)[fnName](
      Array.isArray(maybeServices) && maybeServices.length === 0
        ? undefined
        : maybeServices,
      ...otherArgs,
    ))

    if (returnVal != null) {
      console.log(returnVal)
    }
  }
}

function lazyRequire(path) {
  return function (...args) {
    return wrapper(require(path)(...args))
  }
}

program
  .command('launch [services...]')
  .option('-e, --environment [env]', 'set the environment name to be used [dev]', 'dev')
  .description('Launches the given services in an environment')
  .action(lazyRequire('./launch'))
  .on('--help', () => console.log(`
  This will prompt you for the services that you want to bring up.
  You can optionally provide the names of services to bring up which will disable the interactive prompt.
  `))

program
  .command('ps')
  .option('-e, --environment [env]', 'set the environment name to be used [dev]', 'dev')
  .description('Lists the running services for an environment')
  .action(basicCliWrapper('ps'))

program
  .command('start [services...]')
  .option('-e, --environment [env]', 'set the environment name to be used [dev]', 'dev')
  .description('Starts the given services')
  .action(basicCliWrapper('start'))

program
  .command('stop [services...]')
  .option('-e, --environment [env]', 'set the environment name to be used [dev]', 'dev')
  .description('Stops the given services')
  .action(basicCliWrapper('stop'))

program
  .command('port <service> <port>')
  .option('-e, --environment [env]', 'set the environment name to be used [dev]', 'dev')
  .description('Prints the external port for the given internal port of the given service')
  .action(basicCliWrapper('port'))
  .on('--help', () => console.log(`
  Examples:
    $ navy port mywebserver 80
    35821
  `))

program
  .command('help')
  .alias('*')
  .action(() => program.help())

export default program
