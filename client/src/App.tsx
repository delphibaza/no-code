import './index.css'
import { useState, useEffect } from 'react'
import { createClient, Session } from '@supabase/supabase-js'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { Button } from './components/ui/button'

const supabase = createClient('https://yvieqjqbspmtoabaozog.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2aWVxanFic3BtdG9hYmFvem9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4Njg2NTEsImV4cCI6MjA1MDQ0NDY1MX0.Qs0P1Gj0UeLcuODk3HZ0BaftDeelU96zYdxQNx1hFC8')

export default function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    console.log(error);
  }

  if (!session) {
    return (<Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />)
  }
  else {
    return (
      <div>
        Logged in!
        <Button onClick={signOut}>Log out</Button>
      </div>
    )
  }
}