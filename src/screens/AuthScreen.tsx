import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { apiClient, setAuthToken } from '../api/client';
import { User } from '../types';

interface AuthScreenProps {
  visible: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  currentUser?: User | null;
  onLogout?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  visible,
  onClose,
  onAuthSuccess,
  currentUser,
  onLogout,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim() || (isRegister && !name.trim())) {
      Alert.alert('Required Fields', 'Please fill out all input fields.');
      return;
    }

    try {
      setLoading(true);
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister
        ? { name, email, password, role: 'FOREIGNER' }
        : { email: email.trim().toLowerCase(), password: password.trim() };

      const res = await apiClient.post(endpoint, payload);
      const token = res.data.token;
      const user = res.data.user;

      setAuthToken(token);
      onAuthSuccess(user);
      onClose();
      Alert.alert('Welcome!', `Logged in successfully as ${user.name}`);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Authentication failed. Please check your email and password.';
      Alert.alert(isRegister ? 'Registration Failed' : 'Sign In Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    if (onLogout) {
      onLogout();
      onClose();
      Alert.alert('Signed Out', 'You have been signed out successfully.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardContainer}
          >
            <View style={styles.modalCard}>
              {/* Header with Close Button */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>
                    {currentUser
                      ? 'Traveler Profile'
                      : isRegister
                      ? 'Create Traveler Account'
                      : 'Traveler Login'}
                  </Text>
                  <Text style={styles.subtitle}>
                    {currentUser
                      ? `Signed in as ${currentUser.email}`
                      : isRegister
                      ? 'Join Ceylon Stays to reserve luxury stays & dining'
                      : 'Sign in to manage your active bookings'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* If user is already logged in, show profile overview and Logout button */}
              {currentUser ? (
                <View style={styles.profileSection}>
                  <View style={styles.profileCard}>
                    <View style={styles.profileAvatar}>
                      <Text style={styles.profileAvatarText}>
                        {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '👤'}
                      </Text>
                    </View>
                    <View style={styles.profileInfo}>
                      <Text style={styles.profileName}>{currentUser.name}</Text>
                      <Text style={styles.profileEmail}>{currentUser.email}</Text>
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>VERIFIED TRAVELER</Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleSignOut}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.logoutButtonText}>🚪 Sign Out</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollForm}
                >
                  {isRegister && (
                    <View style={styles.field}>
                      <Text style={styles.label}>Full Name</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. John Doe"
                        placeholderTextColor="#64748b"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                      />
                    </View>
                  )}

                  <View style={styles.field}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. traveler@gmail.com"
                      placeholderTextColor="#64748b"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.passwordRow}>
                      <TextInput
                        style={[styles.input, styles.passwordInput]}
                        placeholder="Enter your password"
                        placeholderTextColor="#64748b"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.eyeIcon}>
                          {showPassword ? '👁️' : '🙈'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitButton, loading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.submitButtonText}>
                        {isRegister ? 'Register Account' : 'Sign In'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.switchMode}
                    onPress={() => setIsRegister(!isRegister)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.switchText}>
                      {isRegister
                        ? 'Already have an account? Sign In'
                        : "Don't have an account? Register"}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 10, 18, 0.88)',
    justifyContent: 'flex-end',
  },
  keyboardContainer: {
    width: '100%',
  },
  modalCard: {
    backgroundColor: '#131b2e',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'android' ? 36 : 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  closeButton: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
  },
  scrollForm: {
    paddingBottom: 10,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#070a12',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    fontSize: 15,
  },
  passwordRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  eyeIcon: {
    fontSize: 18,
  },
  submitButton: {
    backgroundColor: '#10b981',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  switchMode: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '700',
  },
  profileSection: {
    paddingVertical: 10,
    gap: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#070a12',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 14,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1.5,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 20,
    color: '#10b981',
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  profileEmail: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 6,
  },
  roleBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
  },
  logoutButton: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#f43f5e',
    fontSize: 14,
    fontWeight: '700',
  },
});
