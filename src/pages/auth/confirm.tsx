import { GetServerSidePropsContext } from 'next'
import { createClient } from '@/utils/supabase/server'

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  try {
    const q = ctx.query || {}
    const getParam = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : (v || '')
    const token_hash = getParam(q.token_hash)
    const rawType = getParam(q.type)
    const next = getParam(q.next) || '/'

    if (token_hash && rawType) {
      const supabase = createClient({ req: ctx.req as any, res: ctx.res as any })

      // Supabase erwartet bei E-Mail-Bestätigung den Typ 'email'
      const verifyType = rawType === 'email' || rawType === 'signup' ? 'email' : 'email'
      const { error } = await supabase.auth.verifyOtp({ type: verifyType as any, token_hash })

      if (!error) {
        return {
          redirect: {
            destination: next,
            permanent: false,
            statusCode: 303,
          },
        }
      }
    }

    return {
      redirect: {
        destination: '/auth/login?error=auth_code',
        permanent: false,
        statusCode: 303,
      },
    }
  } catch (e) {
    return {
      redirect: {
        destination: '/auth/login?error=unexpected',
        permanent: false,
        statusCode: 303,
      },
    }
  }
}

export default function ConfirmPage() {
  return null
}
