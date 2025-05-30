import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { CrewMember } from '../../types';

interface CrewCardProps {
  member: CrewMember;
  onPress: () => void;
}

export default function CrewCard({ member, onPress }: CrewCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.content}>
        {member.photoUri ? (
          <Image source={{ uri: member.photoUri }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderText}>
              {member.nombres.charAt(0)}{member.apellidos.charAt(0)}
            </Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name}>{member.nombres} {member.apellidos}</Text>
          <Text style={styles.detail}>ID: {member.crewId}</Text>
          <Text style={styles.detail}>Posición: {member.posicion}</Text>
          <Text style={styles.detail}>Pasaporte: {member.pasaporte}</Text>
          {!member.synced && <Text style={styles.syncStatus}>Pendiente de sincronizar</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    padding: 15,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#001689',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  photoPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  detail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  syncStatus: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 5,
    fontStyle: 'italic',
  },
});