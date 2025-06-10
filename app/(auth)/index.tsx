import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { useSession } from '../../store/authStore';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignIn() {
  const { signIn } = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleSignIn = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
      return;
    }

    setLoading(true);
    try {
      await signIn(username, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Header Section - REDUCIDO */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="people" size={32} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.title}>CrewManager</Text>
            <Text style={styles.subtitle}>Sistema de Gestión de Tripulación</Text>
            <Text style={styles.governmentText}>Gobierno de Panamá</Text>
          </View>

          {/* Form Section - MÁS COMPACTO */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <View style={[
                styles.inputWrapper,
                usernameFocused && styles.inputWrapperFocused
              ]}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={usernameFocused ? colors.primary : colors.gray[500]} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Usuario"
                  placeholderTextColor={colors.gray[500]}
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <View style={[
                styles.inputWrapper,
                passwordFocused && styles.inputWrapperFocused
              ]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={passwordFocused ? colors.primary : colors.gray[500]} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor={colors.gray[500]}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={colors.gray[500]} 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Iniciar Sesión</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>CrewManager © 2025</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-between',
  },
  // ✅ HEADER REDUCIDO
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20, // ✅ Reducido de 40 a 20
    paddingBottom: 20,
  },
  // ✅ ÍCONO MÁS PEQUEÑO
  iconContainer: {
    marginBottom: 20, // ✅ Reducido de 30 a 20
  },
  iconCircle: {
    width: 80, // ✅ Reducido de 100 a 80
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  // ✅ TÍTULOS MÁS COMPACTOS
  title: {
    fontSize: 28, // ✅ Reducido de 36 a 28
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6, // ✅ Reducido de 8 a 6
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14, // ✅ Reducido de 16 a 14
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 4, // ✅ Reducido de 8 a 4
    lineHeight: 18,
  },
  governmentText: {
    fontSize: 12, // ✅ Reducido de 14 a 12
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '500',
  },
  // ✅ FORMULARIO OPTIMIZADO
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24, // ✅ Reducido de 30 a 24
    marginHorizontal: -10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  inputContainer: {
    marginBottom: 16, // ✅ Reducido de 20 a 16
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 16,
    paddingHorizontal: 20,
    height: 56, // ✅ Reducido de 60 a 56
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.dark,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 5,
  },
  button: {
    backgroundColor: colors.primary,
    height: 56, // ✅ Reducido de 60 a 56
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20, // ✅ Reducido de 30 a 20
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  buttonIcon: {
    marginLeft: 5,
  },
  // ✅ FOOTER COMPACTO
  footer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20, // ✅ Reducido de 30 a 20
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
});