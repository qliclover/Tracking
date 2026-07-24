import { AppState } from './types'

/**
 * Optional cloud sync via LeanCloud (国内版). Entirely gated by env vars — when
 * they're absent the app is 100% local and none of this code runs.
 *
 * Strategy: anonymous login gives each user an account; the whole AppState is
 * stored as one JSON document per user. Sync is last-write-wins on updatedAt.
 * Deliberately simple — good enough for a single person across their devices.
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
let ready = false

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensure(): Promise<any> {
  if (ready) return AV
  if (!isCloudConfigured()) throw new Error('Cloud sync is not configured.')
  const mod = await import('leancloud-storage')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AV = (mod as any).default ?? mod
  AV.init({ appId: env.appId, appKey: env.appKey, serverURL: env.serverURL || undefined })
  if (!AV.User.current()) {
    await AV.User.loginAnonymously()
  }
  ready = true
  return AV
}

/** Fetch the remote state, or null if none exists yet. */
export async function pull(): Promise<AppState | null> {
  const av = await ensure()
  const query = new av.Query(CLASS)
  query.equalTo('owner', av.User.current())
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
