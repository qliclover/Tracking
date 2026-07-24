import { AppState } from './types'

/**
 * Optional cloud sync via LeanCloud (国内版). Entirely gated by env vars — when
 * they're absent the app is 100% local and none of this code runs.
 *
 * Strategy: a real email+password account (not anonymous — anonymous logins
 * are per-device and can't be reunited across devices). The whole AppState is
 * stored as one JSON document per user. Sync is last-write-wins on updatedAt.
 */

const env = {
  appId: import.meta.env.VITE_LEANCLOUD_APP_ID as string | undefined,
  appKey: import.meta.env.VITE_LEANCLOUD_APP_KEY as string | undefined,
  serverURL: import.meta.env.VITE_LEANCLOUD_SERVER_URL as string | undefined,
}

const CLASS = 'MarginState'
const OBJ_KEY = 'margin.cloud.objectId'

export function isCloudConfigured(): boolean {
  return Boolean(env.appId && env.appKey)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let AV: any = null
let inited = false

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensure(): Promise<any> {
  if (!isCloudConfigured()) throw new Error('Cloud sync is not configured.')
  if (inited) return AV
  const mod = await import('leancloud-storage')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AV = (mod as any).default ?? mod
  AV.init({ appId: env.appId, appKey: env.appKey, serverURL: env.serverURL || undefined })
  inited = true
  return AV
}

export async function isLoggedIn(): Promise<boolean> {
  const av = await ensure()
  return Boolean(av.User.current())
}

export async function currentEmail(): Promise<string | null> {
  const av = await ensure()
  return av.User.current()?.getEmail() ?? av.User.current()?.getUsername() ?? null
}

export async function signUp(email: string, password: string): Promise<void> {
  const av = await ensure()
  const user = new av.User()
  user.setUsername(email)
  user.setEmail(email)
  user.setPassword(password)
  await user.signUp()
  localStorage.removeItem(OBJ_KEY)
}

export async function logIn(email: string, password: string): Promise<void> {
  const av = await ensure()
  await av.User.logIn(email, password)
  localStorage.removeItem(OBJ_KEY)
}

export async function logOut(): Promise<void> {
  const av = await ensure()
  await av.User.logOut()
  localStorage.removeItem(OBJ_KEY)
}

export async function requestPasswordReset(email: string): Promise<void> {
  const av = await ensure()
  await av.User.requestPasswordReset(email)
}

/** Fetch the remote state, or null if none exists yet. */
export async function pull(): Promise<AppState | null> {
  const av = await ensure()
  const user = av.User.current()
  if (!user) return null
  const query = new av.Query(CLASS)
  query.equalTo('owner', user)
  const obj = await query.first()
  if (!obj) return null
  localStorage.setItem(OBJ_KEY, obj.id)
  try {
    return JSON.parse(obj.get('data')) as AppState
  } catch {
    return null
  }
}

/** Write the full state to the cloud. */
export async function push(state: AppState): Promise<void> {
  const av = await ensure()
  const user = av.User.current()
  if (!user) throw new Error('Not logged in.')
  const id = localStorage.getItem(OBJ_KEY)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let obj: any
  if (id) {
    obj = av.Object.createWithoutData(CLASS, id)
  } else {
    const Cls = av.Object.extend(CLASS)
    obj = new Cls()
    obj.set('owner', user)
    obj.setACL(new av.ACL(user))
  }
  obj.set('data', JSON.stringify(state))
  obj.set('stamp', state.updatedAt)
  const saved = await obj.save()
  localStorage.setItem(OBJ_KEY, saved.id)
}
