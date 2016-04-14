import {expect} from 'chai'
import {Service} from '../../../../'

import {TEST_SERVICE_NAME} from '../../environment'

export default function () {

  this.When(/I launch a service$/, async function () {
    await this.navy.launch([TEST_SERVICE_NAME])
  })

  this.When(/I stop the service$/, async function () {
    await this.navy.stop([TEST_SERVICE_NAME])
  })

  this.When(/I start the service$/, async function () {
    await this.navy.start([TEST_SERVICE_NAME])
  })

  this.Then(/I should see that the service is running$/, async function () {
    await expect(this.navy).to.have.services([
      { name: TEST_SERVICE_NAME, status: Service.Status.RUNNING },
    ])
  })

  this.Then(/I should see that the service is stopped$/, async function () {
    await expect(this.navy).to.have.services([
      { name: TEST_SERVICE_NAME, status: Service.Status.EXITED },
    ])
  })

}
