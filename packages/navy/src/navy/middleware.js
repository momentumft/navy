/* @flow */

import {Navy} from './'

import type {State} from './state'
import type {Driver} from '../driver'

export async function middlewareRunner(navy: Navy, state: State): Promise {
  const driver: ?Driver = await navy.getDriver()

  if (!driver) {
    return
  }

  const config = navy._registeredMiddleware
  .reduce((prevConfig, middlewareFn) => middlewareFn(prevConfig, state), await driver.getConfig())

  await driver.writeConfig(config)
}