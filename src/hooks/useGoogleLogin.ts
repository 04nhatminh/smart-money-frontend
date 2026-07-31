import { useEffect, useState } from 'react';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  // webClientId quyết định `aud` của idToken gửi cho backend -> giữ chung cho cả 2 nền tảng
  webClientId: process.env.EXPO_PUBLIC_SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID,
  // iOS bắt buộc có OAuth client riêng loại iOS, Android bỏ qua field này
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

export interface GoogleLoginState {
  token: string | null;
  email: string | null;
  errorMsg: string | null;
  googleLoading: boolean;
}

export const useGoogleLogin = () => {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.signOut(); // luôn clean session khi mở app (debug dễ)
  }, []);

  const signInWithGoogle = async () => {
    try {
      setGoogleLoading(true);
      setErrorMsg(null);

      await GoogleSignin.hasPlayServices();

      const userInfo = await GoogleSignin.signIn();

      console.log('GOOGLE USER INFO:', userInfo);

      if (userInfo.data) {
        setEmail(userInfo.data.user.email);
        setToken(userInfo.data.idToken); // 👈 TOKEN ở đây
      }
    } catch (error: any) {
      console.log('GOOGLE LOGIN ERROR:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        setErrorMsg('User cancelled login');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        setErrorMsg('Login in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setErrorMsg('Play services not available');
      } else {
        setErrorMsg(error.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      setToken(null);
      setEmail(null);
      setErrorMsg(null);
    } catch (error) {
      console.log('GOOGLE SIGN OUT ERROR:', error);
    }
  };

  return {
    token,
    email,
    errorMsg,
    googleLoading,
    signInWithGoogle,
    signOut,
  };
};
