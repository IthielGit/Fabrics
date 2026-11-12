import { describe, expect, it } from 'vitest'
import { isValidEmail, newPasswordProblems, signUpProblems } from './authValidation'

describe('isValidEmail', () => {
  it('accepte une adresse normale, avec espaces autour', () => {
    expect(isValidEmail(' ana@exemple.be ')).toBe(true)
  })
  it('refuse une adresse incomplète', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('ana')).toBe(false)
    expect(isValidEmail('ana@exemple')).toBe(false)
    expect(isValidEmail('ana @exemple.be')).toBe(false)
  })
})

describe('signUpProblems', () => {
  it('ne signale rien quand tout est bon', () => {
    expect(signUpProblems('ana@exemple.be', 'motdepasse', 'motdepasse')).toEqual([])
  })
  it('signale une adresse invalide et un mot de passe trop court', () => {
    expect(signUpProblems('ana', 'court', 'court')).toEqual(['emailInvalid', 'passwordTooShort'])
  })
  it('signale deux mots de passe différents', () => {
    expect(signUpProblems('ana@exemple.be', 'motdepasse', 'autrechose')).toEqual(['passwordsDiffer'])
  })
})

describe('newPasswordProblems', () => {
  it('vérifie longueur puis confirmation', () => {
    expect(newPasswordProblems('1234567', '1234567')).toEqual(['passwordTooShort'])
    expect(newPasswordProblems('12345678', '12345679')).toEqual(['passwordsDiffer'])
    expect(newPasswordProblems('12345678', '12345678')).toEqual([])
  })
})
