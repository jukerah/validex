import { informativeMessage } from '../../location'
import { ErrorTest, SuccessTest, ValidatorValue, ValidatorValueName } from '../../types'
import { formatYYYYDDMMHHMMSS, received } from '../../utils'

export const addDateGreaterThanResults = ({
  value,
  valueName,
  dateToCompare,
  callbackAddPassed,
  callbackAddFailed
}: {
  value: ValidatorValue
  valueName: ValidatorValueName
  dateToCompare: Date
  callbackAddPassed: (success: SuccessTest) => void
  callbackAddFailed: (error: ErrorTest) => void
}): void => {
  const date = new Date(String(value))
  const isInvalidDate = isNaN(date.getTime())

  const expect = (): string => {
    if (value instanceof Date && dateToCompare instanceof Date) {
      return `${formatYYYYDDMMHHMMSS(date)} greater than reference ${formatYYYYDDMMHHMMSS(dateToCompare)}`
    } else {
      return `date ${valueName} greater than reference date`
    }
  }

  const handleAddFailed = (messageError: string): void => {
    callbackAddFailed({
      method: 'dateGreaterThan',
      type: 'invalid value',
      name: valueName,
      expect: expect(),
      received: received(value),
      message: messageError
    })
  }

  if (isInvalidDate) {
    handleAddFailed(informativeMessage.validator.method.dateGreaterThan.invalidDate)
    return this
  }

  const datesAreEqual = date.getTime() === dateToCompare.getTime()
  const deadlineExceeded = date < dateToCompare

  if (datesAreEqual || deadlineExceeded) {
    const message = informativeMessage.validator.method.dateGreaterThan.limitExceeded
    const messageError = message.replace('[valueName]', valueName)
    handleAddFailed(messageError)
    return this
  }

  callbackAddPassed({
    method: 'dateGreaterThan',
    name: valueName,
    expect: expect(),
    received: value
  })
}
