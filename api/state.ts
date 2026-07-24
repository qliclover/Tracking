import type { VercelRequest, VercelResponse } from '@vercel/node'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { CognitoJwtVerifier } from 'aws-jwt-verify'

const REGION = process.env.AWS_REGION || 'us-east-1'
const TABLE = process.env.DYNAMODB_TABLE || 'MarginState'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))

const verifier =
  process.env.COGNITO_USER_POOL_ID && process.env.COGNITO_CLIENT_ID
    ? CognitoJwtVerifier.create({
        userPoolId: process.env.COGNITO_USER_POOL_ID,
        tokenUse: 'access',
        clientId: process.env.COGNITO_CLIENT_ID,
      })
    : null

async function userIdFrom(req: VercelRequest): Promise<string | null> {
  const header = req.headers.authorization
  if (!verifier || !header?.startsWith('Bearer ')) return null
  try {
    const payload = await verifier.verify(header.slice(7))
    return payload.sub
  } catch {
    return null
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await userIdFrom(req)
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated.' })
    return
  }

  if (req.method === 'GET') {
    const out = await ddb.send(new GetCommand({ TableName: TABLE, Key: { userId } }))
    if (!out.Item) {
      res.status(200).json({ state: null })
      return
    }
    res.status(200).json({ state: JSON.parse(out.Item.data as string) })
    return
  }

  if (req.method === 'PUT') {
    const { state } = (req.body ?? {}) as { state?: { updatedAt?: number } }
    if (!state) {
      res.status(400).json({ error: 'No state provided.' })
      return
    }
    await ddb.send(
      new PutCommand({
        TableName: TABLE,
        Item: { userId, data: JSON.stringify(state), updatedAt: state.updatedAt ?? Date.now() },
      }),
    )
    res.status(200).json({ ok: true })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
