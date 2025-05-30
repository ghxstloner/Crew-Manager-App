import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useCrew } from '../../../store/crewStore';
import { CrewMember } from '../../../types';
import { colors } from '../../../constants/colors';

export default function ConfirmEnroll() {
  const params = useLocalSearchParams();
  const { addCrew } = useCrew();

  const handleConfirm = async () => {
    try {
      const newCrewMember: CrewMember = {
        id: Date.now().toString(),
        crewId: params.crewId as string,
        nombres: params.nombres as string,
        apellidos: params.apellidos as string,
        posicion: params.posicion as string,
        pasaporte: params.pasaporte as string,
        docIdentidad: params.docIdentidad as string,
        photoUri: params.photoUri as string,
        createdAt: new Date().toISOString(),
        synced: false,
      };

      await addCrew(newCrewMember);
      Alert.alert('Éxito', 'Tripulante enrolado correctamente', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/crew') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo enrolar al tripulante');
    }
  };

  const handleEdit = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Confirmar Datos</Text>
          <Text style={styles.subtitle}>Revisa la información antes de enviar</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.photoSection}>
            <Image source={{ uri: params.photoUri as string }} style={styles.photo} />
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Crew ID:</Text>
              <Text style={styles.value}>{params.crewId}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Nombres:</Text>
              <Text style={styles.value}>{params.nombres}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Apellidos:</Text>
              <Text style={styles.value}>{params.apellidos}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Posición:</Text>
              <Text style={styles.value}>{params.posicion}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Pasaporte:</Text>
              <Text style={styles.value}>{params.pasaporte}</Text>
            </View>

            {params.docIdentidad && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Doc. Identidad:</Text>
                <Text style={styles.value}>{params.docIdentidad}</Text>
              </View>
            )}
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Confirmar y Enviar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  content: {
    padding: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#001689',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  label: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  buttons: {
    flexDirection: 'row',
    gap: 15,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#001689',
  },
  editButtonText: {
    color: '#001689',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});