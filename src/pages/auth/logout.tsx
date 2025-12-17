import { GetServerSidePropsContext } from 'next'
import { createClient } from '@/utils/supabase/server'

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  try {
    const supabase = createClient({ req: ctx.req as any, res: ctx.res as any })
    // Global sign-out to invalidate all refresh tokens; falls back to local if not supported
    try {
      // @ts-ignore - scope option may not be in older typings
      await supabase.auth.signOut({ scope: 'global' } as any)
    } catch {
      await supabase.auth.signOut()
    }

    // Hard-fallback: ensure our custom cookie is cleared for both host and primary domain
    const cookieBase = 'contact-tables-auth=; Path=/; Max-Age=0; SameSite=Lax'
    const host = ctx.req.headers.host || ''
    const isProd = process.env.NODE_ENV === 'production'
    const headers: string[] = []

    headers.push(`${cookieBase}`)
    if (isProd && (host.includes('contact-tables.org'))) {
      headers.push(`${cookieBase}; Domain=.contact-tables.org`)
    }

    // Append Set-Cookie headers without clobbering others
    const existing = ctx.res.getHeader('Set-Cookie')
    const combined = Array.isArray(existing) ? existing.concat(headers) : headers
    ctx.res.setHeader('Set-Cookie', combined)
  } catch (e) {
    // ignore and proceed to redirect
  }

  return {
    redirect: {
      destination: '/',
      permanent: false,
    },
  }
}

export default function Logout() {
  return null
}
