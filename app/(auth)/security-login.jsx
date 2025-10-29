// ============================================
// FILE: app/(auth)/security-login.jsx
// Dynamic Security Login with API Integration
// ============================================
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { securityLogin } from '@/services/authService';
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
    Shield,
    User
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

export default function SecurityLoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    // Clear previous error
    setError('');

    // Validate inputs
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      // Call login API
      const result = await securityLogin(username.trim(), password);

      if (result.success) {
        // Navigate to security home
        router.replace('/security/home');
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
      
      {/* Background Gradient - Green tint for security */}
      <LinearGradient
        colors={['#065F46', '#10B981', '#059669']}
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
          {/* Header with Shield Icon */}
          <Animated.View 
            entering={FadeInUp.duration(800).delay(200)}
            style={styles.header}
          >
            <View style={styles.shieldContainer}>
              <View style={styles.shieldBorder}>
                <LinearGradient
                  colors={['#FFFFFF', '#F0FDF4']}
                  style={styles.shieldGradient}
                >
                  <Shield size={32} color="#10B981" strokeWidth={2.5} />
                </LinearGradient>
              </View>
            </View>
            <Text style={styles.title}>Security Login</Text>
            <Text style={styles.subtitle}>Access your security dashboard</Text>
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

            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <View style={styles.inputContainer}>
                <User size={20} color="rgba(255, 255, 255, 0.6)" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    setError('');
                  }}
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

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={loading ? ['#9CA3AF', '#9CA3AF'] : ['#FFFFFF', '#F0FDF4']}
                style={styles.loginButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#10B981" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Info Note */}
            <View style={styles.infoContainer}>
              <View style={styles.infoDot} />
              <Text style={styles.infoText}>
                Contact your admin if you need assistance
              </Text>
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
  shieldContainer: {
    marginBottom: theme.spacing.lg,
  },
  shieldBorder: {
    padding: 4,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  shieldGradient: {
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
    color: '#10B981',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  infoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  infoText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.regular,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});