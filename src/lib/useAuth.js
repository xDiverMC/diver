// src/lib/useAuth.js
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useAuth() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  return { session, loading: session === undefined };
}
