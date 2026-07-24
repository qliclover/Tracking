import { useRef, useState } from 'react'
import { Profile } from '../lib/types'
import { fileToAvatar } from '../lib/image'
import { useT } from '../lib/i18n'

interface Props {
  profile: Profile
  onProfile: (p: Profile) => void
  onBack: () => void
}

export function ProfilePage({ profile, onProfile, onBack }: Props) {
  const t = useT()
  const [name, setName] = useState(profile.name ?? '')
  const avatarInput = useRef<HTMLInputElement>(null)

  function commitName() {
    onProfile({ ...profile, name: name.trim() || undefined })
  }

  async function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      onProfile({ ...profile, avatar: await fileToAvatar(file) })
    } catch {
      /* ignore */
    }
  }

  const initial = (profile.name?.trim()?.[0] || '余').toUpperCase()

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <div className="wordmark serif">{t('your_name')}</div>
          <span className="month">有余 · Margin</span>
        </div>
        <button className="theme-toggle" onClick={onBack}>{t('done')}</button>
      </header>

      <section className="setting-block">
        <div className="profile-row">
          <button className="avatar avatar-lg" onClick={() => avatarInput.current?.click()}>
            {profile.avatar ? <img src={profile.avatar} alt="" /> : <span>{initial}</span>}
          </button>
          <div className="profile-fields">
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="flabel" htmlFor="name">{t('your_name')}</label>
              <input
                id="name"
                placeholder={t('optional')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={commitName}
              />
            </div>
            <div className="avatar-actions">
              <button className="link" onClick={() => avatarInput.current?.click()}>
                {profile.avatar ? t('change_photo') : t('add_photo')}
              </button>
              {profile.avatar && (
                <button className="link danger" onClick={() => onProfile({ ...profile, avatar: undefined })}>
                  {t('remove')}
                </button>
              )}
            </div>
          </div>
        </div>
        <input ref={avatarInput} type="file" accept="image/*" onChange={pickAvatar} style={{ display: 'none' }} />
      </section>

      <footer className="footer">有余 · {t('tagline')}</footer>
    </div>
  )
}
