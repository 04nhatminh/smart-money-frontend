import React, {useState, useRef, useCallback} from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    Pressable, 
    StyleSheet, 
    ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

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
    const [activeField, setActiveField] = useState<string | null>(null);
    
    // Create refs for each input
    const fullNameRef = useRef<TextInput>(null);
    const emailRef = useRef<TextInput>(null);
    const phoneRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);
    const confirmPasswordRef = useRef<TextInput>(null);
    
    const formatDate = useCallback((date: Date) => {
        const d = String(date.getDate()).padStart(2, "0");
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    }, []);

    // Handle submit editing to move to next field
    const handleFullNameSubmit = useCallback(() => {
        emailRef.current?.focus();
    }, []);

    const handleEmailSubmit = useCallback(() => {
        phoneRef.current?.focus();
    }, []);

    const handlePhoneSubmit = useCallback(() => {
        setShowDatePicker(true);
    }, []);

    const handlePasswordSubmit = useCallback(() => {
        confirmPasswordRef.current?.focus();
    }, []);

    return (
        <View style={styles.container}>
            {/* Full Name Field */}
            <View style={styles.field}>
                <Pressable
                    onPressIn={() => {
                        setActiveField('fullName');
                        fullNameRef.current?.focus();
                    }}
                    style={[
                        styles.inputRow,
                        activeField === 'fullName' && styles.inputRowFocused,
                    ]}
                >
                    <Ionicons
                        name="person-outline"
                        size={18}
                        color={activeField === 'fullName' ? '#3629B7' : '#A8A3D7'}
                    />
                    <TextInput
                        ref={fullNameRef}
                        placeholder="Full name"
                        placeholderTextColor="#A8A3D7"
                        style={styles.input}
                        autoCapitalize="words"
                        value={fullName}
                        onChangeText={setFullName}
                        onFocus={() => setActiveField('fullName')}
                        onBlur={() => setActiveField(null)}
                        returnKeyType="next"
                        blurOnSubmit={false}
                        onSubmitEditing={handleFullNameSubmit}
                    />
                </Pressable>   
            </View>

            {/* Email Field */}
            <View style={styles.field}>
                <Pressable
                    onPressIn={() => {
                        setActiveField('email');
                        emailRef.current?.focus();
                    }}
                    style={[
                        styles.inputRow,
                        activeField === 'email' && styles.inputRowFocused,
                    ]}
                >
                    <Ionicons
                        name="mail-outline"
                        size={18}
                        color={activeField === 'email' ? '#3629B7' : '#A8A3D7'}
                    />
                    <TextInput
                        ref={emailRef}
                        placeholder="Email"
                        placeholderTextColor="#A8A3D7"
                        style={styles.input}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                        onFocus={() => setActiveField('email')}
                        onBlur={() => setActiveField(null)}
                        returnKeyType="next"
                        onSubmitEditing={handleEmailSubmit}
                        blurOnSubmit={false}
                    />
                </Pressable>   
            </View>

            {/* Phone Field */}
            <View style={styles.field}>
                <Pressable
                    onPressIn={() => {
                        setActiveField('phone');
                        phoneRef.current?.focus();
                    }}
                    style={[
                        styles.inputRow,
                        activeField === 'phone' && styles.inputRowFocused,
                    ]}
                >
                    <Ionicons
                        name="call-outline"
                        size={18}
                        color={activeField === 'phone' ? '#3629B7' : '#A8A3D7'}
                    />
                    <TextInput
                        ref={phoneRef}
                        placeholder="Phone number"
                        placeholderTextColor="#A8A3D7"
                        style={styles.input}
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                        onFocus={() => setActiveField('phone')}
                        onBlur={() => setActiveField(null)}
                        returnKeyType="next"
                        onSubmitEditing={handlePhoneSubmit}
                        blurOnSubmit={false}
                    />
                </Pressable>   
            </View>

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

            {/* Password Field */}
            <View style={styles.field}>
                <Pressable
                    onPressIn={() => {
                        setActiveField('password');
                        passwordRef.current?.focus();
                    }}
                    style={[
                        styles.inputRow,
                        activeField === 'password' && styles.inputRowFocused,
                    ]}
                >
                    <Ionicons
                        name="lock-closed-outline"
                        size={18}
                        color={activeField === 'password' ? '#3629B7' : '#A8A3D7'}
                    />
                    <TextInput
                        ref={passwordRef}
                        placeholder="Password"
                        placeholderTextColor="#A8A3D7"
                        style={styles.input}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => setActiveField('password')}
                        onBlur={() => setActiveField(null)}
                        returnKeyType="next"
                        onSubmitEditing={handlePasswordSubmit}
                        blurOnSubmit={false}
                    />
                </Pressable>
            </View>

            {/* Confirm Password Field */}
            <View style={styles.field}>
                <Pressable
                    onPressIn={() => {
                        setActiveField('confirmPassword');
                        confirmPasswordRef.current?.focus();
                    }}
                    style={[
                        styles.inputRow,
                        activeField === 'confirmPassword' && styles.inputRowFocused,
                    ]}
                >
                    <Ionicons
                        name="lock-closed-outline"
                        size={18}
                        color={activeField === 'confirmPassword' ? '#3629B7' : '#A8A3D7'}
                    />
                    <TextInput
                        ref={confirmPasswordRef}
                        placeholder="Confirm password"
                        placeholderTextColor="#A8A3D7"
                        style={styles.input}
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        onFocus={() => setActiveField('confirmPassword')}
                        onBlur={() => setActiveField(null)}
                        returnKeyType="done"
                        onSubmitEditing={onSignUp}
                    />
                </Pressable>
            </View>

            {/* Error Message */}
            {error && (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* Sign Up Button */}
            <Pressable
                style={({ pressed }) => [
                    styles.signupBtnWrapper,
                    pressed && styles.signupBtnPressed,
                    loading && styles.disabledBtn
                ]}
                onPress={onSignUp}
                focusable={!loading}
                disabled={loading}
            >
                <LinearGradient
                    colors={['#3629B7', '#5655B9']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.signupBtn}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <Ionicons name="sync-outline" size={18} color="#FFFFFF" />
                            <Text style={styles.signupBtnText}>Creating...</Text>
                        </View>
                    ) : (
                        <Text style={styles.signupBtnText}>Create Account</Text>
                    )}
                </LinearGradient>
            </Pressable>

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
                            // Auto focus to password field after selecting date
                            setTimeout(() => {
                                setActiveField('password');
                                passwordRef.current?.focus();
                            }, 100);
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
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
        gap: 6,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        flex: 1,
    },
    signupBtnWrapper: {
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: 12,
        shadowColor: '#3629B7',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    signupBtn: {
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    signupBtnPressed: {
        transform: [{ scale: 0.98 }],
    },
    disabledBtn: {
        opacity: 0.6,
    },
    signupBtnText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
        letterSpacing: 0.5,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
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
});