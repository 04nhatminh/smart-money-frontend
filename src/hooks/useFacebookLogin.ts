import { useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';
import * as Linking from "expo-linking";

const redirectTo = Linking.createURL("");

WebBrowser.maybeCompleteAuthSession();

console.log("redirectTo =", redirectTo);

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

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: Linking.createURL("/"), // Trả về app sau khi đăng nhập
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Mở trình duyệt với URL đăng nhập Facebook
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        console.log("OAuth result =", result);
        // Xử lý kết quả (tuỳ chọn)
        if (result.type === 'success') {
            const hash = result.url.split("#")[1];

            const params = new URLSearchParams(hash);

            const { data: sessionData, error } = await supabase.auth.setSession({
              access_token: params.get("access_token")!,
              refresh_token: params.get("refresh_token")!,
            });

            console.log("setSession error =", error);
            console.log("setSession data =", sessionData);

            const session = await supabase.auth.getSession();
            console.log("current session =", session);
        } else if (result.type === 'cancel') {
          setState(prev => ({ ...prev, errorMsg: 'Đăng nhập bị huỷ', facebookLoading: false }));
        }
      }
    } catch (err: any) {
      setState(prev => ({ ...prev, errorMsg: err.message, facebookLoading: false }));
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