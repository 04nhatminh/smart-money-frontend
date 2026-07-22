import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { t } from '../../i18n';
import { useGoogleLogin } from '../../hooks/useGoogleLogin';
import { useFacebookLogin } from '../../hooks/useFacebookLogin';
import authService from '../../auth/authService';

interface SocialLoginProps {
    onGoogleLogin?: () => void;
    onFacebookLogin?: () => void;
    onSuccess?: () => void;
    onError?: (error: string) => void;
    disabled?: boolean;
}

type LoginMethod = 'google' | 'facebook' | null;

const googleIcon = require("../../../assets/google-icon.png");

export const SocialLogin: React.FC<SocialLoginProps> = ({
    onGoogleLogin,
    onFacebookLogin,
    onSuccess,
    onError,
    disabled = false
}) => {
    const [activeMethod, setActiveMethod] = useState<LoginMethod>(null);
    const [processingToken, setProcessingToken] = useState<boolean>(false);
    
    const { token, signInWithGoogle, googleLoading: googleLoading } = useGoogleLogin();
    const { session, signInWithFacebook, facebookLoading: facebookLoading } = useFacebookLogin();

    // Xử lý khi có token Google mới
    useEffect(() => {
        const processGoogleToken = async () => {
            if (token && activeMethod === 'google' && !processingToken) {
                try {
                    console.log('🔐 Processing Google token...');
                    setProcessingToken(true);
                    
                    // Gọi API đăng nhập với Google
                    const response = await authService.googleLogin({ idToken: token });
                    
                    console.log('✅ Google login response:', response.success);
                    
                    if (response.success) {
                        console.log('🎉 Calling onGoogleLogin and onSuccess callbacks...');
                        onGoogleLogin?.();
                        onSuccess?.();
                    } else {
                        throw new Error(response.message || 'Đăng nhập với Google thất bại');
                    }
                } catch (error: any) {
                    console.error('❌ Google login API error:', error);
                    const errorMessage = error.message || 'Đã xảy ra lỗi khi đăng nhập với Google';
                    onError?.(errorMessage);
                    Alert.alert('Lỗi', errorMessage);
                } finally {
                    setActiveMethod(null);
                    setProcessingToken(false);
                }
            }
        };

        processGoogleToken();
    }, [token, activeMethod, onGoogleLogin, onSuccess, onError]);

    // Xử lý khi có session Facebook mới
    useEffect(() => {
        const processFacebookSession = async () => {
            if (session?.access_token && activeMethod === 'facebook' && !processingToken) {
                try {
                    setProcessingToken(true);
                    
                    // Gọi API đăng nhập với Facebook
                    const response = await authService.facebookLogin({ 
                        accessToken: session.access_token 
                    });
                    
                    if (response.success) {
                        onFacebookLogin?.();
                        onSuccess?.();
                        Alert.alert('Thành công', 'Đăng nhập với Facebook thành công!');
                    } else {
                        throw new Error(response.message || 'Đăng nhập với Facebook thất bại');
                    }
                } catch (error: any) {
                    console.error('Facebook login API error:', error);
                    const errorMessage = error.message || 'Đã xảy ra lỗi khi đăng nhập với Facebook';
                    onError?.(errorMessage);
                    Alert.alert('Lỗi', errorMessage);
                } finally {
                    setActiveMethod(null);
                    setProcessingToken(false);
                }
            }
        };

        processFacebookSession();
    }, [session, activeMethod, onFacebookLogin, onSuccess, onError]);

    const handleLogin = (method: 'google' | 'facebook') => {
        if (disabled || activeMethod !== null) return;
        
        setActiveMethod(method);
        
        if (method === 'google') {
            signInWithGoogle();
        } else {
            signInWithFacebook();
        }
    };

    const isGoogleLoading = activeMethod === 'google' && (googleLoading || processingToken);
    const isFacebookLoading = activeMethod === 'facebook' && (facebookLoading || processingToken);

    const isAnyLoading =
    disabled ||
    processingToken ||
    googleLoading ||
    facebookLoading ||
    activeMethod !== null;

    return (
        <>
            <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>{t("auth.or_login_with")}</Text>
                <View style={styles.divider} />
            </View>

            <View style={styles.socialRow}>
                <Pressable 
                    style={[
                        styles.socialBtn, 
                        styles.googleBtn,
                        (disabled || isGoogleLoading) && styles.disabledBtn
                    ]}
                    onPress={() => handleLogin('google')}
                    disabled={disabled || isGoogleLoading}
                >
                    {isAnyLoading ? (
                        <ActivityIndicator size="small" color="#444" />
                    ) : (
                        <>
                            <Image 
                                source={googleIcon}
                                style={styles.google}
                                resizeMode="contain"
                            />
                            <Text style={styles.socialText}> Google</Text>
                        </>
                    )}
                </Pressable>

                <Pressable 
                    style={[
                        styles.socialBtn, 
                        styles.facebookBtn,
                        (disabled || isFacebookLoading) && styles.disabledBtn
                    ]}
                    onPress={() => handleLogin('facebook')}
                    disabled={disabled || isFacebookLoading}
                >
                    {isAnyLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <FontAwesome name="facebook" size={18} color="#fff" />
                            <Text style={[styles.socialText, styles.facebookText]}>
                                Facebook
                            </Text>
                        </>
                    )}
                </Pressable>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 24,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: "#E5E7EB",
    },
    dividerText: {
        marginHorizontal: 12,
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "600",
    },
    socialRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    },
    socialBtn: {
        flex: 1,
        padding: 20,
        borderRadius: 36,
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: 6,
        borderWidth: 1,
        display: "flex",
        flexDirection: "row",
        gap: 6,
        minHeight: 56,
    },
    googleBtn: {
        backgroundColor: "#fff",
        borderColor: "#ddd",
    },
    facebookBtn: {
        backgroundColor: "#1877F2",
        borderColor: "#1877F2",
    },
    disabledBtn: {
        opacity: 0.5,
    },
    google: {
        width: 18,
        height: 18,
        resizeMode: "contain",
    },
    socialText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#444",
    },
    facebookText: {
        color: "#fff",
    }
});