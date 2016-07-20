/* @flow */

import {getNavy} from 'navy'
import {runCLI} from '../util/helper'

const definition = `
usage: navy service [-n NAVY] logs [-h] [<SERVICE>...]

Options:
  -n, --navy NAVY      Specifies the navy to use [env: NAVY_NAME] [default: dev]
  -h, --help           Shows usage
`

export default async function (): Promise<void> {
  const args = runCLI(definition)
  const env = getNavy(args['--navy'])

  const stream = await env.getLogStream(args['<SERVICE>'])

  stream.pipe(process.stdout)

  // should never finish without user Ctrl+c'ing
  await new Promise(resolve => stream.on('end', resolve))
}
