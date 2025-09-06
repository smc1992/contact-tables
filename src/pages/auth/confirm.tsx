import { GetServerSidePropsContext } from 'next'
import { createClient } from '@/utils/supabase/server'

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  try {
    const q = ctx.query || {}
    const getParam = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : (v || '')
    const token_hash = getParam(q.token_hash)
    const rawType = getParam(q.type)
    const rawNext = getParam(q.next) || '/'

    if (token_hash && rawType) {
      const supabase = createClient({ req: ctx.req as any, res: ctx.res as any })

      // Supabase erwartet bei E-Mail-Bestätigung den Typ 'email'
      const verifyType = rawType === 'email' || rawType === 'signup' ? 'email' : 'email'
      const { error } = await supabase.auth.verifyOtp({ type: verifyType as any, token_hash })

      if (!error) {
        // Ziel-URL sicher bestimmen
        let destination = '/'
        try {
          const decoded = decodeURIComponent(rawNext)
          // Nur unsere eigene Domain erlauben oder interne Pfade
          if (
            decoded.startsWith('/') ||
            decoded.startsWith('https://contact-tables.org')
          ) {
            destination = decoded
          }
        } catch {
          destination = '/'
        }
        return {
          redirect: {
            destination,
            permanent: false,
          },
        }
      }
    }

    return {
      redirect: {
        destination: `/auth/login?error=auth_code&reason=${encodeURIComponent('verify_failed_or_missing_params')}`,
        permanent: false,
      },
    }
  } catch (e) {
    return {
      redirect: {
        destination: `/auth/login?error=unexpected&reason=${encodeURIComponent((e as Error)?.message || 'unknown')}`,
        permanent: false,
      },
    }
  }
}

export default function ConfirmPage() {
  return null
}
