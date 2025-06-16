import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, RefreshControl, TouchableOpacity, 
  TextInput, ActivityIndicator, Animated, Alert, Modal, ScrollView,
  Dimensions, useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useSession } from '../../store/authStore';
import { useNetwork } from '../../store/networkStore';
import { apiService, Planificacion, MarcacionInfo } from '../../services/api';

const AnimatedFlatList = Animated.createAnimatedComponent(Animated.FlatList<Planificacion>);

export default function PlanificacionesList() {
  const { user } = useSession();
  const { isConnected } = useNetwork();
  const { height: windowHeight } = useWindowDimensions();
  
  const [planificaciones, setPlanificaciones] = useState<Planificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Estados para el modal de marcación
  const [showMarcacionModal, setShowMarcacionModal] = useState(false);
  const [marcacionInfo, setMarcacionInfo] = useState<MarcacionInfo | null>(null);
  const [loadingMarcacion, setLoadingMarcacion] = useState(false);

  useEffect(() => {
    if (user) {
      loadPlanificaciones();
    }
  }, [user]);

  const loadPlanificaciones = async (searchTerm?: string, pageNum: number = 1, showLoader: boolean = true) => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (!isConnected && pageNum === 1) {
      Alert.alert('Sin conexión', 'No se pueden cargar las planificaciones sin conexión a internet');
      setLoading(false);
      return;
    }

    if (showLoader && pageNum === 1) {
      setLoading(true);
    }

    try {
      const response = await apiService.getPlanificaciones(pageNum, searchTerm);
      
      if (response.success) {
        if (pageNum === 1) {
          setPlanificaciones(response.data);
        } else {
          setPlanificaciones(prev => [...prev, ...response.data]);
        }
        
        const pagination = response.pagination;
        setHasMore(pagination ? pagination.current_page < pagination.last_page : false);
        setPage(pageNum);
      }
    } catch (error: any) {
      console.error('Error loading planificaciones:', error);
      Alert.alert('Error', 'No se pudieron cargar las planificaciones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    if (!user) return;
    
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadPlanificaciones(search, 1, false);
  };

  const handleSearch = (text: string) => {
    if (!user) return;
    
    setSearch(text);
    setPage(1);
    setHasMore(true);
    loadPlanificaciones(text, 1, false);
  };

  const loadMore = () => {
    if (!loading && hasMore && isConnected && user) {
      loadPlanificaciones(search, page + 1, false);
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'procesada':
        return colors.success;
      case 'pendiente':
        return colors.warning;
      default:
        return colors.gray[500];
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'procesada':
        return 'checkmark-circle';
      case 'pendiente':
        return 'time';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const dateParts = dateString.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    const day = parseInt(dateParts[2]);
    
    const date = new Date(year, month, day);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '--:--';
    return timeString.substring(0, 5); // HH:MM format
  };

  const handlePlanificacionClick = async (item: Planificacion) => {
    if (item.estado.toLowerCase() === 'procesada') {
      // Si está procesada, mostrar información de marcación
      setLoadingMarcacion(true);
      setMarcacionInfo(null); // Limpiar datos previos
      try {
        const response = await apiService.getMarcacionInfo(item.id_planificacion);
        
        if (response.success && response.data) {
          // Log para visualizar información del aeropuerto
          console.log('Información de marcación obtenida:', {
            aeropuerto: response.data.lugar_marcacion.nombre,
            codigo_aeropuerto: response.data.lugar_marcacion.codigo,
            punto_control: response.data.punto_control.descripcion,
            planificacion_id: item.id_planificacion
          });
          
          setMarcacionInfo(response.data);
          setShowMarcacionModal(true);
          
        } else {
          
          Alert.alert('Error', 'No se encontró información de marcación para esta planificación');
        }
      } catch (error: any) {
        Alert.alert('Error', error.message || 'No se pudo obtener la información de marcación');
      } finally {
        setLoadingMarcacion(false);
      }
    } else {
      // Si no está procesada, mostrar modal moderno con información básica
      setMarcacionInfo({
        planificacion: item,
        isPending: true
      } as any);
      setShowMarcacionModal(true);
    }
  };

  const renderPlanificacion = ({ item }: { item: Planificacion }) => {
    const statusColor = getStatusColor(item.estado);
    const statusIcon = getStatusIcon(item.estado);
    const isPending = item.estado.toLowerCase() === 'pendiente';

    return (
      <TouchableOpacity 
        style={styles.cardContainer}
        onPress={() => handlePlanificacionClick(item)}
        activeOpacity={0.7}
        disabled={loadingMarcacion}
      >
        <View style={[styles.card, isPending ? styles.pendingCard : styles.processedCard]}>
          {isPending ? (
            // Diseño moderno para planificaciones pendientes
            <View style={styles.pendingCardContent}>
              <View style={styles.pendingHeader}>
                <View style={styles.pendingFlightInfo}>
                  <Text style={styles.pendingFlightNumber}>{item.numero_vuelo || 'N/A'}</Text>
                  <Text style={styles.pendingPosition}>{item.iata_aerolinea || 'N/A'}</Text>
                </View>
                <View style={[styles.pendingStatusBadge, { backgroundColor: statusColor }]}>
                  <Ionicons name={statusIcon} size={16} color="#FFFFFF" />
                  <Text style={styles.pendingStatusText}>{item.estado}</Text>
                </View>
              </View>
              
              <View style={styles.pendingDetails}>
                <View style={styles.pendingDetailItem}>
                  <View style={styles.pendingDetailIcon}>
                    <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.pendingDetailContent}>
                    <Text style={styles.pendingDetailLabel}>Fecha</Text>
                    <Text style={styles.pendingDetailValue}>{formatDate(item.fecha_vuelo)}</Text>
                  </View>
                </View>
                
                <View style={styles.pendingDetailSeparator} />
                
                <View style={styles.pendingDetailItem}>
                  <View style={styles.pendingDetailIcon}>
                    <Ionicons name="time-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.pendingDetailContent}>
                    <Text style={styles.pendingDetailLabel}>Hora</Text>
                    <Text style={styles.pendingDetailValue}>{formatTime(item.hora_salida)}</Text>
                  </View>
                </View>
              </View>

              {item.observaciones && (
                <View style={styles.pendingObservations}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.gray[500]} />
                  <Text style={styles.pendingObservationsText}>{item.observaciones}</Text>
                </View>
              )}
            </View>
          ) : (
            // Diseño moderno para planificaciones procesadas (igual que pendientes)
            <View style={styles.pendingCardContent}>
              <View style={styles.pendingHeader}>
                <View style={styles.pendingFlightInfo}>
                  <Text style={styles.pendingFlightNumber}>{item.numero_vuelo || 'N/A'}</Text>
                  <Text style={styles.pendingPosition}>{item.iata_aerolinea || 'N/A'}</Text>
                </View>
                <View style={[styles.pendingStatusBadge, { backgroundColor: statusColor }]}>
                  <Ionicons name={statusIcon} size={16} color="#FFFFFF" />
                  <Text style={styles.pendingStatusText}>{item.estado}</Text>
                </View>
              </View>
              
              <View style={styles.pendingDetails}>
                <View style={styles.pendingDetailItem}>
                  <View style={styles.pendingDetailIcon}>
                    <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.pendingDetailContent}>
                    <Text style={styles.pendingDetailLabel}>Fecha</Text>
                    <Text style={styles.pendingDetailValue}>{formatDate(item.fecha_vuelo)}</Text>
                  </View>
                </View>
                
                <View style={styles.pendingDetailSeparator} />
                
                <View style={styles.pendingDetailItem}>
                  <View style={styles.pendingDetailIcon}>
                    <Ionicons name="time-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.pendingDetailContent}>
                    <Text style={styles.pendingDetailLabel}>Hora</Text>
                    <Text style={styles.pendingDetailValue}>{formatTime(item.hora_salida)}</Text>
                  </View>
                </View>
              </View>

              {item.observaciones && (
                <View style={styles.pendingObservations}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.gray[500]} />
                  <Text style={styles.pendingObservationsText}>{item.observaciones}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && planificaciones.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando planificaciones...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.gray[500]} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar vuelos..."
            placeholderTextColor={colors.gray[500]}
            value={search}
            onChangeText={handleSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={colors.gray[500]} />
            </TouchableOpacity>
          )}
        </View>
        {!isConnected && (
          <View style={styles.offlineIndicator}>
            <Ionicons name="cloud-offline" size={14} color={colors.white} />
            <Text style={styles.offlineText}>Sin conexión</Text>
          </View>
        )}
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>Hola, {user.nombres}</Text>
            <Text style={styles.positionText}>
              {user.posicion.descripcion} ({user.crew_id})
            </Text>
          </View>
        )}
      </View>

      <AnimatedFlatList
        data={planificaciones}
        renderItem={renderPlanificacion}
        keyExtractor={(item) => item.id_planificacion.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[colors.primary]} 
            tintColor={colors.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={
          loading && planificaciones.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar" size={80} color={colors.primary} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>
              {search ? 'No se encontraron planificaciones' : 'No hay planificaciones asignadas'}
            </Text>
            <Text style={styles.emptySubtext}>
              {search ? 'Intenta con otros términos de búsqueda' : 'Cuando tengas vuelos asignados aparecerán aquí'}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      />

      {/* Modal de Información de Marcación */}
      <Modal
        visible={showMarcacionModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowMarcacionModal(false);
          setMarcacionInfo(null);
        }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowMarcacionModal(false);
            setMarcacionInfo(null);
          }}
        >
          <View style={styles.marcacionModalContainer}>
            <TouchableOpacity 
              style={styles.modalContent}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.marcacionModalHeader}>
                <View style={styles.marcacionHeaderInfo}>
                  <Ionicons 
                    name={(marcacionInfo as any)?.isPending ? "time" : "checkmark-circle"} 
                    size={24} 
                    color={(marcacionInfo as any)?.isPending ? colors.warning : colors.success} 
                  />
                  <Text style={styles.marcacionModalTitle}>
                    {(marcacionInfo as any)?.isPending ? 'Planificación Pendiente' : 'Información de Marcación'}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => {
                    setShowMarcacionModal(false);
                    setMarcacionInfo(null);
                  }}
                >
                  <Ionicons name="close" size={24} color={colors.gray[600]} />
                </TouchableOpacity>
              </View>

              {(() => {
                if (loadingMarcacion) {
                  return (
                    <View style={styles.marcacionLoadingContainer}>
                      <ActivityIndicator size="large" color={colors.primary} />
                      <Text style={styles.marcacionLoadingText}>Cargando información...</Text>
                    </View>
                  );
                } else if (marcacionInfo) {
                  // Verificar si es una planificación pendiente
                  const isPending = (marcacionInfo as any).isPending;
                  const planData = isPending ? (marcacionInfo as any).planificacion : marcacionInfo.planificacion;
                  
                  return (
                    <ScrollView 
                      style={styles.marcacionModalContent}
                      contentContainerStyle={styles.marcacionScrollContent}
                      showsVerticalScrollIndicator={true}
                      bounces={true}
                      nestedScrollEnabled={true}
                    >
                      {/* Información del vuelo */}
                      <View style={styles.marcacionSection}>
                        <Text style={styles.marcacionSectionTitle}>Información del Vuelo</Text>
                        <View style={styles.marcacionInfoCard}>
                          <View style={styles.marcacionInfoRow}>
                            <View style={styles.marcacionInfoItem}>
                              <Text style={styles.marcacionInfoLabel}>Número de Vuelo</Text>
                              <Text style={styles.marcacionInfoValue}>{planData.numero_vuelo || 'N/A'}</Text>
                            </View>
                            {/* Solo mostrar aerolínea si NO es pendiente */}
                            {!isPending && (
                              <View style={styles.marcacionInfoItem}>
                                <Text style={styles.marcacionInfoLabel}>Aerolínea</Text>
                                <Text style={styles.marcacionInfoValue}>{planData.iata_aerolinea || 'N/A'}</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.marcacionInfoRow}>
                            <View style={styles.marcacionInfoItem}>
                              <Text style={styles.marcacionInfoLabel}>Fecha del Vuelo</Text>
                              <Text style={styles.marcacionInfoValue}>{formatDate(planData.fecha_vuelo)}</Text>
                            </View>
                            <View style={styles.marcacionInfoItem}>
                              <Text style={styles.marcacionInfoLabel}>Hora de Salida</Text>
                              <Text style={styles.marcacionInfoValue}>{formatTime(planData.hora_salida || planData.hora_vuelo)}</Text>
                            </View>
                          </View>
                          {isPending && (
                            <View style={styles.marcacionInfoSingle}>
                              <Text style={styles.marcacionInfoLabel}>Estado</Text>
                              <View style={styles.pendingStatusBadgeModal}>
                                <Ionicons name="time" size={16} color={colors.warning} />
                                <Text style={[styles.marcacionInfoValue, { color: colors.warning, marginLeft: 6 }]}>Pendiente</Text>
                              </View>
                            </View>
                          )}
                          {planData.observaciones && (
                            <View style={styles.marcacionInfoSingleColumn}>
                              <Text style={styles.marcacionInfoLabel}>Observaciones</Text>
                              <Text style={styles.marcacionInfoValue}>{planData.observaciones}</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Solo mostrar información de marcación si no es pendiente */}
                      {!isPending && (
                        <>
                          {/* Información de marcación */}
                          <View style={styles.marcacionSection}>
                            <Text style={styles.marcacionSectionTitle}>Datos de Marcación</Text>
                            <View style={styles.marcacionInfoCard}>
                              <View style={styles.marcacionInfoRow}>
                                <View style={styles.marcacionInfoItem}>
                                  <Text style={styles.marcacionInfoLabel}>Fecha de Marcación</Text>
                                  <Text style={styles.marcacionInfoValue}>{formatDate(marcacionInfo.fecha_marcacion)}</Text>
                                </View>
                                <View style={styles.marcacionInfoItem}>
                                  <Text style={styles.marcacionInfoLabel}>Hora de Marcación</Text>
                                  <Text style={styles.marcacionInfoValue}>{formatTime(marcacionInfo.hora_marcacion)}</Text>
                                </View>
                              </View>
                            </View>
                          </View>

                          {/* Ubicación */}
                          <View style={styles.marcacionSection}>
                            <Text style={styles.marcacionSectionTitle}>Ubicación de Marcación</Text>
                            <View style={styles.marcacionInfoCard}>
                              <View style={styles.marcacionInfoSingleColumn}>
                                <Text style={styles.marcacionInfoLabel}>Aeropuerto</Text>
                                <Text style={styles.marcacionInfoValueLarge}>
                                  {marcacionInfo.lugar_marcacion.nombre}
                                </Text>
                                <Text style={styles.marcacionInfoValueSubtext}>
                                  Código: {marcacionInfo.lugar_marcacion.codigo}
                                </Text>
                              </View>
                              <View style={styles.marcacionInfoSingleColumn}>
                                <Text style={styles.marcacionInfoLabel}>Punto de Control</Text>
                                <Text style={styles.marcacionInfoValueLarge}>{marcacionInfo.punto_control.descripcion}</Text>
                              </View>
                            </View>
                          </View>

                          {/* Dispositivo */}
                          {marcacionInfo.dispositivo && (
                            <View style={styles.marcacionSection}>
                              <Text style={styles.marcacionSectionTitle}>Información del Dispositivo</Text>
                              <View style={styles.marcacionInfoCard}>
                                <View style={styles.marcacionInfoRow}>
                                  <View style={styles.marcacionInfoItem}>
                                    <Text style={styles.marcacionInfoLabel}>ID del Dispositivo</Text>
                                    <Text style={styles.marcacionInfoValue}>{marcacionInfo.dispositivo.device_id}</Text>
                                  </View>
                                  <View style={styles.marcacionInfoItem}>
                                    <Text style={styles.marcacionInfoLabel}>Número de Serie</Text>
                                    <Text style={styles.marcacionInfoValue}>{marcacionInfo.dispositivo.device_sn}</Text>
                                  </View>
                                </View>
                              </View>
                            </View>
                          )}

                        </>
                      )}

                      {/* Información adicional para pendientes */}
                      {isPending && (
                        <View style={styles.marcacionSection}>
                          <Text style={styles.marcacionSectionTitle}>Estado de la Planificación</Text>
                          <View style={styles.pendingInfoCard}>
                            <View style={styles.pendingInfoContent}>
                              <Ionicons name="information-circle" size={24} color={colors.warning} />
                              <Text style={styles.pendingInfoText}>
                                Esta planificación aún no ha sido procesada. Una vez que se complete la marcación, 
                                podrás ver información detallada sobre el aeropuerto, punto de control y dispositivo utilizado.
                              </Text>
                            </View>
                          </View>
                          
                          <View style={styles.pendingNextStepsCard}>
                            <Text style={styles.pendingNextStepsTitle}>Próximos pasos:</Text>
                            <Text style={styles.pendingNextStepItem}>• Dirígete al aeropuerto en la fecha programada</Text>
                            <Text style={styles.pendingNextStepItem}>• Realiza la marcación en el punto de control asignado</Text>
                            <Text style={styles.pendingNextStepItem}>• La información se actualizará automáticamente</Text>
                          </View>
                        </View>
                      )}

                    </ScrollView>
                  );
                } else {
                  return (
                    <View style={styles.marcacionEmptyContainer}>
                      <Ionicons name="information-circle-outline" size={48} color={colors.gray[400]} />
                      <Text style={styles.marcacionEmptyText}>No hay información disponible</Text>
                    </View>
                  );
                }
              })()}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.gray[600],
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
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.dark,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 8,
    alignSelf: 'center',
  },
  offlineText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  userInfo: {
    alignItems: 'center',
  },
  welcomeText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  positionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  list: {
    padding: 15,
    paddingTop: 20,
  },
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  flightInfo: {
    flex: 1,
  },
  flightNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
  },
  aircraft: {
    fontSize: 14,
    color: colors.gray[600],
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: colors.gray[600],
    marginLeft: 6,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeText: {
    fontSize: 16,
    color: colors.gray[600],
    marginLeft: 8,
    fontWeight: '600',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  cityContainer: {
    alignItems: 'center',
  },
  cityCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
  },
  routeCenter: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  routeLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  positionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  flightDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flightDetailsValue: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  observationsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  observationsText: {
    fontSize: 14,
    color: colors.gray[600],
    marginLeft: 6,
    flex: 1,
    lineHeight: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  marcacionModalContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: '95%',
    maxWidth: 500,
    maxHeight: '85%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    height: '100%',
    maxHeight: '100%',
  },
  marcacionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  marcacionHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marcacionModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginLeft: 10,
  },
  modalCloseButton: {
    padding: 8,
  },
  marcacionModalContent: {
    flex: 1,
    paddingTop: 8,
  },
  marcacionScrollContent: {
    paddingBottom: 30,
    flexGrow: 1,
  },
  marcacionSection: {
    marginBottom: 24,
  },
  marcacionSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 12,
  },
  marcacionInfoCard: {
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  marcacionInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  marcacionInfoItem: {
    flex: 1,
    marginRight: 8,
  },
  marcacionInfoLabel: {
    fontSize: 12,
    color: colors.gray[500],
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  marcacionInfoValue: {
    fontSize: 14,
    color: colors.dark,
    fontWeight: '600',
  },
  marcacionInfoValueLarge: {
    fontSize: 16,
    color: colors.dark,
    fontWeight: '700',
    marginBottom: 4,
  },
  marcacionInfoValueSubtext: {
    fontSize: 12,
    color: colors.gray[600],
    fontStyle: 'italic',
  },
  marcacionInfoSingle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  marcacionInfoSingleColumn: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  marcacionStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marcacionStatusText: {
    fontSize: 14,
    color: colors.gray[600],
    marginLeft: 4,
  },
  timeIcon: {
    marginLeft: 8,
  },
  // Estilos para el modal de marcación
  marcacionLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  marcacionLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray[600],
  },
  marcacionEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  marcacionEmptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
  },
  pendingCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  processedCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  pendingCardContent: {
    padding: 16,
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pendingFlightInfo: {
    flex: 1,
  },
  pendingFlightNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
  },
  pendingPosition: {
    fontSize: 14,
    color: colors.gray[600],
    marginTop: 2,
  },
  pendingStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingStatusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  pendingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    padding: 12,
  },
  pendingDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pendingDetailIcon: {
    marginRight: 8,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 6,
  },
  pendingDetailContent: {
    flex: 1,
  },
  pendingDetailLabel: {
    fontSize: 12,
    color: colors.gray[500],
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  pendingDetailValue: {
    fontSize: 16,
    color: colors.dark,
    fontWeight: '700',
    marginTop: 2,
  },
  pendingDetailSeparator: {
    width: 1,
    height: 30,
    backgroundColor: colors.gray[300],
    marginHorizontal: 12,
  },
  pendingObservations: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  pendingObservationsText: {
    fontSize: 14,
    color: colors.gray[600],
    marginLeft: 6,
    flex: 1,
    lineHeight: 20,
  },
  pendingStatusBadgeModal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingInfoCard: {
    backgroundColor: colors.warning + '10',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    marginBottom: 16,
  },
  pendingInfoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pendingInfoText: {
    fontSize: 14,
    color: colors.gray[700],
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  pendingNextStepsCard: {
    backgroundColor: colors.primary + '08',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  pendingNextStepsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
    marginBottom: 8,
  },
  pendingNextStepItem: {
    fontSize: 13,
    color: colors.gray[700],
    lineHeight: 18,
    marginBottom: 4,
  },
  processedSummaryCard: {
    backgroundColor: colors.success + '08',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  processedSummaryContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  processedSummaryText: {
    fontSize: 14,
    color: colors.gray[700],
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});