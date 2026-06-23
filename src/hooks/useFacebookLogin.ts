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

  // 1. Lắng nghe auth state – dùng optional chaining để tránh lỗi null
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔥 Auth event:', event);
      console.log('👤 Session:', session);
      console.log('📧 User:', session?.user);

      if (event === 'SIGNED_OUT' || !session || !session.user) {
        setState({
          session: null,
          email: null,
          name: null,
          errorMsg: null,
          facebookLoading: false,
        });
      } else {
        // Dùng optional chaining để TypeScript không phàn nàn
        setState(prev => ({
          ...prev,
          session,
          email: session.user?.email ?? null,
          name:
            session.user?.user_metadata?.full_name ||
            session.user?.user_metadata?.name ||
            null,
          facebookLoading: false,
          errorMsg: null,
        }));
      }
    });

    // Lấy subscription an toàn, nếu data null thì subscription = null
    const subscription = (data as any)?.subscription ?? null;


    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  // 2. Đăng nhập Facebook – dùng signIn (v1) thay vì signInWithOAuth (v2)
  const signInWithFacebook = async () => {
    try {
      setState(prev => ({ ...prev, facebookLoading: true, errorMsg: null }));

      const { url: authUrl, error } = await supabase.auth.signIn(
        { provider: 'facebook' },
        { redirectTo: 'smartmoneyfrontend://' }
      );


      if (error) throw error;
      if (!authUrl) throw new Error('No OAuth URL');

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'smartmoneyfrontend://'
      );

      console.log('🌍 Browser result:', result);

      if (result.type !== 'success') {
        throw new Error('Login cancelled');
      }

      const url = result.url;
      const hashParams = url.split('#')[1];
      if (!hashParams) {
        throw new Error('No tokens in callback URL');
      }

      const params = new URLSearchParams(hashParams);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (!access_token) {
        throw new Error('Missing access token in callback');
      }

      // 3. Dùng setAuth (v1) thay vì setSession (v2)
      // @ts-ignore – vì kiểu của supabase v1 không có setAuth, nhưng thực tế có
      const { data: sessionData, error: sessionError } = await supabase.auth.setAuth(access_token);

      if (sessionError) throw sessionError;

      console.log('✅ Session set:', sessionData);
    } catch (err: any) {
      console.error('❌ Facebook login error:', err.message);
      setState(prev => ({
        ...prev,
        errorMsg: err.message,
        facebookLoading: false,
      }));
    }
  };

  // 4. Đăng xuất – giữ nguyên
  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, facebookLoading: true }));
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
        facebookLoading: false,
      }));
    }
  };

  return {
    ...state,
    signInWithFacebook,
    signOut,
  };
};