import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

function createSupabaseMock(): any {
  const error = new Error("Supabase no está configurado (faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY)")
  return {
    auth: {
      async getSession() {
        return { data: { session: null } }
      },
      async getUser() {
        return { data: { user: null } }
      },
      async signOut() {
        return {}
      },
      async signInWithPassword() {
        return { error }
      },
      async signInWithOAuth() {
        return { error }
      },
    },
    from() {
      return {
        async select() {
          return { data: [], error }
        },
        async insert() {
          return { error }
        },
        async update() {
          return { error }
        },
        async delete() {
          return { error }
        },
        order() {
          return this
        },
        eq() {
          return this
        },
        upsert() {
          return { error }
        },
      }
    },
    storage: {
      from() {
        return {
          async upload() {
            return { error }
          },
          getPublicUrl(_path: string) {
            return { data: { publicUrl: "" } }
          },
        }
      },
    },
  }
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      })
    : createSupabaseMock()

export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function signOut() {
  await supabase.auth.signOut()
}
