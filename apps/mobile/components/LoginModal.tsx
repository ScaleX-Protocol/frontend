import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useLoginWithEmail, useOAuthFlow } from '@privy-io/expo';

type LoginMethod = 'email' | 'social' | null;
type SocialProvider = 'google' | 'twitter';

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LoginModal({ visible, onClose }: LoginModalProps) {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>(null);
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { sendCode: sendEmailCode, loginWithCode: loginWithEmailCode } = useLoginWithEmail();
  const oAuthFlow = useOAuthFlow();

  const resetState = () => {
    setLoginMethod(null);
    setIdentifier('');
    setCode('');
    setCodeSent(false);
    setError('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSendCode = async () => {
    try {
      setLoading(true);
      setError('');

      if (loginMethod === 'email') {
        await sendEmailCode({ email: identifier });
      }

      setCodeSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    try {
      setLoading(true);
      setError('');

      if (loginMethod === 'email') {
        await loginWithEmailCode({ code, email: identifier });
      }

      handleClose();
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    try {
      setLoading(true);
      setError('');
      await oAuthFlow?.start({ provider });
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  const renderMethodSelection = () => (
    <View style={styles.methodContainer}>
      <Text style={styles.title}>Connect to ScaleX</Text>
      <Text style={styles.subtitle}>Choose your preferred login method</Text>

      {/* Social Login Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Social Login</Text>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => handleSocialLogin('google')}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => handleSocialLogin('twitter')}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>Continue with Twitter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Email Option */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => setLoginMethod('email')}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>Continue with Email</Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  const renderEmailFlow = () => (
    <View style={styles.flowContainer}>
      <TouchableOpacity onPress={resetState} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Email Login</Text>

      {!codeSent ? (
        <>
          <Text style={styles.subtitle}>Enter your email address</Text>

          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            placeholderTextColor="#666"
            value={identifier}
            onChangeText={setIdentifier}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleSendCode}
            disabled={loading || !identifier}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Sending...' : 'Send Code'}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>
            Enter the verification code sent to {identifier}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit code"
            placeholderTextColor="#666"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
          />

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleVerifyCode}
            disabled={loading || code.length !== 6}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setCodeSent(false)} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Resend Code</Text>
          </TouchableOpacity>
        </>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {!loginMethod ? renderMethodSelection() : renderEmailFlow()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  closeButtonText: {
    color: '#888',
    fontSize: 24,
    fontWeight: '600',
  },
  methodContainer: {
    paddingVertical: 16,
  },
  flowContainer: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 1,
  },
  loginButton: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#3A3A3A',
  },
  dividerText: {
    color: '#666',
    fontSize: 12,
    marginHorizontal: 12,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    color: '#FFF',
    fontSize: 16,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#E26B1D',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#E26B1D',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 16,
  },
  backButtonText: {
    color: '#E26B1D',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
});
