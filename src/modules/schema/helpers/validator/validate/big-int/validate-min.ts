import { informativeMessage } from '../../../location'
import * as type from '../../../../../types'
import * as util from '../../../../../utils'

export const validateMinBigInt = (
  params: type.ValidateMethod & {
    min: bigint
  }
): void => {
  const {
    value,
    valueName,
    min,
    indexArray,
    callbackAddPassed,
    callbackAddFailed
  } = params

  const message = {
    expect: indexArray !== undefined
      ? 'array index must contain a bigint greater than or equal to the reference'
      : 'value greater than or equal to the reference',
    error: informativeMessage.bigInt.min
      .replace('[valueName]', valueName)
      .replace('[value]', util.isBigInt(value) ? `${value}n` : String(value))
      .replace('[min]', util.isBigInt(min) ? `${min}n` : String(min))
  }

  if (util.isBigInt(value) && value >= min) {
    callbackAddPassed({
      method: 'min',
      name: valueName,
      expect: message.expect,
      index: indexArray,
      received: value
    })
  } else {
    callbackAddFailed({
      method: 'min',
      type: 'invalid value',
      name: valueName,
      expect: message.expect,
      index: indexArray,
      received: util.received(value),
      message: message.error
    })
  }
}
