import { informativeMessage } from '../../location'
import { DateTypes, ErrorTest, SuccessTest, ValidatorValue, ValidatorValueName } from '../../types'
import { received } from '../../utils'

export const addDateResults = ({
  value,
  valueName,
  type,
  callbackAddPassed,
  callbackAddFailed
}: {
  value: ValidatorValue
  valueName: ValidatorValueName
  type?: DateTypes
  callbackAddPassed: (success: SuccessTest) => void
  callbackAddFailed: (error: ErrorTest) => void
}): void => {
  let year: number, month: number, day: number
  let formattedDate: Date

  const invalidFormat = (): boolean => {
    return (typeof value === 'string' &&
              value.length < 10) ||
              (typeof value === 'string' &&
              value.length <= 10 &&
              type === 'ISO8601')
  }

  const handleAddFailed = (): void => {
    const message = informativeMessage.validator.method.date.invalidFormat
    const messageError = message
      .replace('[valueName]', valueName)
      .replace('[type]', type ?? 'ISO8601')

    callbackAddFailed({
      method: 'date',
      type: 'invalid value',
      name: valueName,
      expect: `date type ${type ?? 'ISO8601'}`,
      received: received(value),
      message: messageError
    })
  }

  if (invalidFormat()) {
    handleAddFailed()
    return this
  }

  switch (type) {
    case 'DD/MM/YYYY':
      [day, month, year] = String(value).split('/').map(Number)
      formattedDate = new Date(year, month - 1, day)
      break
    case 'MM/DD/YYYY':
      [month, day, year] = String(value).split('/').map(Number)
      formattedDate = new Date(year, month - 1, day)
      break
    case 'DD-MM-YYYY':
      [day, month, year] = String(value).split('-').map(Number)
      formattedDate = new Date(year, month - 1, day)
      break
    case 'MM-DD-YYYY':
      [month, day, year] = String(value).split('-').map(Number)
      formattedDate = new Date(year, month - 1, day)
      break
    case 'YYYY/MM/DD':
      [year, month, day] = String(value).split('/').map(Number)
      formattedDate = new Date(year, month - 1, day)
      break
    case 'YYYY/DD/MM':
      [year, day, month] = String(value).split('/').map(Number)
      formattedDate = new Date(year, month - 1, day)
      break
    case 'YYYY-MM-DD':
      [year, month, day] = String(value).split('-').map(Number)
      formattedDate = new Date(year, month - 1, day)
      break
    case 'YYYY-DD-MM':
      [year, day, month] = String(value).split('-').map(Number)
      formattedDate = new Date(year, month - 1, day)
      break
    default:
      formattedDate = new Date(String(value))
  }

  const isInvalidDate = !formattedDate || isNaN(formattedDate.getTime())
  if (isInvalidDate) {
    handleAddFailed()
    return this
  } else {
    callbackAddPassed({
      method: 'date',
      name: valueName,
      expect: `date type ${type ?? 'ISO8601'}`,
      received: value
    })
  }
}
