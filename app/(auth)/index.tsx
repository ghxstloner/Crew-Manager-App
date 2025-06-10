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
  const { signIn, register } = useSession();
  
  // Estados principales
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Estados para formularios
  const [crewId, setCrewId] = useState('');
  const [password, setPassword] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [pasaporte, setPasaporte] = useState('');
  const [identidad, setIdentidad] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<Posicion | null>(null);
  const [selectedAerolinea, setSelectedAerolinea] = useState<Aerolinea | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  
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

  const handleRegister = async () => {
    if (!crewId.trim() || !nombres.trim() || !apellidos.trim() || 
        !pasaporte.trim() || !password.trim() || !selectedPosition || !selectedAerolinea) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    if (!photoUri) {
      Alert.alert('Error', 'Por favor toma o selecciona una foto');
      return;
    }

    setLoading(true);
    try {
      await register({
        crew_id: crewId.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        pasaporte: pasaporte.trim(),
        identidad: identidad.trim() || undefined,
        iata_aerolinea: selectedAerolinea.siglas ,
        posicion: selectedPosition.id_posicion,
        password: password,
        imageUri: photoUri,
      });

      Alert.alert(
        '✅ Registro Exitoso', 
        'Tu solicitud ha sido enviada y está pendiente de aprobación. Te notificaremos cuando sea revisada.',
        [
          { text: 'Entendido', onPress: () => {
            clearForm();
            setIsLogin(true);
          }}
        ]
      );
    } catch (error: any) {
      Alert.alert('❌ Error', error.message || 'No se pudo procesar el registro');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setCrewId('');
    setPassword('');
    setNombres('');
    setApellidos('');
    setPasaporte('');
    setIdentidad('');
    setSelectedPosition(null);
    setSelectedAerolinea(null);
    setPhotoUri(null);
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
                <View style={styles.logoContainer}>
                  <Ionicons name="airplane" size={40} color={colors.primary} />
                </View>
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
                    <View style={styles.inputContainer}>
                      <Ionicons name="person" size={20} color={colors.gray[500]} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Crew ID"
                        placeholderTextColor={colors.gray[500]}
                        value={crewId}
                        onChangeText={setCrewId}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading}
                      />
                    </View>
                    
                    <View style={styles.inputContainer}>
                      <Ionicons name="lock-closed" size={20} color={colors.gray[500]} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Contraseña"
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
                    <Text style={styles.sectionTitle}>Foto de perfil</Text>
                    <View style={styles.photoContainer}>
                      {photoUri ? (
                        <Image source={{ uri: photoUri }} style={styles.photo} />
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
                    <View style={styles.inputContainer}>
                      <Ionicons name="id-card" size={20} color={colors.gray[500]} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Crew ID"
                        placeholderTextColor={colors.gray[500]}
                        value={crewId}
                        onChangeText={setCrewId}
                        autoCorrect={false}
                        autoCapitalize="none"
                        editable={!loading}
                      />
                    </View>

                    <View style={styles.row}>
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

                    <View style={styles.inputContainer}>
                      <Ionicons name="lock-closed" size={20} color={colors.gray[500]} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Contraseña"
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
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  inputGroup: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
    borderWidth: 1,
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
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  primaryButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 12,
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
  // Photo section styles
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    marginBottom: 16,
  },
  photoContainer: {
    marginBottom: 16,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray[200],
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
    backgroundColor: colors.gray[200],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  photoButtonText: {
    color: colors.primary,
    fontWeight: '500',
    fontSize: 14,
  },
  // Position selector
  positionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
    borderWidth: 1,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark,
  },
  positionItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  positionItemSelected: {
    backgroundColor: colors.gray[100],
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
});