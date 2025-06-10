import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../../store/authStore';
import { useNetwork } from '../../store/networkStore';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function Profile() {
  const { signOut, user } = useSession();
  const { isConnected } = useNetwork();

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[colors.primary, colors.quaternary || '#0A1338']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {user?.aerolinea?.logo_base64 ? (
                <Image 
                  source={{ uri: `data:image/png;base64,${user.aerolinea.logo_base64}` }}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
                </View>
              )}
            </View>
            <Text style={styles.username}>{user?.name || 'Usuario'}</Text>
            <Text style={styles.email}>{user?.email || ''}</Text>
            <View style={styles.roleContainer}>
              <Ionicons name="shield-checkmark" size={14} color={colors.white} style={styles.roleIcon} />
              <Text style={styles.role}>Administrador</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Información de la aerolínea */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aerolínea</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="airplane" size={22} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Compañía</Text>
                  <Text style={styles.infoValue}>{user?.aerolinea?.descripcion || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="person-circle" size={22} color={colors.success} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Usuario</Text>
                  <Text style={styles.infoValue}>{user?.login || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Estado del sistema */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estado del Sistema</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  {isConnected ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                  ) : (
                    <Ionicons name="close-circle" size={22} color={colors.danger} />
                  )}
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Conexión</Text>
                  <Text style={styles.infoValue}>{isConnected ? 'Conectado' : 'Desconectado'}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="sync" size={22} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Última sincronización</Text>
                  <Text style={styles.infoValue}>Hace 2 minutos</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Mensaje inspirador */}
          <View style={styles.messageCard}>
            <Ionicons name="information-circle" size={24} color={colors.primary} style={styles.messageIcon} />
            <Text style={styles.messageTitle}>Gestión de Tripulación Eficiente</Text>
            <Text style={styles.messageText}>
              "Un equipo de tripulación bien gestionado es fundamental para una operación aérea segura y eficiente. CrewManager te permite optimizar recursos, cumplir normativas y ofrecer la mejor experiencia a tus pasajeros."
            </Text>
          </View>

          {/* Acciones */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Acciones</Text>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="help-circle" size={22} color={colors.primary} style={styles.actionIcon} />
              <Text style={styles.actionText}>Ayuda y soporte</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out" size={20} color={colors.white} style={styles.signOutIcon} />
            <Text style={styles.signOutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>

          {/* Información de la versión */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>CrewManager v1.0.0</Text>
            <Text style={styles.versionSubtext}>© 2025 - Todos los derechos reservados</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  avatarText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.primary,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
    marginBottom: 10,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleIcon: {
    marginRight: 5,
  },
  role: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 12,
  },
  content: {
    padding: 20,
    paddingTop: 30,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 12,
  },
  messageCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  messageIcon: {
    marginBottom: 10,
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 10,
  },
  messageText: {
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 22,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  actionIcon: {
    marginRight: 16,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.dark,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    paddingVertical: 15,
    borderRadius: 12,
    marginVertical: 10,
  },
  signOutIcon: {
    marginRight: 8,
  },
  signOutButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 5,
  },
  versionSubtext: {
    fontSize: 12,
    color: colors.gray[400],
  },
});