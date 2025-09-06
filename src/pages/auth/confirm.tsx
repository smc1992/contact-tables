import { GetServerSidePropsContext } from 'next'
import { createClient } from '@/utils/supabase/server'

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  try {
    const token_hash = (ctx.query.token_hash as string) || ''
    const type = (ctx.query.type as string) || ''
    const next = (ctx.query.next as string) || '/'

    if (token_hash && type) {
      const supabase = createClient({ req: ctx.req as any, res: ctx.res as any })

      const { error } = await supabase.auth.verifyOtp({
        type: type as any,
        token_hash,
      })

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
