import React, {useState, useRef, useCallback} from 'react';
import { 
    View, 
    Text, 
    Pressable, 
    StyleSheet, 
    ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { t } from "../../i18n";
import { InputField } from './InputField';
import { SubmitButton } from './SubmitButton';
import { ErrorMessage } from './ErrorMessage';

interface SignUpFormProps {
    fullName: string;
    setFullName: (v: string) => void;
    email: string;
    setEmail: (v: string) => void;
    phone: string;
    setPhone: (v: string) => void;
    dateOfBirth: Date;
    setDateOfBirth: (v: Date) => void;
    password: string;
    setPassword: (v: string) => void;
    confirmPassword: string;
    setConfirmPassword: (v: string) => void;
    error: string | null;
    loading: boolean;
    onSignUp: () => void;
}

const SignUpFormComponent: React.FC<SignUpFormProps> = ({
    fullName,
    setFullName,
    email,
    setEmail,
    phone,
    setPhone,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    dateOfBirth,
    setDateOfBirth,
    error,
    loading,
    onSignUp
}) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [activeField, setActiveField] = useState<'dob' | null>(null);
    
    // Create ref for password field (used after date picker)
    const passwordRef = useRef<any>(null);
    
    const formatDate = useCallback((date: Date) => {
        const d = String(date.getDate()).padStart(2, "0");
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    }, []);

    return (
        <View style={styles.container}>
            {/* Full Name Input Field */}
            <InputField
                iconName="person-outline"
                placeholder={t('common.full_name')}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
            />

            {/* Email Input Field */}
            <InputField
                iconName="mail-outline"
                placeholder={t('common.email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
            />

            {/* Phone Input Field */}
            <InputField
                iconName="call-outline"
                placeholder={t('auth.phone')}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
            />

            {/* Date of Birth Field */}
            <View style={styles.field}>
                <Pressable 
                    onPressIn={() => {
                        setActiveField('dob');
                        setShowDatePicker(true);
                    }}
                    onPress={() => setShowDatePicker(true)}
                    focusable={false}
                    style={({pressed}) => [
                        styles.datePressable,
                        pressed && styles.datePressablePressed
                    ]}
                >
                    <View style={[
                        styles.inputRow,
                        activeField === 'dob' && styles.inputRowFocused
                    ]}>
                        <Ionicons 
                            name="calendar-outline" 
                            size={18} 
                            color={activeField === 'dob' ? '#3629B7' : '#A8A3D7'} 
                        />
                        <Text
                            style={[
                                styles.input,
                                styles.dateText,
                                !dateOfBirth && styles.placeholderText
                            ]}
                        >
                            {dateOfBirth ? formatDate(dateOfBirth) : "Date of birth"}
                        </Text>
                        <Ionicons name="chevron-down-outline" size={16} color="#A8A3D7" />
                    </View>
                </Pressable>
            </View>

            {/* Password Input Field */}
            <InputField
                iconName="lock-closed-outline"
                placeholder={t('common.password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            {/* Confirm Password Input Field */}
            <InputField
                iconName="lock-closed-outline"
                placeholder={t('common.confirm_password')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
            />

            {/* Error Message */}
            <ErrorMessage message={error} />

            {/* Sign Up Button */}
            <View style={styles.signupBtnContainer}>
                <SubmitButton
                    label={t('auth.create_account')}
                    onPress={onSignUp}
                    loading={loading}
                    loadingText={t('auth.sign_up_loading')}
                />
            </View>

            {/* Terms Text */}
            <Text style={styles.termsText}>
                By signing up, you agree to our{' '}
                <Text style={styles.termsLink}>Terms</Text> &{' '}
                <Text style={styles.termsLink}>Privacy</Text>
            </Text>

            {/* Date Picker */}
            {showDatePicker && (
                <DateTimePicker
                    value={dateOfBirth || new Date(2000, 0, 1)}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        setActiveField(null); // Reset active field when picker closes
                        if (selectedDate) {
                            setDateOfBirth(selectedDate);
                        }
                    }}
                />
            )}
        </View>
    );
};

export const SignUpForm = React.memo(SignUpFormComponent);

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    dateText: {
        color: '#1F2937',
    },
    placeholderText: {
        color: '#A8A3D7',
    },
    datePressable: {
        width: '100%',
    },
    datePressablePressed: {
        opacity: 0.7,
    },
    signupBtnContainer: {
        marginBottom: 12,
    },
    termsText: {
        fontSize: 11,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 4,
    },
    termsLink: {
        color: '#3629B7',
        fontWeight: '500',
    },
    field: {
        marginBottom: 12,
    },
     inputRow: {
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F2F1F9',
        borderWidth: 1,
        borderColor: 'transparent',
        paddingHorizontal: 14, 
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    inputRowFocused: {
        borderColor: '#3629B7',
        backgroundColor: '#FFFFFF',
        shadowColor: '#3629B7',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        },
    input: {
        flex: 1,
        color: '#1F2937',
        fontSize: 14,
        paddingVertical: 8,
    },
});