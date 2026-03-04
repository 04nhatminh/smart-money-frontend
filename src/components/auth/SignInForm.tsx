import React, {useState} from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { t } from "../../i18n";
import { InputField } from '../InputField';
import { SubmitButton } from '../SubmitButton';
import { RememberMeCheckbox } from './RememberMeCheckbox';
import { ErrorMessage } from './ErrorMessage';

interface SignInFormProps {
    email: string;
    setEmail: (email: string) => void;
    password: string;
    setPassword: (password: string) => void;
    rememberMe: boolean;
    setRememberMe: (rememberMe: boolean) => void;
    error: string | null;
    loading: boolean;
    onSignIn: () => void;
    onForgotPassword?: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    error,
    loading,
    onSignIn,
    onForgotPassword
}) => {
    const [forgotDisabled, setForgotDisabled] = useState(false);

    const handleForgotPassword = () => {
        if (forgotDisabled) return;
        if (!onForgotPassword) return;

        setForgotDisabled(true);

        try {
            onForgotPassword();
        } finally {
            setForgotDisabled(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Email Input Field */}
            <InputField
                iconName="mail-outline"
                placeholder={t('common.email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
            />

            {/* Password Input Field */}
            <InputField
                iconName="lock-closed-outline"
                placeholder={t('common.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            {/* Error Message */}
            <ErrorMessage message={error} />

            {/* Remember Me & Forgot Password Row */}
            <View style={styles.rememberForgotRow}>
                <RememberMeCheckbox
                    isChecked={rememberMe}
                    onToggle={setRememberMe}
                    label={t("auth.remember_me")}
                />

                <Pressable 
                    style={styles.forgotPasswordBtn} 
                    onPress={handleForgotPassword}   
                    disabled={forgotDisabled}
                >
                    <Text style={[
                        styles.forgotPasswordText,
                        forgotDisabled && styles.forgotPasswordDisabled
                    ]}>
                        {t("auth.forgot_password")}
                    </Text>
                </Pressable>
            </View>

            {/* Sign In Button */}
            <SubmitButton
                label={t("common.sign_in")}
                onPress={onSignIn}
                loading={loading}
                loadingText={t("auth.sign_in_loading")}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    rememberForgotRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    forgotPasswordBtn: {
        paddingVertical: 4,
    },
    forgotPasswordText: {
        color: '#3629B7',
        fontSize: 13,
        fontWeight: '600',
        textDecorationLine: 'underline',
        textDecorationColor: '#3629B7',
    },
    forgotPasswordDisabled: {
        opacity: 0.5,
        textDecorationLine: 'none',
    },
});