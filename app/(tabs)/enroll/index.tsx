import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useCrew } from '../../../store/crewStore';
import { Crew } from '../../../types';
import { colors } from '../../../constants/colors';

export default function EnrollCrew() {
  const { addCrew } = useCrew();
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [cameraRef, setCameraRef] = useState<any>(null);
  
  const [formData, setFormData] = useState<Crew>({
    crewId: '',
    nombres: '',
    apellidos: '',
    posicion: '',
    pasaporte: '',
    docIdentidad: '',
  });

  const positions = ['Piloto', 'Copiloto', 'Sobrecargo Jefe', 'Sobrecargo'];

  const handleInputChange = (field: keyof Crew, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
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
      const photo = await cameraRef.takePictureAsync();
      setPhotoUri(photo.uri);
      setShowCamera(false);
    }
  };

  const validateForm = () => {
    if (!formData.crewId || !formData.nombres || !formData.apellidos || !formData.posicion || !formData.pasaporte) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return false;
    }
    if (!photoUri) {
      Alert.alert('Error', 'Por favor toma o selecciona una foto');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      router.push({
        pathname: '/(tabs)/enroll/confirm',
        params: {
          ...formData,
          photoUri,
        },
      });
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView 
          style={styles.camera} 
          facing="front"
          ref={setCameraRef}
        >
          <View style={styles.cameraButtons}>
            <TouchableOpacity style={styles.cameraButton} onPress={() => setShowCamera(false)}>
              <Text style={styles.cameraButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cameraButton} onPress={takePicture}>
              <Text style={styles.cameraButtonText}>Tomar Foto</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Enrolar Tripulante</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.photoSection}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>Foto</Text>
                </View>
              )}
              <View style={styles.photoButtons}>
                <TouchableOpacity style={styles.photoButton} onPress={openCamera}>
                  <Text style={styles.photoButtonText}>Tomar Foto</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={selectFromGallery}>
                  <Text style={styles.photoButtonText}>Seleccionar</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.label}>Crew ID *</Text>
            <TextInput
              style={styles.input}
              value={formData.crewId}
              onChangeText={(text) => handleInputChange('crewId', text)}
              placeholder="Ingrese Crew ID"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Nombres *</Text>
            <TextInput
              style={styles.input}
              value={formData.nombres}
              onChangeText={(text) => handleInputChange('nombres', text)}
              placeholder="Ingrese nombres"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Apellidos *</Text>
            <TextInput
              style={styles.input}
              value={formData.apellidos}
              onChangeText={(text) => handleInputChange('apellidos', text)}
              placeholder="Ingrese apellidos"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Posición *</Text>
            <View style={styles.positionContainer}>
              {positions.map((position) => (
                <TouchableOpacity
                  key={position}
                  style={[
                    styles.positionButton,
                    formData.posicion === position && styles.positionButtonActive,
                  ]}
                  onPress={() => handleInputChange('posicion', position)}
                >
                  <Text
                    style={[
                      styles.positionButtonText,
                      formData.posicion === position && styles.positionButtonTextActive,
                    ]}
                  >
                    {position}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Pasaporte *</Text>
            <TextInput
              style={styles.input}
              value={formData.pasaporte}
              onChangeText={(text) => handleInputChange('pasaporte', text)}
              placeholder="Ingrese número de pasaporte"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Doc. Identidad (Opcional)</Text>
            <TextInput
              style={styles.input}
              value={formData.docIdentidad}
              onChangeText={(text) => handleInputChange('docIdentidad', text)}
              placeholder="Ingrese documento de identidad"
              placeholderTextColor="#999"
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 15,
  },
  form: {
    padding: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  photo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 15,
  },
  photoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  photoPlaceholderText: {
    color: '#999',
    fontSize: 18,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  photoButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  positionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  positionButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  positionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  positionButtonText: {
    color: '#333',
  },
  positionButtonTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraButtons: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cameraButton: {
    backgroundColor: '#001689',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  cameraButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchContainer: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});