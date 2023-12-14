import { validator } from '../../index'

describe('Validator', () => {
  const error = new Error('any_error')

  it('Should be able to validate the required method and return true if the value is boolean', () => {
    const value = false
    const sut = validator.required(value)
    expect(sut).toBeTruthy()
  })

  it('Should be able to validate the required method and return true if the value is provided and nod is boolean', () => {
    const value = 'any_value'
    const sut = validator.required(value)
    expect(sut).toBeTruthy()
  })

  it('Should be able to validate the required method and return false if the value is not provided', () => {
    const hasNoValue = undefined
    const sut = validator.required(hasNoValue)
    expect(sut).toBeFalsy()
  })

  it('Should be able to validate the required method and return error if the value is not provided', () => {
    try {
      const hasNoValue = undefined
      validator.required(hasNoValue, error)
    } catch (error) {
      const sut = error
      expect(sut).toEqual(error)
    }
  })

  it('Should be able to validate the minWord method and return true if the value has the minimum number of words', () => {
    const value = 'primary secondary'
    const sut = validator.minWord(value, 2)
    expect(sut).toBeTruthy()
  })

  it('Should be able to validate the minWord method and return false if the value does not have the minimum number of words', () => {
    const value = 'primary'
    const sut = validator.minWord(value, 2)
    expect(sut).toBeFalsy()
  })

  it('Should be able to validate the minWord method and return error if the value does not have the minimum number of words', () => {
    try {
      const value = 'primary '
      validator.minWord(value, 2, error)
    } catch (error) {
      const sut = error
      expect(sut).toEqual(error)
    }
  })

  it('Should be able to validate the isEmail method and return true if email is correct', () => {
    const email = 'any_email@mail.com'
    const sut = validator.isEmail(email)
    expect(sut).toBeTruthy()
  })

  it('Should be able to validate the isEmail method and return false if email is not correct', () => {
    const email = 'invalid_email@mail'
    const sut = validator.isEmail(email)
    expect(sut).toBeFalsy()
  })

  it('Should be able to validate the isEmail method and return error if email is not correct', () => {
    try {
      const email = 'invalid_email@mail'
      validator.isEmail(email, error)
    } catch (error) {
      const sut = error
      expect(sut).toEqual(error)
    }
  })
})