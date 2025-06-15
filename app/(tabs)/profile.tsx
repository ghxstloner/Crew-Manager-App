import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../../store/authStore';
import { useNetwork } from '../../store/networkStore';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/api';

export default function Profile() {
  const { signOut, user, setUser } = useSession();
  const { isConnected } = useNetwork();
  
  // Estados para edición
  const [isEditing, setIsEditing] = useState(false);
  const [editedPassport, setEditedPassport] = useState(user?.pasaporte || '');
  const [savingProfile, setSavingProfile] = useState(false);

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

  const handleSaveProfile = async () => {
    if (!editedPassport.trim()) {
      Alert.alert('Error', 'El pasaporte no puede estar vacío');
      return;
    }

    if (editedPassport === user?.pasaporte) {
      setIsEditing(false);
      return;
    }

    setSavingProfile(true);
    try {
      const response = await apiService.updateProfile({
        pasaporte: editedPassport.trim()
      });

      if (response.success && response.data) {
        setUser(response.data);
        setIsEditing(false);
        Alert.alert('Éxito', 'Pasaporte actualizado correctamente');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el pasaporte');
      setEditedPassport(user?.pasaporte || '');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedPassport(user?.pasaporte || '');
    setIsEditing(false);
  };

  const getStatusText = (estado: string) => {
    switch (estado) {
      case 'Aprobado':
        return 'Activo';
      case 'Pendiente':
        return 'Pendiente de Aprobación';
      case 'Denegado':
        return 'Denegado';
      default:
        return estado;
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Aprobado':
        return colors.success;
      case 'Pendiente':
        return colors.warning;
      case 'Denegado':
        return colors.danger;
      default:
        return colors.gray[500];
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'Aprobado':
        return 'checkmark-circle';
      case 'Pendiente':
        return 'time';
      case 'Denegado':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
              {user?.imagen_url ? (
                <Image 
                  source={{ uri: user.imagen_url }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user?.nombres?.charAt(0) || 'T'}{user?.apellidos?.charAt(0) || 'T'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.username}>{user?.nombres_apellidos || 'Tripulante'}</Text>
            <Text style={styles.crewId}>ID: {user?.crew_id || 'N/A'}</Text>
            <View style={[styles.statusContainer, { backgroundColor: getStatusColor(user?.estado || '') }]}>
              <Ionicons name={getStatusIcon(user?.estado || '')} size={14} color={colors.white} style={styles.statusIcon} />
              <Text style={styles.statusText}>{getStatusText(user?.estado || 'Desconocido')}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Información Personal */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderContainer}>
              <Text style={styles.sectionTitle}>Información Personal</Text>
              {!isEditing && (
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => setIsEditing(true)}
                >
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                  <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="person" size={22} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Nombres</Text>
                  <Text style={styles.infoValue}>{user?.nombres || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="person" size={22} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Apellidos</Text>
                  <Text style={styles.infoValue}>{user?.apellidos || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="document" size={22} color={colors.success} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Pasaporte</Text>
                  {isEditing ? (
                    <View style={styles.editContainer}>
                      <TextInput
                        style={styles.editInput}
                        value={editedPassport}
                        onChangeText={setEditedPassport}
                        placeholder="Número de pasaporte"
                        autoCapitalize="characters"
                        editable={!savingProfile}
                      />
                      <View style={styles.editActions}>
                        <TouchableOpacity 
                          style={styles.cancelButton}
                          onPress={handleCancelEdit}
                          disabled={savingProfile}
                        >
                          <Ionicons name="close" size={18} color={colors.danger} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.saveButton}
                          onPress={handleSaveProfile}
                          disabled={savingProfile}
                        >
                          {savingProfile ? (
                            <ActivityIndicator size="small" color={colors.success} />
                          ) : (
                            <Ionicons name="checkmark" size={18} color={colors.success} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.infoValue}>{user?.pasaporte || 'N/A'}</Text>
                  )}
                </View>
              </View>
              {user?.identidad && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoItem}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="card" size={22} color={colors.secondary} />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Documento de Identidad</Text>
                      <Text style={styles.infoValue}>{user.identidad}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Información Profesional */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Profesional</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="briefcase" size={22} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Posición</Text>
                  <Text style={styles.infoValue}>{user?.posicion.descripcion || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="code" size={22} color={colors.secondary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Código de Posición</Text>
                  <Text style={styles.infoValue}>{user?.posicion.codigo_posicion || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="calendar" size={22} color={colors.success} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Fecha de Solicitud</Text>
                  <Text style={styles.infoValue}>{formatDate(user?.fecha_solicitud)}</Text>
                </View>
              </View>
              {user?.fecha_aprobacion && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoItem}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                    </View>
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Fecha de Aprobación</Text>
                      <Text style={styles.infoValue}>{formatDate(user.fecha_aprobacion)}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Estado del Sistema */}
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
                  <Ionicons name="person-circle" size={22} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Estado del Perfil</Text>
                  <Text style={styles.infoValue}>
                    {user?.activo ? 'Activo' : 'Inactivo'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Mensaje informativo */}
          <View style={styles.messageCard}>
            <Ionicons name="information-circle" size={24} color={colors.primary} style={styles.messageIcon} />
            <Text style={styles.messageTitle}>CrewManager</Text>
            <Text style={styles.messageText}>
              "Tu perfil profesional está sincronizado con el sistema de gestión de tripulación. Mantén actualizada tu información y consulta regularmente tus planificaciones de vuelo."
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

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="document-text" size={22} color={colors.primary} style={styles.actionIcon} />
              <Text style={styles.actionText}>Términos y condiciones</Text>
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
            <Text style={styles.versionText}>CrewManager v1.0.0 - Tripulantes</Text>
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
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.white,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 5,
    textAlign: 'center',
  },
  crewId: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusIcon: {
    marginRight: 5,
  },
  statusText: {
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
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.light,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 4,
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
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark,
    backgroundColor: colors.gray[50],
  },
  editActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.success,
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