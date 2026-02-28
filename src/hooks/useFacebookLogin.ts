import { useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export interface FacebookLoginState {
  session: any | null;
  email: string | null;
  name: string | null;
  errorMsg: string | null;
  facebookLoading: boolean;
}

export const useFacebookLogin = () => {
  const [state, setState] = useState<FacebookLoginState>({
    session: null,
    email: null,
    name: null,
    errorMsg: null,
    facebookLoading: false,
  });

  /**
   * Listen auth session from Supabase
   */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔥 Auth event:', event);
      console.log('👤 Session:', session);
      console.log('📧 User:', session?.user);

      if (event === 'SIGNED_OUT' || !session?.user) {
        setState({
          session: null,
          email: null,
          name: null,
          errorMsg: null,
          facebookLoading: false,
        });
      } else if (session?.user) {
        setState(prev => ({
          ...prev,
          session,
          email: session.user.email ?? null,
          name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            null,
          loading: false,
          errorMsg: null,
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);



  /**
   * Trigger Facebook login
   */
  const signInWithFacebook = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, errorMsg: null }));

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: 'smartmoneyfrontend://',
          skipBrowserRedirect: true, // 👈 bắt Supabase chỉ trả URL
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No OAuth URL');

      console.log('🌍 Opening OAuth URL:', data.url);

      // 👉 Mở browser Facebook
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        'smartmoneyfrontend://'
      );

      console.log('🌍 Browser result:', result);

      if (result.type !== 'success') {
        throw new Error('Login cancelled');
      }

      // 👉 LẤY TOKEN TỪ CALLBACK URL
      const url = result.url;
      const hashParams = url.split('#')[1];
      
      if (!hashParams) {
        throw new Error('No tokens in callback URL');
      }

      const params = new URLSearchParams(hashParams);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (!access_token || !refresh_token) {
        throw new Error('Missing tokens in callback URL');
      }

      // 👉 Set session cho Supabase
      const { data: sessionData, error: sessionError } =
        await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

      if (sessionError) throw sessionError;

      console.log('✅ Session set:', sessionData.session);
    } catch (err: any) {
      console.error('❌ Facebook login error:', err.message);
      setState(prev => ({
        ...prev,
        errorMsg: err.message,
        loading: false,
      }));
    }
  };


  /**
   * Sign out
   */
  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      await supabase.auth.signOut();

      setState({
        session: null,
        email: null,
        name: null,
        errorMsg: null,
        facebookLoading: false,
      });
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        errorMsg: err.message,
        loading: false,
      }));
    }
  };

  return {
    ...state,
    signInWithFacebook,
    signOut,
  };
};
