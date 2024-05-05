import { jwt } from '../jwt'
import * as helper from './helpers'
import * as util from '../utils'
import * as type from '../types'

export class VkrunSession {
  private readonly secretKey: string | string[]
  private readonly sessions: type.Sessions = new Map()
  // eslint-disable-next-line @typescript-eslint/prefer-readonly
  private sanitizationActive: boolean = false
  private readonly sanitizationEvery: number = util.convertExpiresIn('5m') // used in the startSanitization function

  constructor (config: type.SessionConfig) {
    util.validateSecretKey(config.secretKey, 'session')
    this.secretKey = config.secretKey
    if (config.sanitizationEvery) {
      util.validateTimeFormat(config.sanitizationEvery, 'session')
      this.sanitizationEvery = util.convertExpiresIn(config.sanitizationEvery)
    }
  }

  public signIn (
    request: type.Request,
    response: type.Response,
    data: any,
    options: type.SessionCreateOptions
  ): void {
    util.validateTimeFormat(options.expiresIn, 'session')
    const { sessionId } = helper.getSessionCookies(request)

    if (this.sessions.has(sessionId)) {
      this.sessions.delete(sessionId)
    }

    let createdSessionId = util.randomUUID()
    if (options.sessionId) createdSessionId = options.sessionId

    const session = helper.createSession({ request, response, sessionId: createdSessionId, data, options, secretKey: this.secretKey })
    this.sessions.set(createdSessionId, session)

    if (!this.sanitizationActive) helper.startSanitization({ ...this, request })
  }

  public signOut (request: type.Request, response: type.Response): void {
    const { sessionId } = helper.getSessionCookies(request)

    if (this.sessions.has(sessionId)) {
      this.sessions.delete(sessionId)
      helper.setDeleteSessionHeaders(response)
    }
  }

  public protectRouteMiddleware () {
    return (request: type.Request, response: type.Response, next: type.NextFunction) => {
      this.handle(request, response, next)
    }
  }

  public signOutMiddleware () {
    return (request: type.Request, response: type.Response, next: type.NextFunction) => {
      const { sessionId } = helper.getSessionCookies(request)

      if (this.sessions.has(sessionId)) {
        this.sessions.delete(sessionId)
        helper.setDeleteSessionHeaders(response)
      }

      if (next) next()
      response.status(200).end()
    }
  }

  private handle (request: type.Request, response: type.Response, next: type.NextFunction): void {
    const { sessionId, sessionToken } = helper.getSessionCookies(request)

    if (!sessionId) {
      helper.responseBadRequest(response)
      return
    }

    const session = this.sessions.get(sessionId)

    if (!util.isUUID(sessionId) || !session || util.isExpired(session.createdAt, session.expiresIn)) {
      helper.responseUnauthorized(response)
      return
    }

    const isValidToken = sessionToken === session.token
    const isValidRemoteAddress = request.socket.remoteAddress === session.remoteAddress
    const isValidRemoteFamily = request.socket.remoteFamily === session.remoteFamily
    const isValidUserAgent = request.headers['user-agent'] === session.userAgent

    if (isValidRemoteAddress && isValidRemoteFamily && isValidUserAgent && isValidToken) {
      if (session.token) {
        request.session = jwt.decrypt(session.token, this.secretKey)
      }

      next()
    } else {
      helper.responseUnauthorized(response)
    }
  }
}

export const Session = (config: type.SessionConfig): VkrunSession => new VkrunSession(config)
