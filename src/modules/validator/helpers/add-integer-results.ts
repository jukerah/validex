import { informativeMessage } from '../../location'
import { ErrorTest, SuccessTest, ValidatorValue, ValidatorValueName } from '../../types'
import { isInteger, received } from '../../utils'

export const addIntegerResults = ({
  value,
  valueName,
  callbackAddPassed,
  callbackAddFailed
}: {
  value: ValidatorValue
  valueName: ValidatorValueName
  callbackAddPassed: (success: SuccessTest) => void
  callbackAddFailed: (error: ErrorTest) => void
}): void => {
  if (isInteger(value)) {
    callbackAddPassed({
      method: 'integer',
      name: valueName,
      expect: 'number integer type',
      received: value
    })
  } else {
    const message = informativeMessage.validator.method.integer.strict
    const messageError = message.replace('[valueName]', valueName)

    callbackAddFailed({
      method: 'integer',
      type: 'invalid value',
      name: valueName,
      expect: 'number integer type',
      received: received(value),
      message: messageError
    })
  }
}
