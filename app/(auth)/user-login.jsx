// ============================================
// FILE: app/(auth)/user-login.jsx
// Dynamic User Login with API Integration - UPDATED
// ============================================
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { userLogin } from '@/services/authService';
import theme from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  AlertCircle,
  ChevronLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User as UserIcon
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function UserLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    // Clear previous error
    setError('');

    // Validate inputs
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Call login API
      const result = await userLogin(email.trim(), password);

      if (result.success) {
        console.log('✅ Login successful, navigating to user home...');
        // Navigate to user home
        router.replace('/user/home');
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper backgroundColor="transparent">
      <StatusBar style="light" />
      
      {/* Background Gradient - Blue/Purple for users */}
      <LinearGradient
        colors={['#1E40AF', '#3B82F6', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Back Button */}
        <Animated.View entering={FadeInUp.duration(600)}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header with User Icon */}
          <Animated.View 
            entering={FadeInUp.duration(800).delay(200)}
            style={styles.header}
          >
            <View style={styles.iconContainer}>
              <View style={styles.iconBorder}>
                <LinearGradient
                  colors={['#FFFFFF', '#F0F9FF']}
                  style={styles.iconGradient}
                >
                  <UserIcon size={32} color="#3B82F6" strokeWidth={2.5} />
                </LinearGradient>
              </View>
            </View>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View 
            entering={FadeInDown.duration(800).delay(300)}
            style={styles.formContainer}
          >
            {/* Error Message */}
            {error !== '' && (
              <Animated.View 
                entering={FadeInDown.duration(400)}
                style={styles.errorContainer}
              >
                <AlertCircle size={18} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            )}

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color="rgba(255, 255, 255, 0.6)" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color="rgba(255, 255, 255, 0.6)" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError('');
                  }}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="rgba(255, 255, 255, 0.6)" />
                  ) : (
                    <Eye size={20} color="rgba(255, 255, 255, 0.6)" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity 
              style={styles.forgotButton}
              disabled={loading}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? ['#9CA3AF', '#9CA3AF'] : ['#FFFFFF', '#F0F9FF']}
                style={styles.loginButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity 
                onPress={() => router.push('/user-signup')}
                disabled={loading}
              >
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxxl,
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xxxl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: theme.spacing.lg,
  },
  iconBorder: {
    padding: 4,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontFamily: theme.typography.fonts.bold,
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  formContainer: {
    gap: theme.spacing.base,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: '#FEE2E2',
  },
  inputGroup: {
    gap: theme.spacing.sm,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: theme.spacing.base,
    height: 56,
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.typography.fonts.regular,
    color: '#FFFFFF',
  },
  eyeIcon: {
    padding: theme.spacing.xs,
  },
  forgotButton: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  loginButton: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    paddingVertical: theme.spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  loginButtonText: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.primary.blue,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
  signupText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  signupLink: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.bold,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
});