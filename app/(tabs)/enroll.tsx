import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, Image, Modal, FlatList, StatusBar, Animated,
  ScrollView, TouchableWithoutFeedback, Keyboard, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useCrew } from '../../store/crewStore'; 
import { Posicion } from '../../services/api';
import { colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function EnrollCrew() {
  const { createTripulante, loadPosiciones, posiciones } = useCrew();
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [selectedPosition, setSelectedPosition] = useState<Posicion | null>(null);
  
  const [crewId, setCrewId] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [pasaporte, setPasaporte] = useState('');
  const [docIdentidad, setDocIdentidad] = useState('');

  const [crewIdFocused, setCrewIdFocused] = useState(false);
  const [nombresFocused, setNombresFocused] = useState(false);
  const [apellidosFocused, setApellidosFocused] = useState(false);
  const [pasaporteFocused, setPasaporteFocused] = useState(false);
  const [docIdentidadFocused, setDocIdentidadFocused] = useState(false);

  useEffect(() => {
    loadPosicionesData();
  }, []);

  const loadPosicionesData = async () => {
    try {
      await loadPosiciones();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al cargar posiciones');
    }
  };

  const selectFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // ✅ CORRECTO - Array directo
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    
      if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0].uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
        console.error("Error seleccionando de galería:", error);
        Alert.alert('Error', 'No se pudo abrir la galería.');
    }
  };

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
        if (photo && photo.uri) {
            setPhotoUri(photo.uri);
            setShowCamera(false);
        } else {
            Alert.alert('Error', 'No se pudo obtener la URI de la foto.');
        }
      } catch (error) {
        console.error("Error tomando foto:", error);
        Alert.alert('Error', 'No se pudo tomar la foto');
      }
    }
  };

  const validateForm = () => {
    if (!crewId.trim() || !nombres.trim() || !apellidos.trim() || !pasaporte.trim() || !selectedPosition) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return false;
    }
    if (!photoUri) {
      Alert.alert('Error', 'Por favor toma o selecciona una foto');
      return false;
    }
    if (!selectedPosition || typeof selectedPosition.id_posicion === 'undefined' || selectedPosition.id_posicion === 0) {
      Alert.alert('Error', 'Debe seleccionar una posición válida');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
  
    setLoading(true);
    
    Animated.sequence([
      Animated.timing(fadeAnim, { duration: 100, toValue: 0.7, useNativeDriver: true }),
      Animated.timing(fadeAnim, { duration: 100, toValue: 1, useNativeDriver: true })
    ]).start();
  
    try {
      if (!selectedPosition || !photoUri) {
        Alert.alert('Error', 'Faltan datos de posición o foto.');
        setLoading(false);
        return;
      }

      await createTripulante({
        crew_id: crewId.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        pasaporte: pasaporte.trim(),
        doc_identidad: docIdentidad.trim() || "",
        id_posicion: selectedPosition.id_posicion,
        imageUri: photoUri,
      });
  
      Alert.alert('✅ Éxito', 'Tripulante enrolado correctamente', [
        { text: 'Continuar', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      Alert.alert('❌ Error', error.message || 'No se pudo enrolar al tripulante');
    } finally {
      setLoading(false);
    }
  };

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
                  <Ionicons name="close" size={24} color="#6B7280" />
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
            
            <View style={styles.photoSection}>
              <View style={styles.photoContainer}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photo} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="person" size={48} color="#9CA3AF" />
                    <Text style={styles.photoPlaceholderText}>Foto requerida</Text>
                  </View>
                )}
                <View style={styles.photoStatus}>
                  {photoUri && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
                </View>
              </View>
              
              <View style={styles.photoActions}>
                <TouchableOpacity style={styles.photoActionPrimary} onPress={openCamera}>
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                  <Text style={styles.photoActionText}>Cámara</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoActionSecondary} onPress={selectFromGallery}>
                  <Ionicons name="image" size={20} color={colors.primary} />
                  <Text style={styles.photoActionTextSecondary}>Galería</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.form}>
              
              {/* Crew ID */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  Crew ID <Text style={styles.required}>*</Text>
                </Text>
                <View style={[
                  styles.inputContainer, 
                  crewIdFocused && styles.inputContainerFocused
                ]}>
                  <Ionicons 
                    name="id-card-outline" 
                    size={20} 
                    color={crewIdFocused ? colors.primary : '#9CA3AF'} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Ingresa el ID único"
                    placeholderTextColor="#9CA3AF"
                    value={crewId}
                    onChangeText={setCrewId}
                    onFocus={() => setCrewIdFocused(true)}
                    onBlur={() => setCrewIdFocused(false)}
                    autoCorrect={false}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Nombres y Apellidos */}
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>
                      Nombres <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={[
                      styles.inputContainer, 
                      nombresFocused && styles.inputContainerFocused
                    ]}>
                      <Ionicons 
                        name="person-outline" 
                        size={20} 
                        color={nombresFocused ? colors.primary : '#9CA3AF'} 
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Nombres"
                        placeholderTextColor="#9CA3AF"
                        value={nombres}
                        onChangeText={setNombres}
                        onFocus={() => setNombresFocused(true)}
                        onBlur={() => setNombresFocused(false)}
                        autoCorrect={false}
                        autoCapitalize="words"
                        editable={!loading}
                      />
                    </View>
                  </View>
                </View>
                
                <View style={styles.halfField}>
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>
                      Apellidos <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={[
                      styles.inputContainer, 
                      apellidosFocused && styles.inputContainerFocused
                    ]}>
                      <Ionicons 
                        name="person-outline" 
                        size={20} 
                        color={apellidosFocused ? colors.primary : '#9CA3AF'} 
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Apellidos"
                        placeholderTextColor="#9CA3AF"
                        value={apellidos}
                        onChangeText={setApellidos}
                        onFocus={() => setApellidosFocused(true)}
                        onBlur={() => setApellidosFocused(false)}
                        autoCorrect={false}
                        autoCapitalize="words"
                        editable={!loading}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Pasaporte */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  Pasaporte <Text style={styles.required}>*</Text>
                </Text>
                <View style={[
                  styles.inputContainer, 
                  pasaporteFocused && styles.inputContainerFocused
                ]}>
                  <Ionicons 
                    name="document-outline" 
                    size={20} 
                    color={pasaporteFocused ? colors.primary : '#9CA3AF'} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Número de pasaporte"
                    placeholderTextColor="#9CA3AF"
                    value={pasaporte}
                    onChangeText={setPasaporte}
                    onFocus={() => setPasaporteFocused(true)}
                    onBlur={() => setPasaporteFocused(false)}
                    autoCorrect={false}
                    autoCapitalize="characters"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Documento de Identidad */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  Documento de Identidad
                </Text>
                <View style={[
                  styles.inputContainer, 
                  docIdentidadFocused && styles.inputContainerFocused
                ]}>
                  <Ionicons 
                    name="card-outline" 
                    size={20} 
                    color={docIdentidadFocused ? colors.primary : '#9CA3AF'} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Número de documento (opcional)"
                    placeholderTextColor="#9CA3AF"
                    value={docIdentidad}
                    onChangeText={setDocIdentidad}
                    onFocus={() => setDocIdentidadFocused(true)}
                    onBlur={() => setDocIdentidadFocused(false)}
                    autoCorrect={false}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Selector de posición */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  Posición <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.positionSelector,
                    selectedPosition && styles.positionSelectorSelected
                  ]}
                  onPress={() => setShowPositionModal(true)}
                  disabled={loading}
                >
                  <View style={styles.positionSelectorContent}>
                    <Ionicons 
                      name="briefcase-outline" 
                      size={20} 
                      color={selectedPosition ? colors.primary : '#9CA3AF'} 
                    />
                    <View style={styles.positionSelectorText}>
                      {selectedPosition ? (
                        <>
                          <Text style={styles.positionSelectorValue}>
                            {selectedPosition.codigo_posicion}
                          </Text>
                          <Text style={styles.positionSelectorDescription} numberOfLines={1} ellipsizeMode="tail">
                            {selectedPosition.descripcion}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.positionSelectorPlaceholder}>
                          Selecciona una posición
                        </Text>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Botón de envío */}
              <TouchableOpacity 
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                <View style={styles.submitButtonContent}>
                  {loading ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" style={{marginRight: 8}} />
                      <Text style={styles.submitButtonText}>Procesando...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Guardar Tripulante</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </ScrollView>

      <PositionModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  formContainer: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  photoStatus: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  photoActionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  photoActionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  photoActionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  photoActionTextSecondary: {
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14,
    height: 52,
  },
  inputContainerFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfField: {
    flex: 1,
  },
  positionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14,
    paddingVertical: 16,
    height: 52,
  },
  positionSelectorSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
  },
  positionSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  positionSelectorText: {
    marginLeft: 10,
    flex: 1,
  },
  positionSelectorValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  positionSelectorDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 1,
    lineHeight: 16,
  },
  positionSelectorPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowColor: 'transparent',
    elevation: 0,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  positionItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  positionItemSelected: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
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
    color: '#1F2937',
    marginBottom: 2,
  },
  positionDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
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
  },
  cameraGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  cameraGuideFrame: {
    width: 240,
    height: 240,
    borderRadius: 120,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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