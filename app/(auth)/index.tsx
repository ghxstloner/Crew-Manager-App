import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, 
  Platform, Alert, ActivityIndicator, StatusBar, Image, ScrollView,
  TouchableWithoutFeedback, Keyboard, Modal, FlatList, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../../store/authStore'; // Tu Context API existente
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { apiService, Posicion } from '../../services/api';

// Nueva interfaz para aerolíneas
interface Aerolinea {
  id_aerolinea: number;
  descripcion: string;
  siglas: string;
}

const { width } = Dimensions.get('window');

export default function AuthScreen() {
  const { signIn, initiateRegister, verifyEmailAndRegister, resendVerificationPin } = useSession();
  
  // Estados principales
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  
  // Estados para formularios
  const [crewId, setCrewId] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [pasaporte, setPasaporte] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<Posicion | null>(null);
  const [selectedAerolinea, setSelectedAerolinea] = useState<Aerolinea | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  
  // Estados para verificación de email
  const [verificationKey, setVerificationKey] = useState('');
  const [pin, setPin] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // Estados de UI
  const [showPassword, setShowPassword] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [showAerolineaModal, setShowAerolineaModal] = useState(false);
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const [aerolineas, setAerolineas] = useState<Aerolinea[]>([]);
  
  // Camera
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState<any>(null);

  useEffect(() => {
    if (!isLogin) {
      loadPosiciones();
      loadAerolineas();
    }
  }, [isLogin]);

  const loadPosiciones = async () => {
    try {
      const response = await apiService.getPosiciones();
      if (response.success) {
        setPosiciones(response.data);
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar las posiciones');
    }
  };

  const loadAerolineas = async () => {
    try {
      const response = await apiService.getAerolineas();
      if (response.success) {
        setAerolineas(response.data);
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron cargar las aerolíneas');
    }
  };

  const handleLogin = async () => {
    if (!crewId.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingresa Crew ID y contraseña');
      return;
    }

    setLoading(true);
    try {
      await signIn(crewId, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    if (!crewId.trim() || !nombres.trim() || !apellidos.trim() || 
        !email.trim() || !pasaporte.trim() || 
        !password.trim() || !selectedPosition || !selectedAerolinea) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }

    if (!photoUri) {
      Alert.alert('Error', 'Por favor toma o selecciona una foto');
      return;
    }

    setLoading(true);
    try {
      const response = await initiateRegister({
        crew_id: crewId.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: email.trim(),
        pasaporte: pasaporte.trim(),
        iata_aerolinea: selectedAerolinea.siglas,
        posicion: selectedPosition.id_posicion,
        password: password,
        imageUri: photoUri,
      });

      // Guardar los datos de verificación
      setVerificationKey(response.verification_key);
      setShowEmailVerification(true);
      startCountdown();

      Alert.alert(
        '📧 Email Enviado', 
        `Se ha enviado un código de verificación de 6 dígitos a ${email.trim()}. Revisa tu bandeja de entrada y spam.`,
        [{ text: 'Entendido' }]
      );

    } catch (error: any) {
      Alert.alert('❌ Error', error.message || 'No se pudo procesar el registro');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (pin.length !== 6) {
      Alert.alert('Error', 'Por favor ingresa el código de 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      await verifyEmailAndRegister(verificationKey, pin);
      
      Alert.alert(
        '✅ Registro Exitoso', 
        'Tu email ha sido verificado y tu solicitud ha sido enviada. Está pendiente de aprobación por nuestro equipo.',
        [
          { text: 'Entendido', onPress: () => {
            clearForm();
            setShowEmailVerification(false);
            setIsLogin(true);
          }}
        ]
      );
    } catch (error: any) {
      Alert.alert('❌ Error', error.message || 'Código de verificación incorrecto');
    } finally {
      setLoading(false);
    }
  };

  const handleResendPin = async () => {
    if (countdown > 0) return;

    setResendLoading(true);
    try {
      await resendVerificationPin(verificationKey);
      startCountdown();
      Alert.alert('📧 Código Reenviado', 'Se ha enviado un nuevo código de verificación a tu email');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo reenviar el código');
    } finally {
      setResendLoading(false);
    }
  };

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearForm = () => {
    setCrewId('');
    setPassword('');
    setEmail('');
    setNombres('');
    setApellidos('');
    setPasaporte('');
    setSelectedPosition(null);
    setSelectedAerolinea(null);
    setPhotoUri(null);
    setVerificationKey('');
    setPin('');
    setCountdown(0);
  };

  // Camera functions
  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Error', 'Se necesita permiso para acceder a la cámara');
        return;
      }
    }
    setShowCamera(true);
  };

  const takePicture = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync();
        if (photo?.uri) {
          setPhotoUri(photo.uri);
          setShowCamera(false);
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudo tomar la foto');
      }
    }
  };

  const selectFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    
      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir la galería');
    }
  };

  // Componente para etiquetas de campos obligatorios
  const RequiredLabel = ({ text }: { text: string }) => (
    <View style={styles.labelContainer}>
      <Text style={styles.labelText}>{text}</Text>
      <Text style={styles.requiredIndicator}>*</Text>
    </View>
  );

  // Camera view
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView 
          style={styles.camera} 
          facing="front"
          ref={setCameraRef}
        />
        
        <View style={styles.cameraOverlay}>
          <TouchableOpacity 
            style={styles.cameraCloseButton} 
            onPress={() => setShowCamera(false)}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.cameraGuide}>
            <View style={styles.cameraGuideFrame} />
            <Text style={styles.cameraGuideText}>Centra tu rostro en el marco</Text>
          </View>

          <TouchableOpacity style={styles.cameraCaptureButton} onPress={takePicture}>
            <View style={styles.cameraCaptureInner}>
              <Ionicons name="camera" size={32} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Position modal
  const PositionModal = () => (
    <Modal
      visible={showPositionModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowPositionModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowPositionModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccionar Posición</Text>
                <TouchableOpacity onPress={() => setShowPositionModal(false)}>
                  <Ionicons name="close" size={24} color={colors.gray[600]} />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={posiciones}
                keyExtractor={(item) => item.id_posicion.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.positionItem,
                      selectedPosition?.id_posicion === item.id_posicion && styles.positionItemSelected
                    ]}
                    onPress={() => {
                      setSelectedPosition(item);
                      setShowPositionModal(false);
                    }}
                  >
                    <View style={styles.positionItemContent}>
                      <View style={styles.positionInfo}>
                        <Text style={styles.positionCode}>{item.codigo_posicion}</Text>
                        <Text style={styles.positionDescription}>{item.descripcion}</Text>
                      </View>
                      {selectedPosition?.id_posicion === item.id_posicion && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // Aerolinea modal
  const AerolineaModal = () => (
    <Modal
      visible={showAerolineaModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAerolineaModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowAerolineaModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccionar Aerolínea</Text>
                <TouchableOpacity onPress={() => setShowAerolineaModal(false)}>
                  <Ionicons name="close" size={24} color={colors.gray[600]} />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={aerolineas}
                keyExtractor={(item) => item.id_aerolinea.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.positionItem,
                      selectedAerolinea?.id_aerolinea === item.id_aerolinea && styles.positionItemSelected
                    ]}
                    onPress={() => {
                      setSelectedAerolinea(item);
                      setShowAerolineaModal(false);
                    }}
                  >
                    <View style={styles.positionItemContent}>
                      <View style={styles.positionInfo}>
                        <Text style={styles.positionCode}>{item.siglas}</Text>
                        <Text style={styles.positionDescription}>{item.descripcion}</Text>
                      </View>
                      {selectedAerolinea?.id_aerolinea === item.id_aerolinea && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.brandContainer}>
                <Image 
                  source={require('../../assets/tocumen-fondo-blanco.png')} 
                  style={styles.tocumenImage}
                  resizeMode="contain"
                />
                <Text style={styles.brandTitle}>CrewManager</Text>
                <Text style={styles.brandSubtitle}>
                  {isLogin ? 'Bienvenido de vuelta' : 'Únete a nuestro equipo'}
                </Text>
              </View>
            </View>

            {/* Main Form */}
            <View style={styles.formCard}>
              
              {/* LOGIN FORM */}
              {isLogin ? (
                <>
                  <View style={styles.inputGroup}>
                    <RequiredLabel text="Crew ID" />
                    <View style={styles.inputContainer}>
                      <Ionicons name="person" size={20} color={colors.gray[500]} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Ingresa tu Crew ID"
                        placeholderTextColor={colors.gray[500]}
                        value={crewId}
                        onChangeText={setCrewId}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading}
                      />
                    </View>
                    
                    <RequiredLabel text="Contraseña" />
                    <View style={styles.inputContainer}>
                      <Ionicons name="lock-closed" size={20} color={colors.gray[500]} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Ingresa tu contraseña"
                        placeholderTextColor={colors.gray[500]}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        editable={!loading}
                      />
                      <TouchableOpacity 
                        style={styles.eyeIcon} 
                        onPress={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        <Ionicons 
                          name={showPassword ? "eye-off" : "eye"} 
                          size={20} 
                          color={colors.gray[500]} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.primaryButton, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* REGISTER FORM */}
                  
                  {/* Photo Section */}
                  <View style={styles.photoSection}>
                    <RequiredLabel text="Foto de perfil" />
                    <View style={styles.photoContainer}>
                      {photoUri ? (
                        <View style={styles.photoWrapper}>
                          <Image source={{ uri: photoUri }} style={styles.photo} />
                          <View style={styles.photoCheckmark}>
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          </View>
                        </View>
                      ) : (
                        <View style={styles.photoPlaceholder}>
                          <Ionicons name="camera" size={32} color={colors.gray[500]} />
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.photoActions}>
                      <TouchableOpacity style={styles.photoButton} onPress={openCamera}>
                        <Ionicons name="camera" size={18} color={colors.primary} />
                        <Text style={styles.photoButtonText}>Cámara</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.photoButton} onPress={selectFromGallery}>
                        <Ionicons name="image" size={18} color={colors.primary} />
                        <Text style={styles.photoButtonText}>Galería</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Form Fields */}
                  <View style={styles.inputGroup}>
                    <RequiredLabel text="Crew ID" />
                    <View style={styles.inputContainer}>
                      <Ionicons name="id-card" size={20} color={colors.gray[500]} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Ingresa tu Crew ID"
                        placeholderTextColor={colors.gray[500]}
                        value={crewId}
                        onChangeText={setCrewId}
                        autoCorrect={false}
                        autoCapitalize="none"
                        editable={!loading}
                      />
                    </View>

                    <View style={styles.row}>
                      <View style={styles.halfInputWrapper}>
                        <RequiredLabel text="Nombres" />
                        <View style={styles.halfInput}>
                          <TextInput
                            style={styles.input}
                            placeholder="Nombres"
                            placeholderTextColor={colors.gray[500]}
                            value={nombres}
                            onChangeText={setNombres}
                            autoCorrect={false}
                            autoCapitalize="words"
                            editable={!loading}
                          />
                        </View>
                      </View>
                      <View style={styles.halfInputWrapper}>
                        <RequiredLabel text="Apellidos" />
                        <View style={styles.halfInput}>
                          <TextInput
                            style={styles.input}
                            placeholder="Apellidos"
                            placeholderTextColor={colors.gray[500]}
                            value={apellidos}
                            onChangeText={setApellidos}
                            autoCorrect={false}
                            autoCapitalize="words"
                            editable={!loading}
                          />
                        </View>
                      </View>
                    </View>

                    <RequiredLabel text="Correo electrónico" />
                    <View style={styles.inputContainer}>
                      <Ionicons name="mail" size={20} color={colors.gray[500]} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="ejemplo@correo.com"
                        placeholderTextColor={colors.gray[500]}
                        value={email}
                        onChangeText={setEmail}
                        autoCorrect={false}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        editable={!loading}
                      />
                    </View>

                    <RequiredLabel text="Número de pasaporte" />
                    <View style={styles.inputContainer}>
                      <Ionicons name="document" size={20} color={colors.gray[500]} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Número de pasaporte"
                        placeholderTextColor={colors.gray[500]}
                        value={pasaporte}
                        onChangeText={setPasaporte}
                        autoCorrect={false}
                        autoCapitalize="characters"
                        editable={!loading}
                      />
                    </View>

                    <RequiredLabel text="Aerolínea" />
                    <TouchableOpacity
                      style={[styles.positionSelector]}
                      onPress={() => setShowAerolineaModal(true)}
                      disabled={loading}
                    >
                      <Ionicons name="airplane" size={20} color={colors.gray[500]} style={styles.inputIcon} />
                      <View style={styles.positionSelectorText}>
                        {selectedAerolinea ? (
                          <Text style={styles.positionSelectorValue}>
                            {selectedAerolinea.siglas} - {selectedAerolinea.descripcion}
                          </Text>
                        ) : (
                          <Text style={styles.positionSelectorPlaceholder}>
                            Selecciona una aerolínea
                          </Text>
                        )}
                      </View>
                      <Ionicons name="chevron-down" size={20} color={colors.gray[500]} />
                    </TouchableOpacity>

                    <RequiredLabel text="Posición" />
                    <TouchableOpacity
                      style={[styles.positionSelector]}
                      onPress={() => setShowPositionModal(true)}
                      disabled={loading}
                    >
                      <Ionicons name="briefcase" size={20} color={colors.gray[500]} style={styles.inputIcon} />
                      <View style={styles.positionSelectorText}>
                        {selectedPosition ? (
                          <Text style={styles.positionSelectorValue}>
                            {selectedPosition.codigo_posicion} - {selectedPosition.descripcion}
                          </Text>
                        ) : (
                          <Text style={styles.positionSelectorPlaceholder}>
                            Selecciona una posición
                          </Text>
                        )}
                      </View>
                      <Ionicons name="chevron-down" size={20} color={colors.gray[500]} />
                    </TouchableOpacity>

                    <RequiredLabel text="Contraseña" />
                    <View style={styles.inputContainer}>
                      <Ionicons name="lock-closed" size={20} color={colors.gray[500]} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Crea una contraseña segura"
                        placeholderTextColor={colors.gray[500]}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        editable={!loading}
                      />
                      <TouchableOpacity 
                        style={styles.eyeIcon} 
                        onPress={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        <Ionicons 
                          name={showPassword ? "eye-off" : "eye"} 
                          size={20} 
                          color={colors.gray[500]} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.primaryButton, loading && styles.buttonDisabled]}
                    onPress={handleRegister}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <>
                        <ActivityIndicator size="small" color="#FFFFFF" style={{marginRight: 8}} />
                        <Text style={styles.primaryButtonText}>Procesando...</Text>
                      </>
                    ) : (
                      <Text style={styles.primaryButtonText}>Crear Cuenta</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {/* Switch Mode */}
              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>
                  {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setIsLogin(!isLogin);
                    clearForm();
                  }}
                  disabled={loading}
                >
                  <Text style={styles.switchButton}>
                    {isLogin ? 'Registrarse' : 'Iniciar Sesión'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <PositionModal />
      <AerolineaModal />

      {/* Modal de Verificación de Email */}
      <Modal
        visible={showEmailVerification}
        transparent
        animationType="slide"
        onRequestClose={() => {
          Alert.alert(
            'Cancelar Verificación',
            '¿Estás seguro de que deseas cancelar? Perderás el progreso del registro.',
            [
              { text: 'No', style: 'cancel' },
              { 
                text: 'Sí, cancelar', 
                style: 'destructive',
                onPress: () => {
                  setShowEmailVerification(false);
                  clearForm();
                }
              }
            ]
          );
        }}
      >
        <View style={styles.emailVerificationOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.emailVerificationContainer}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.emailVerificationContent}>
                <View style={styles.emailVerificationHeader}>
                  <View style={styles.emailVerificationIcon}>
                    <Ionicons name="mail" size={40} color={colors.primary} />
                  </View>
                  <Text style={styles.emailVerificationTitle}>Verificar Email</Text>
                  <Text style={styles.emailVerificationSubtitle}>
                    Hemos enviado un código de 6 dígitos a:
                  </Text>
                  <Text style={styles.emailVerificationEmail}>{email}</Text>
                </View>

                <View style={styles.pinInputContainer}>
                  <Text style={styles.pinInputLabel}>Código de Verificación</Text>
                  <TextInput
                    style={styles.pinInput}
                    value={pin}
                    onChangeText={setPin}
                    placeholder="000000"
                    placeholderTextColor={colors.gray[400]}
                    keyboardType="number-pad"
                    maxLength={6}
                    textAlign="center"
                    autoFocus
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.verifyButton, loading && styles.buttonDisabled]}
                  onPress={handleVerifyEmail}
                  disabled={loading || pin.length !== 6}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.verifyButtonText}>Verificar Email</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.resendContainer}>
                  <Text style={styles.resendText}>¿No recibiste el código?</Text>
                  <TouchableOpacity 
                    style={[styles.resendButton, (countdown > 0 || resendLoading) && styles.resendButtonDisabled]}
                    onPress={handleResendPin}
                    disabled={countdown > 0 || resendLoading}
                  >
                    {resendLoading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text style={[
                        styles.resendButtonText,
                        countdown > 0 && styles.resendButtonTextDisabled
                      ]}>
                        {countdown > 0 ? `Reenviar en ${countdown}s` : 'Reenviar código'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={styles.cancelVerificationButton}
                  onPress={() => {
                    Alert.alert(
                      'Cancelar Verificación',
                      '¿Estás seguro de que deseas cancelar? Perderás el progreso del registro.',
                      [
                        { text: 'No', style: 'cancel' },
                        { 
                          text: 'Sí, cancelar', 
                          style: 'destructive',
                          onPress: () => {
                            setShowEmailVerification(false);
                            clearForm();
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Text style={styles.cancelVerificationButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  brandContainer: {
    alignItems: 'center',
  },
  tocumenImage: {
    width: 250,
    height: 100,
    marginBottom: 20,
    marginLeft: 10,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 8,
  },
  brandSubtitle: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: colors.white,
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  // Nuevos estilos para labels obligatorios
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 16,
  },
  labelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.dark,
  },
  requiredIndicator: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E53E3E',
    marginLeft: 4,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.dark,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInputWrapper: {
    flex: 1,
  },
  halfInput: {
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray[200],
  },
  primaryButton: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0.1,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  switchText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  switchButton: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  // Photo section styles mejorados
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoContainer: {
    marginBottom: 16,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  photoCheckmark: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  photoPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderStyle: 'dashed',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  photoButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  // Position selector mejorado
  positionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 4,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
  },
  positionSelectorText: {
    flex: 1,
    marginLeft: 12,
  },
  positionSelectorValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.dark,
  },
  positionSelectorPlaceholder: {
    fontSize: 16,
    color: colors.gray[500],
  },
  // Modal styles mejorados
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
  },
  positionItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  positionItemSelected: {
    backgroundColor: colors.gray[50],
  },
  positionItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  positionInfo: {
    flex: 1,
    marginRight: 10,
  },
  positionCode: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 2,
  },
  positionDescription: {
    fontSize: 13,
    color: colors.gray[600],
    lineHeight: 18,
  },
  // Camera styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingBottom: 30,
    justifyContent: 'space-between',
  },
  cameraCloseButton: {
    alignSelf: 'flex-end',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  cameraGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  cameraGuideFrame: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderStyle: 'dashed',
  },
  cameraGuideText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  cameraCaptureButton: {
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraCaptureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailVerificationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  emailVerificationContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  emailVerificationContent: {
    padding: 24,
  },
  emailVerificationHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emailVerificationIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emailVerificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 8,
  },
  emailVerificationSubtitle: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: 'center',
  },
  emailVerificationEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    marginTop: 8,
  },
  pinInputContainer: {
    marginBottom: 24,
  },
  pinInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 8,
  },
  pinInput: {
    backgroundColor: colors.gray[50],
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1.5,
    borderColor: colors.gray[200],
  },
  verifyButton: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  resendButton: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  resendButtonDisabled: {
    opacity: 0.7,
  },
  resendButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  resendButtonTextDisabled: {
    opacity: 0.7,
  },
  cancelVerificationButton: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  cancelVerificationButtonText: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: '600',
  },
});