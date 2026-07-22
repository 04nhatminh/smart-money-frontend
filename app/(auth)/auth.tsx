import React, { useState } from "react";
import {
    View,
    StyleSheet,
    SafeAreaView,
    Pressable,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Text,
    StatusBar,
    LayoutAnimation,
    Alert
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from "../../src/context/AuthContext";
import { t } from "../../src/i18n";
import { LanguageSwitch } from "../../src/components/LanguageSwitch";
import { useLanguage } from "../../src/i18n/LanguageProvider";
import { SignInForm } from "../../src/components/auth/SignInForm";
import { SignUpForm } from "../../src/components/auth/SignUpForm";
import OtpVerificationScreen from "../../src/components/auth/OTPVerify";
import { ResetPasswordForm } from "../../src/components/auth/ResetPasswordForm";
import { SocialLogin } from "../../src/components/auth/SocialLogin";
import { AuthTabs } from "../../src/components/auth/AuthTabs";
import { formatDateToDDMMYYYY } from "../../src/utils/dateFormatter";
import { Ionicons } from '@expo/vector-icons';
import authService from "../../src/auth/authService";
import { Keyboard } from "react-native";
import {
    RegisterRequest,
    VerifyEmailRequest,
    SendResetPasswordOtpRequest,
    ResetPasswordRequest
} from "../../src/types/auth.types";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { setPendingVerifyEmail, getPendingVerifyEmail } from "../../src/storage/emailStorage";
const { width, height } = Dimensions.get('window');

export default function AuthScreen() {
    const router = useRouter();
    const { login, checkAuthStatus } = useAuth();
    const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

    // Sign In states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);

    // Sign Up states
    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState<Date>(new Date());

    // OTP states
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [otpEmail, setOtpEmail] = useState<string | null>(null);
    const [otpType, setOtpType] = useState<"VERIFY" | "UPDATE">("VERIFY");

    // ResetPassword states
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [newConfirmPassword, setNewConfirmPassword] = useState("");

    // Error states organized by functionality
    const [signInError, setSignInError] = useState<string | null>(null);
    const [signUpError, setSignUpError] = useState<string | null>(null);
    const [otpError, setOtpError] = useState<string | null>(null);
    const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    // Common states
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { lang } = useLanguage();

    React.useEffect(() => {
        const showSub = Keyboard.addListener("keyboardDidShow", () => {
            setKeyboardVisible(true);
            LayoutAnimation.easeInEaseOut();
        });

        const hideSub = Keyboard.addListener("keyboardDidHide", () => {
            setKeyboardVisible(false);
            LayoutAnimation.easeInEaseOut();
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    const handleSignIn = async () => {
        setSignInError(null);
        setLoading(true);



        try {
            console.log('🔐 Attempting login with email:', email);
            const res = await login(email, password);

            if (res.success) {
                console.log("✅ Login successful");
                return;
            }

            if (res.message === "EMAIL_NOT_VERIFIED") {
                const otp = await authService.checkOtpExists(email);

                if (otp.data) {
                    setOtpEmail(email);
                    setOtpType("VERIFY");
                    setShowOTPModal(true);
                } else {
                    setSignInError(t("auth.email_not_verified"));
                }

                return;
            }

            setSignInError(res.message || t("auth.login_failed"));
        } catch (err: any) {
            console.error('💥 Login error:', err);
            setSignInError(t("auth.login_failed"));
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        setSignUpError(null);
        setSuccess(null);

        // Validation
        if (!fullName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
            setSignUpError(t("auth.fill_required_fields"));
            return;
        }

        if (signupPassword !== confirmPassword) {
            setSignUpError(t("auth.passwords_dont_match"));
            return;
        }

        if (signupPassword.length < 6) {
            setSignUpError(t("auth.password_too_short"));
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(signupEmail)) {
            setSignUpError(t("auth.invalid_email"));
            return;
        }

        setLoading(true);

        try {
            const formattedDate = formatDateToDDMMYYYY(dateOfBirth);

            const registerData: RegisterRequest = {
                username: username.trim() || signupEmail.split('@')[0], // Generate from email if empty
                fullName: fullName.trim(),
                email: signupEmail.trim(),
                password: signupPassword,
                confirmPassword: confirmPassword,
                phone: phone.trim(),
                dateOfBirth: formattedDate,
            };

            console.log('📝 Registering with data:', { ...registerData, password: '***' });
            const response = await authService.register(registerData);

            if (response.success) {
                console.log('✅ Registration successful, showing OTP modal');
                setShowOTPModal(true);
                await setPendingVerifyEmail(signupEmail);
                setOtpEmail(signupEmail);
                setOtpType("VERIFY");
                setSuccess(t("auth.verification_code_sent"));
            } else {

                if((await authService.checkOtpExists(signupEmail)).data) {
                    setOtpEmail(signupEmail);
                    setOtpType("VERIFY");

                    Alert.alert(
                        t("auth.email_not_verified"),
                        t("auth.email_signed_up_yet"),
                        [
                            {
                                text:t("auth.verify_now"),
                                onPress:()=>{
                                    setShowOTPModal(true);
                                }
                            }
                        ]
                    );

                    return;
                }

                console.log('❌ Registration failed:', response.message);
                setSignUpError(t("auth.registration_failed"));

                if (response.errors) {
                    const errorMessages = Object.values(response.errors).flat();
                    setSignUpError(errorMessages.join(", "));
                }
                
            }
        } catch (err: any) {
            console.error("💥 Registration error:", err);
            setSignUpError(t("auth.registration_error"));
        } finally {
            setLoading(false);
        }
    };

    const onVerifyOtp = async (email: string, otpString: string) => {
        try {
            setLoading(true);
            const request: VerifyEmailRequest = {
                email: email,
                otp: otpString
            };

            console.log('🔐 Verifying OTP for:', email);
            const res = await authService.verifyEmail(request);

            if (res.success) {
                console.log('✅ OTP verified successfully');
                setShowOTPModal(false);
                await setPendingVerifyEmail(null);
                setActiveTab("signin");
                setSuccess(t("auth.email_verified"));

                // Auto-fill email for sign in
                setEmail(email);
            } else {
                console.log('❌ OTP verification failed:', res.message);
                setOtpError(res.message || t("auth.verification_failed"));
            }
            return res;
        } catch (error: any) {
            console.error('💥 OTP verification error:', error);
            setOtpError(t("auth.verification_failed"));
            return { success: false, message: error.message };
        } finally {
            setLoading(false);
        }
    };

    const onVerifyResetPassword = async (email: string, otpString: string) => {
        try {
            setLoading(true);
            const request: VerifyEmailRequest = {
                email: email,
                otp: otpString
            };

            console.log('🔐 Verifying reset password OTP for:', email);
            const res = await authService.verifyResetPassword(request);

            if (res.success) {
                console.log('✅ Reset password OTP verified');
                setShowResetPassword(true);
                await setPendingVerifyEmail(null);
                setShowOTPModal(false);
                setSuccess(t("auth.email_verified"));
            } else {
                console.log('❌ Reset password OTP verification failed:', res.message);
                setOtpError(t("auth.verification_failed"));
            }
            return res;
        } catch (error: any) {
            console.error('💥 Reset password OTP error:', error);
            setOtpError(t("auth.verification_failed"));
            return { success: false, message: error.message };
        } finally {
            setLoading(false);
        }
    };

    const onResendOtp = async (email: string) => {
        try {
            setLoading(true);
            const request: SendResetPasswordOtpRequest = {
                email: email
            };

            console.log('📧 Resending OTP to:', email);
            let res;

            if (otpType === "VERIFY") {
                res = await authService.forgotPassword(request);
            } else {
                res = await authService.resendOTP(request);
            }

            if (res.success) {
                console.log('✅ OTP resent successfully');
                setSuccess(t("auth.otp_resent"));
            } else {
                console.log('❌ Failed to resend OTP:', res.message);
                setOtpError(t("auth.resend_failed"));
            }

            return res;
        } catch (error: any) {
            console.error('💥 Resend OTP error:', error);
            setOtpError(t("auth.resend_failed"));
            return { success: false, message: error.message };
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email.trim()) {
            setSignInError(t("auth.require_email"));
            return;
        }

        try {
            setLoading(true);
            const request: SendResetPasswordOtpRequest = {
                email: email
            };

            console.log('🔑 Requesting password reset for:', email);
            const res = await authService.forgotPassword(request);

            if (res.success) {
                console.log('✅ Password reset OTP sent');
                await setPendingVerifyEmail(email);
                setOtpEmail(email);
                setOtpType("UPDATE");
                setShowOTPModal(true);
                setSuccess(t("auth.reset_code_sent"));
            } else {
                console.log('❌ Password reset request failed:', res.message);
                setSignInError(t("auth.reset_request_failed"));
            }
            return res;
        } catch (error: any) {
            console.error('💥 Forgot password error:', error);
            setSignInError(t("auth.reset_request_failed"));
            return { success: false, message: error.message };
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        setResetPasswordError(null);
        setLoading(true);

        const pendingEmail = await getPendingVerifyEmail();
        if (!pendingEmail) {
            setResetPasswordError(t("auth.email_not_found"));
            setLoading(false);
            return;
        }

        if (newPassword !== newConfirmPassword) {
            setResetPasswordError(t("auth.passwords_dont_match"));
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setResetPasswordError(t("auth.password_too_short"));
            setLoading(false);
            return;
        }

        try {
            console.log('🔄 Resetting password for:', await getPendingVerifyEmail());
            const otpEmail = await getPendingVerifyEmail();
            if (!otpEmail) {
                setResetPasswordError(t("auth.email_not_found"));
                setLoading(false);
                return;
            }
            const request: ResetPasswordRequest = {
                email: otpEmail,
                newPassword: newPassword
            };

            const res = await authService.resetPassword(request);

            if (res.success) {
                console.log('✅ Password reset successful');
                setSuccess(t("auth.password_reset_success"));
                setShowResetPassword(false);
                setOtpEmail(null);
                await setPendingVerifyEmail(null);
                setActiveTab("signin");

                // Auto-fill email for sign in
                setEmail(otpEmail);

                // Clear reset token
                await authService.clearAuthData();
            } else {
                console.log('❌ Password reset failed:', res.message);
                setResetPasswordError(t("auth.reset_failed"));
            }
        } catch (err: any) {
            console.error('💥 Reset password error:', err);
            const message = err.response?.data?.message;

            if (message?.includes('expired')) {
                setResetPasswordError(t('auth.reset_token_expired'));
            } else {
                setResetPasswordError(t('common.error'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        console.log('👤 Google login initiated');
        // The actual Google login flow will be handled by SocialLogin component
        // onSuccessSocialLogin will be called after successful authentication
    };

    const handleFacebookLogin = () => {
        console.log('👤 Facebook login initiated');
        // The actual Facebook login flow will be handled by SocialLogin component
        // onSuccessSocialLogin will be called after successful authentication
    };

    const onSuccessSocialLogin = async () => {
        try {
            console.log('🔄 Social login successful, updating auth status...');
            // Update auth context state
            await checkAuthStatus();
        } catch (error) {
            console.error("❌ Error updating auth status:", error);
        }
    };

    const goBack = () => {
        if (showResetPassword) {
            setShowResetPassword(false);
        } else if (showOTPModal) {
            setShowOTPModal(false);
        } else {
            router.back();
        }
    };

    // Clear success message after 5 seconds
    React.useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    return (
        <SafeAreaView style={styles.safe}>

            <KeyboardAwareScrollView
                enableOnAndroid
                extraScrollHeight={20}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <StatusBar barStyle="light-content" backgroundColor="#3629B7" />

                {/* Gradient Background */}
                <LinearGradient
                    colors={['#3629B7', '#5655B9', '#A8A3D7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBackground}
                >
                    {/* Decorative Circles */}
                    <View style={styles.circle1} />
                    <View style={styles.circle2} />
                    <View style={styles.circle3} />
                </LinearGradient>

                {/* Header with Back Button */}
                <Pressable style={styles.exitBtn} onPress={goBack}>
                    <View style={styles.exitBtnInner}>
                        <Ionicons name="arrow-back" size={24} color="#3629B7" />
                    </View>
                </Pressable>

                {/* Language Switch */}
                <View style={styles.languageSwitchContainer}>
                    <LanguageSwitch />
                </View>

                {/* Main Content */}
                <View style={styles.container}>
                    {/* Logo/Title Section */}
                    {!isKeyboardVisible && (
                        <View style={styles.logoContainer}>
                            <Text style={styles.appName}>Smart Money</Text>
                            <Text style={styles.appTagline}>{t("auth.welcome")}</Text>
                        </View>
                    )}
                    {/* Form Section */}
                    <View style={styles.formWrapper}>
                        <View style={styles.formCard}>
                            {showResetPassword ? (
                                <ResetPasswordForm
                                    password={newPassword}
                                    setPassword={setNewPassword}
                                    confirmPassword={newConfirmPassword}
                                    setConfirmPassword={setNewConfirmPassword}
                                    error={resetPasswordError}
                                    loading={loading}
                                    onResetPassword={handleResetPassword}
                                />
                            ) : showOTPModal && otpEmail ? (
                                <OtpVerificationScreen
                                    email={otpEmail}
                                    type={otpType}
                                    onVerifyOtp={onVerifyOtp}
                                    OnForgetPassword={onVerifyResetPassword}
                                    onResendOtp={onResendOtp}
                                />
                            ) : (
                                <>
                                    <AuthTabs
                                        activeTab={activeTab}
                                        onTabChange={setActiveTab}
                                    />

                                    {activeTab === "signin" ? (
                                        <KeyboardAvoidingView
                                            behavior={Platform.OS === 'android' ? 'height' : 'padding'}
                                        >
                                            <SignInForm
                                                email={email}
                                                setEmail={setEmail}
                                                password={password}
                                                setPassword={setPassword}
                                                rememberMe={rememberMe}
                                                setRememberMe={setRememberMe}
                                                error={signInError}
                                                loading={loading}
                                                onSignIn={handleSignIn}
                                                onForgotPassword={handleForgotPassword}
                                            />
                                        </KeyboardAvoidingView>
                                    ) : (


                                        <SignUpForm
                                            fullName={fullName}
                                            setFullName={setFullName}
                                            email={signupEmail}
                                            setEmail={setSignupEmail}
                                            password={signupPassword}
                                            setPassword={setSignupPassword}
                                            confirmPassword={confirmPassword}
                                            setConfirmPassword={setConfirmPassword}
                                            phone={phone}
                                            setPhone={setPhone}
                                            dateOfBirth={dateOfBirth}
                                            setDateOfBirth={setDateOfBirth}
                                            error={signUpError}
                                            loading={loading}
                                            onSignUp={handleSignUp}
                                        />
                                    )}

                                    {activeTab === "signin" && (
                                        <View style={styles.socialSection}>
                                            <SocialLogin
                                                onGoogleLogin={handleGoogleLogin}
                                                onFacebookLogin={handleFacebookLogin}
                                                onSuccess={onSuccessSocialLogin}
                                            />
                                        </View>
                                    )}
                                </>
                            )}

                            {/* Success Toast */}
                            {success && (
                                <View style={[styles.toast, styles.successToast]}>
                                    <Text style={styles.toastText}>
                                        {success}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </KeyboardAwareScrollView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#3629B7',
    },
    gradientBackground: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    circle1: {
        position: 'absolute',
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: -width * 0.2,
        right: -width * 0.2,
    },
    circle2: {
        position: 'absolute',
        width: width * 0.6,
        height: width * 0.6,
        borderRadius: width * 0.3,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        bottom: -width * 0.1,
        left: -width * 0.2,
    },
    circle3: {
        position: 'absolute',
        width: width * 0.4,
        height: width * 0.4,
        borderRadius: width * 0.2,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        top: height * 0.3,
        right: width * 0.1,
    },
    container: {
        flex: 1,
    },
    logoContainer: {
        paddingTop: 60,
        display: 'flex',
        height: height * 0.2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appName: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    appTagline: {
        fontSize: 16,
        color: '#F2F1F9',
        opacity: 0.9,
        letterSpacing: 0.3,
    },
    formWrapper: {
        display: 'flex',
        justifyContent: 'flex-end',
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 40,
        minHeight: height * 0.6,
        shadowColor: '#3629B7',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
        height: height * 0.8
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    exitBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 20,
        zIndex: 100,
    },
    exitBtnInner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#3629B7',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    languageSwitchContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        right: 20,
        zIndex: 100,
    },
    socialSection: {
        marginTop: 20,
    },
    toast: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        zIndex: 1000,
    },
    successToast: {
        backgroundColor: '#4CAF50',
    },
    errorToast: {
        backgroundColor: '#F44336',
    },
    toastText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});