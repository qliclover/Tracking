import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { createHmac } from 'node:crypto'

const REGION = process.env.AWS_REGION || 'us-east-1'
const CLIENT_ID = process.env.COGNITO_CLIENT_ID || ''
const CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET || ''

function hasConfig(): boolean {
  return Boolean(
    process.env.COGNITO_USER_POOL_ID &&
      CLIENT_ID &&
      CLIENT_SECRET &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY,
  )
}

const client = new CognitoIdentityProviderClient({ region: REGION })

function secretHash(username: string): string {
  return createHmac('sha256', CLIENT_SECRET).update(username + CLIENT_ID).digest('base64')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  if (!hasConfig()) {
    res.status(503).json({ error: 'Sync is not configured.' })
    return
  }

  const { action, username, password, email, code, refreshToken } = (req.body ?? {}) as {
    action?: string
    username?: string
    password?: string
    email?: string
    code?: string
    refreshToken?: string
  }

  try {
    if (action === 'signup') {
      if (!username || !password || !email) {
        res.status(400).json({ error: 'Missing fields.' })
        return
      }
      await client.send(
        new SignUpCommand({
          ClientId: CLIENT_ID,
          Username: username,
          Password: password,
          SecretHash: secretHash(username),
          UserAttributes: [{ Name: 'email', Value: email }],
        }),
      )
      res.status(200).json({ ok: true })
      return
    }

    if (action === 'confirm') {
      if (!username || !code) {
        res.status(400).json({ error: 'Missing fields.' })
        return
      }
      await client.send(
        new ConfirmSignUpCommand({
          ClientId: CLIENT_ID,
          Username: username,
          ConfirmationCode: code,
          SecretHash: secretHash(username),
        }),
      )
      res.status(200).json({ ok: true })
      return
    }

    if (action === 'resend') {
      if (!username) {
        res.status(400).json({ error: 'Missing fields.' })
        return
      }
      await client.send(
        new ResendConfirmationCodeCommand({
          ClientId: CLIENT_ID,
          Username: username,
          SecretHash: secretHash(username),
        }),
      )
      res.status(200).json({ ok: true })
      return
    }

    if (action === 'login') {
      if (!username || !password) {
        res.status(400).json({ error: 'Missing fields.' })
        return
      }
      const out = await client.send(
        new InitiateAuthCommand({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: CLIENT_ID,
          AuthParameters: {
            USERNAME: username,
            PASSWORD: password,
            SECRET_HASH: secretHash(username),
          },
        }),
      )
      const t = out.AuthenticationResult
      if (!t) {
        res.status(401).json({ error: 'Login failed.' })
        return
      }
      res.status(200).json({ accessToken: t.AccessToken, idToken: t.IdToken, refreshToken: t.RefreshToken })
      return
    }

    if (action === 'refresh') {
      if (!refreshToken || !username) {
        res.status(400).json({ error: 'Missing fields.' })
        return
      }
      const out = await client.send(
        new InitiateAuthCommand({
          AuthFlow: 'REFRESH_TOKEN_AUTH',
          ClientId: CLIENT_ID,
          AuthParameters: {
            REFRESH_TOKEN: refreshToken,
            SECRET_HASH: secretHash(username),
          },
        }),
      )
      const t = out.AuthenticationResult
      if (!t) {
        res.status(401).json({ error: 'Refresh failed.' })
        return
      }
      res.status(200).json({ accessToken: t.AccessToken, idToken: t.IdToken })
      return
    }

    res.status(400).json({ error: 'Unknown action.' })
  } catch (err) {
    console.error('auth failed:', action, err)
    res.status(400).json({ error: err instanceof Error ? err.message : 'Auth failed.' })
  }
}
