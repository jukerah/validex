import { informativeMessage } from '../../location'
import { ErrorTest, SuccessTest, ValidatorValue, ValidatorValueName } from '../../types'
import { isString, received } from '../../utils'

export const addMaxLengthResults = ({
  value,
  valueName,
  maxLength,
  callbackAddPassed,
  callbackAddFailed
}: {
  value: ValidatorValue
  valueName: ValidatorValueName
  maxLength: number
  callbackAddPassed: (success: SuccessTest) => void
  callbackAddFailed: (error: ErrorTest) => void
}): void => {
  const handleAddFailed = (messageError: string): void => {
    callbackAddFailed({
      method: 'maxLength',
      type: 'invalid value',
      name: valueName,
      expect: 'string with characters less than or equal to the limit',
      received: received(value),
      message: messageError
    })
  }

  if (isString(value)) {
    const exceededLimit = String(value).length > maxLength
    if (exceededLimit) {
      const message = informativeMessage.validator.method.maxLength.strict
      const messageError = message
        .replace('[valueName]', valueName)
        .replace('[maxLength]', String(maxLength))

      handleAddFailed(messageError)
      return this
    }
    callbackAddPassed({
      method: 'maxLength',
      name: valueName,
      expect: 'string with characters less than or equal to the limit',
      received: value
    })
  } else {
    const message = informativeMessage.validator.method.string.strict
    const messageError = message.replace('[valueName]', valueName)
    handleAddFailed(messageError)
  }
}
