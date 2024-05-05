import v from '../../../index'
import axios from 'axios'
import { generateSecretKey } from '../helpers'

const secretKey = generateSecretKey()
const session = v.Session({ secretKey, sanitizationEvery: '5m' })

class ExampleController implements v.Controller {
  public handle (request: v.Request, response: v.Response): any {
    const userData = { userId: 123, email: 'any@mail.com' }
    const config = { expiresIn: '15m' }
    session.signIn(request, response, userData, config)
    response.status(200).json({ session: request.session })
  }
}

const router = v.Router()
router.post('/signin', v.controllerAdapter(new ExampleController()))
router.post('/protect', session.protectRouteMiddleware(), v.controllerAdapter(new ExampleController()))

describe('Session', () => {
  let server: any

  const getCookies = (response: any): {
    cookie: string
    sessionId: string
    sessionToken: string
  } => {
    const setCookie = response.headers['set-cookie']
    let sessionId = ''
    let sessionToken = ''

    setCookie.forEach((cookie: string) => {
      if (cookie.startsWith('session-id=')) {
        sessionId = cookie.split('=')[1].split(';')[0]
      } else if (cookie.startsWith('session-token=')) {
        sessionToken = cookie.split('=')[1].split(';')[0]
      }
    })

    const cookie: string = `session-id=${sessionId};session-token=${sessionToken}`

    return { cookie, sessionId, sessionToken }
  }

  afterEach(() => {
    // close server if test fails or causes error
    if (server?.listening) {
      server.close()
    }
  })

  const validateSessionSuccess = (
    response: any,
    sessionId: string,
    sessionToken: string
  ): void => {
    expect(response.status).toEqual(200)
    expect(Object.keys(response.headers).length).toEqual(10)
    expect(v.isUUID(response.headers['request-id'])).toBeTruthy()
    expect(response.headers['content-security-policy']).toEqual("default-src 'self'; script-src 'self' 'unsafe-inline'")
    expect(response.headers['cache-control']).toEqual('no-store, no-cache, must-revalidate')
    expect(response.headers.expires).toEqual('0')
    expect(response.headers['x-xss-protection']).toEqual('1; mode=block')
    const arrCookies = response.headers['set-cookie'] as string[]
    expect(arrCookies.length).toEqual(2)
    expect(arrCookies[0].startsWith('session-id=')).toBeTruthy()
    expect(arrCookies[1].startsWith('session-token=')).toBeTruthy()
    expect(response.headers['content-type']).toEqual('application/json')
    expect(response.headers.connection).toEqual('close')
    expect(response.headers['content-length']).toEqual('2')
    expect(typeof sessionId).toEqual('string')
    expect(v.isUUID(sessionId)).toBeTruthy()
    expect(typeof sessionToken).toEqual('string')
    expect(response.data).toEqual({})
  }

  const validateSessionUnauthorized = (error: any): void => {
    expect(error.response.status).toEqual(401)
    expect(Object.keys(error.response.headers).length).toEqual(13)
    expect(v.isUUID(error.response.headers['request-id'])).toBeTruthy()
    expect(error.response.headers['cache-control']).toEqual('no-store, no-cache, must-revalidate, private')
    expect(error.response.headers.pragma).toEqual('no-cache')
    expect(error.response.headers.expires).toEqual('0')
    expect(error.response.headers['x-content-type-options']).toEqual('nosniff')
    expect(error.response.headers['x-frame-options']).toEqual('DENY')
    expect(error.response.headers['content-security-policy']).toEqual("default-src 'self'")
    expect(error.response.headers['x-xss-protection']).toEqual('1; mode=block')
    expect(error.response.headers['content-type']).toEqual('text/plain')
    expect(error.response.headers['set-cookie']).toEqual([
      'session-id=; HttpOnly=true; Max-Age=0; Path=/; Secure=true; SameSite=Strict; Priority=High; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'session-token=; HttpOnly=true; Max-Age=0; Path=/; Secure=true; SameSite=Strict; Priority=High; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    ])
    expect(v.isString(error.response.headers.date)).toBeTruthy()
    expect(error.response.headers.connection).toEqual('close')
    expect(error.response.headers['content-length']).toEqual('12')
    expect(error.response.data).toEqual('Unauthorized')
  }

  const validateProtectSuccess = (response: any): void => {
    expect(response.status).toEqual(200)
    expect(Object.keys(response.headers).length).toEqual(10)
    expect(v.isUUID(response.headers['request-id'])).toBeTruthy()
    expect(response.headers['content-type']).toEqual('application/json')
    expect(response.headers['content-security-policy']).toEqual("default-src 'self'; script-src 'self' 'unsafe-inline'")
    expect(response.headers['cache-control']).toEqual('no-store, no-cache, must-revalidate')
    expect(response.headers['x-xss-protection']).toEqual('1; mode=block')
    const arrCookies = response.headers['set-cookie'] as string[]
    expect(arrCookies.length).toEqual(2)
    expect(arrCookies[0].startsWith('session-id=')).toBeTruthy()
    expect(arrCookies[1].startsWith('session-token=')).toBeTruthy()
    expect(v.isString(response.headers.date)).toBeTruthy()
    expect(response.headers.connection).toEqual('close')
    expect(response.headers['content-length']).toEqual('49')
    expect(response.data).toEqual({
      session: { userId: 123, email: 'any@mail.com' }
    })
  }

  it('should be able to create session', async () => {
    const app = v.App()
    app.use(router)
    server = app.server()
    server.listen(3799)

    await axios.post('http://localhost:3799/signin').then((response) => {
      const { sessionId, sessionToken } = getCookies(response)
      validateSessionSuccess(response, sessionId, sessionToken)
    })

    app.close()
  })

  it('throw new Error when secret key is invalid', async () => {
    try {
      const session = v.Session({ secretKey: '123' })

      class ExampleController implements v.Controller {
        public handle (request: v.Request, response: v.Response): any {
          const userData = { userId: 123, email: 'any@mail.com' }
          const config = { expiresIn: '15m' }
          session.signIn(request, response, userData, config)
          response.status(200).json({ session: request.session })
        }
      }

      const router = v.Router()
      router.post('/signin', v.controllerAdapter(new ExampleController()))
    } catch (error: any) {
      expect(error.message).toEqual('vkrun-session: the secret keys must be strings of 64 characters representing 32 bytes.')
    }
  })

  it('should be able to access a protected route with correct headers', async () => {
    const app = v.App()
    app.use(router)
    server = app.server()
    server.listen(3798)
    let cookie = ''

    await axios.post('http://localhost:3798/signin').then((response) => {
      const { cookie: _cookie, sessionId, sessionToken } = getCookies(response)
      validateSessionSuccess(response, sessionId, sessionToken)
      cookie = _cookie
    })

    await axios.post('http://localhost:3798/protect', {}, {
      headers: { cookie }
    }).then((response) => {
      validateProtectSuccess(response)
    })

    app.close()
  })

  it('return unauthorized when session token is invalid', async () => {
    const app = v.App()
    app.use(router)
    server = app.server()
    server.listen(3797)
    let sessionId = ''

    await axios.post('http://localhost:3797/signin').then((response) => {
      const { sessionId: _sessionId, sessionToken } = getCookies(response)
      validateSessionSuccess(response, _sessionId, sessionToken)
      sessionId = _sessionId
    })

    await axios.post('http://localhost:3797/protect', {}, {
      headers: { cookie: `session-id=${sessionId}; session-token=123` }
    }).catch((error: any) => {
      validateSessionUnauthorized(error)
    })

    app.close()
  })

  it('return unauthorized when session ID is invalid', async () => {
    const app = v.App()
    app.use(router)
    server = app.server()
    server.listen(3796)
    let sessionToken = ''

    await axios.post('http://localhost:3796/signin').then((response) => {
      const { sessionId, sessionToken: _sessionToken } = getCookies(response)
      validateSessionSuccess(response, sessionId, _sessionToken)
      sessionToken = _sessionToken
    })

    await axios.post('http://localhost:3796/protect', {}, {
      headers: { cookie: `session-id=123; session-token=${sessionToken}` }
    }).catch((error: any) => {
      validateSessionUnauthorized(error)
    })

    app.close()
  })

  it('return bad request when session id is not passed in headers', async () => {
    const app = v.App()
    app.use(router)
    server = app.server()
    server.listen(3795)
    let sessionToken = ''

    await axios.post('http://localhost:3795/signin').then((response) => {
      const { sessionId, sessionToken: _sessionToken } = getCookies(response)
      validateSessionSuccess(response, sessionId, _sessionToken)
      sessionToken = _sessionToken
    })

    await axios.post('http://localhost:3795/protect', {}, {
      headers: { cookie: `session-token=${sessionToken}` }
    }).catch((error: any) => {
      expect(error.response.status).toEqual(400)
      expect(Object.keys(error.response.headers).length).toEqual(12)
      expect(v.isUUID(error.response.headers['request-id'])).toBeTruthy()
      expect(error.response.headers['cache-control']).toEqual('no-store, no-cache, must-revalidate, private')
      expect(error.response.headers.pragma).toEqual('no-cache')
      expect(error.response.headers.expires).toEqual('0')
      expect(error.response.headers['x-content-type-options']).toEqual('nosniff')
      expect(error.response.headers['x-frame-options']).toEqual('DENY')
      expect(error.response.headers['content-security-policy']).toEqual("default-src 'self'")
      expect(error.response.headers['x-xss-protection']).toEqual('1; mode=block')
      expect(error.response.headers['content-type']).toEqual('text/plain')
      expect(error.response.headers.connection).toEqual('close')
      expect(error.response.headers['content-length']).toEqual('18')
      expect(error.response.data).toEqual('Invalid session ID')
    })

    app.close()
  })

  it('return unauthorized when session token is not passed in headers', async () => {
    const app = v.App()
    app.use(router)
    server = app.server()
    server.listen(3794)
    let sessionId = ''

    await axios.post('http://localhost:3794/signin').then((response) => {
      const { sessionId: _sessionId, sessionToken } = getCookies(response)
      validateSessionSuccess(response, _sessionId, sessionToken)
      sessionId = _sessionId
    })

    await axios.post('http://localhost:3794/protect', {}, {
      headers: { cookie: `session-id=${sessionId}` }
    }).catch((error: any) => {
      validateSessionUnauthorized(error)
    })

    app.close()
  })

  it('return unauthorized when session token is expired', async () => {
    const app = v.App()
    app.use(router)
    let cookie = ''

    const server = app.server()
    server.listen(3793)

    await axios.post('http://localhost:3793/signin').then((response) => {
      const { cookie: _cookie } = getCookies(response)
      cookie = _cookie
    })

    await axios.post('http://localhost:3793/protect', {}, {
      headers: { cookie }
    }).catch((error: any) => {
      validateSessionUnauthorized(error)
    })

    app.close()
  })

  it('return unauthorized when session is expired', async () => {
    const app = v.App()
    const secretKey = generateSecretKey()
    const session = v.Session({ secretKey, sanitizationEvery: 1 })
    const router = v.Router()

    class ExampleBController implements v.Controller {
      public handle (request: v.Request, response: v.Response): any {
        const userData = { userId: 123, email: 'any@mail.com' }
        const config = { expiresIn: 1 }
        session.signIn(request, response, userData, config)
        response.status(200).json({ session: request.session })
      }
    }

    router.post('/signin', v.controllerAdapter(new ExampleBController()))
    router.post('/protect', session.protectRouteMiddleware(), v.controllerAdapter(new ExampleController()))

    app.use(router)
    const server = app.server()
    server.listen(3792)
    let cookie = ''

    await axios.post('http://localhost:3792/signin').then((response) => {
      const { cookie: _cookie, sessionId, sessionToken } = getCookies(response)
      cookie = _cookie
      validateSessionSuccess(response, sessionId, sessionToken)
    })

    const delay = async (ms: number): Promise<void> => await new Promise<void>((resolve) => setTimeout(resolve, ms))

    await delay(1001)

    await axios.post('http://localhost:3792/protect', {}, {
      headers: { cookie }
    }).catch((error) => {
      validateSessionUnauthorized(error)
    })

    app.close()
  })

  it('should be able to update session when passed session id', async () => {
    const app = v.App()
    app.use(router)
    const server = app.server()
    server.listen(3781)

    await axios.post('http://localhost:3781/signin').then((response) => {
      const { sessionId, sessionToken } = getCookies(response)
      validateSessionSuccess(response, sessionId, sessionToken)

      const cookies: any = response.headers['set-cookie']
      cookies.forEach((cookie: string) => {
        if (cookie.startsWith('session-id=')) {
          expect(cookie.split('=')[1].split(';')[0]).toEqual(sessionId)
        }
      })
    })

    await axios.post('http://localhost:3781/signin').then((response) => {
      const { sessionId, sessionToken } = getCookies(response)
      validateSessionSuccess(response, sessionId, sessionToken)

      const cookies: any = response.headers['set-cookie']
      cookies.forEach((cookie: string) => {
        if (cookie.startsWith('session-id=')) {
          expect(cookie.split('=')[1].split(';')[0]).toEqual(sessionId)
        }
      })
    })

    app.close()
  })

  it('Should be able to update the session when it has the session ID and session token in the cookie', async () => {
    const app = v.App()
    app.use(router)
    const server = app.server()
    server.listen(3780)
    let cookie = ''

    await axios.post('http://localhost:3780/signin').then((response) => {
      const { cookie: _cookie, sessionId, sessionToken } = getCookies(response)
      validateSessionSuccess(response, sessionId, sessionToken)
      cookie = _cookie
    })

    await axios.post('http://localhost:3780/signin', {}, {
      headers: { cookie }
    }).then((response) => {
      const { sessionId, sessionToken } = getCookies(response)
      validateSessionSuccess(response, sessionId, sessionToken)
    })

    app.close()
  })

  it('Should be able to signOut the session with next handler', async () => {
    class SignOutController implements v.Controller {
      public handle (_request: v.Request, response: v.Response): any {
        response.status(200).send('SignOut OK')
      }
    }
    router.get('/signout-with-next-handler', session.signOutMiddleware(), v.controllerAdapter(new SignOutController()))

    const app = v.App()
    app.use(router)

    const server = app.server()
    server.listen(3779)

    let cookie = ''

    await axios.post('http://localhost:3779/signin').then((response) => {
      const { cookie: _cookie, sessionId, sessionToken } = getCookies(response)
      validateSessionSuccess(response, sessionId, sessionToken)
      cookie = _cookie
    })

    await axios.post('http://localhost:3779/protect', {}, {
      headers: { cookie }
    }).then((response) => {
      validateProtectSuccess(response)
    })

    await axios.get('http://localhost:3779/signout-with-next-handler').then((response) => {
      console.log({ asd: response.data })
      expect(response.status).toEqual(200)
      expect(response.data).toEqual('SignOut OK')
    })

    await axios.post('http://localhost:3779/protect', {}, {
      headers: { cookie }
    }).catch((error: v.SuperRequestError) => {
      validateSessionUnauthorized(error)
    })

    app.close()
  })

  it('Should be able to signOut the session without next handler', async () => {
    router.get('/signout-without-next-handler', session.signOutMiddleware())

    const app = v.App()
    app.use(router)

    const server = app.server()
    server.listen(3778)

    let cookie = ''

    await axios.post('http://localhost:3778/signin').then((response) => {
      const { cookie: _cookie, sessionId, sessionToken } = getCookies(response)
      validateSessionSuccess(response, sessionId, sessionToken)
      cookie = _cookie
    })

    await axios.post('http://localhost:3778/protect', {}, {
      headers: { cookie }
    }).then((response) => {
      validateProtectSuccess(response)
    })

    await axios.get('http://localhost:3778/signout-without-next-handler').then((response) => {
      expect(response.status).toEqual(200)
      expect(response.data).toEqual('')
    })

    await axios.post('http://localhost:3778/protect', {}, {
      headers: { cookie }
    }).catch((error: v.SuperRequestError) => {
      validateSessionUnauthorized(error)
    })

    app.close()
  })
})
