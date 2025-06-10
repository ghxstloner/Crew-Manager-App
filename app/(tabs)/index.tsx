import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, RefreshControl, TouchableOpacity, 
  TextInput, ActivityIndicator, Animated, Alert, FlatList 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useSession } from '../../store/authStore';
import { useNetwork } from '../../store/networkStore';
import { apiService, Planificacion } from '../../services/api';

export default function PlanificacionesList() {
  const { user } = useSession();
  const { isConnected } = useNetwork();
  
  const [planificaciones, setPlanificaciones] = useState<Planificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadPlanificaciones();
  }, []);

  const loadPlanificaciones = async (searchTerm?: string, pageNum: number = 1, showLoader: boolean = true) => {
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
        
        // Check if there are more pages
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
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadPlanificaciones(search, 1, false);
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    setPage(1);
    setHasMore(true);
    loadPlanificaciones(text, 1, false);
  };

  const loadMore = () => {
    if (!loading && hasMore && isConnected) {
      loadPlanificaciones(search, page + 1, false);
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'confirmado':
        return colors.success;
      case 'pendiente':
        return colors.warning;
      case 'cancelado':
        return colors.danger;
      default:
        return colors.gray[500];
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'confirmado':
        return 'checkmark-circle';
      case 'pendiente':
        return 'time';
      case 'cancelado':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '--:--';
    return timeString.substring(0, 5); // HH:MM format
  };

  const renderPlanificacion = ({ item }: { item: Planificacion }) => {
    const statusColor = getStatusColor(item.estado);
    const statusIcon = getStatusIcon(item.estado);

    return (
      <TouchableOpacity 
        style={styles.cardContainer}
        onPress={() => {
          // TODO: Navigate to planificacion details
          Alert.alert('Planificación', `Vuelo ${item.numero_vuelo}\n${item.origen} → ${item.destino}`);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.flightInfo}>
              <Text style={styles.flightNumber}>{item.numero_vuelo}</Text>
              <Text style={styles.aircraft}>{item.aeronave}</Text>
            </View>
            <View style={[styles.statusContainer, { backgroundColor: statusColor }]}>
              <Ionicons name={statusIcon} size={14} color="#FFFFFF" />
              <Text style={styles.statusText}>{item.estado}</Text>
            </View>
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.cityContainer}>
              <Text style={styles.cityCode}>{item.origen}</Text>
              <Text style={styles.timeText}>{formatTime(item.hora_salida)}</Text>
            </View>
            
            <View style={styles.routeCenter}>
              <Ionicons name="airplane" size={20} color={colors.primary} />
              <View style={styles.routeLine} />
            </View>
            
            <View style={styles.cityContainer}>
              <Text style={styles.cityCode}>{item.destino}</Text>
              <Text style={styles.timeText}>{formatTime(item.hora_llegada)}</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={16} color={colors.gray[500]} />
              <Text style={styles.dateText}>{formatDate(item.fecha_vuelo)}</Text>
            </View>
            <View style={styles.positionContainer}>
              <Ionicons name="person-outline" size={16} color={colors.primary} />
              <Text style={styles.positionText}>{item.posicion}</Text>
            </View>
          </View>

          {item.observaciones && (
            <View style={styles.observationsContainer}>
              <Ionicons name="information-circle-outline" size={14} color={colors.gray[500]} />
              <Text style={styles.observationsText}>{item.observaciones}</Text>
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

      <FlatList<Planificacion>
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
  },
  cityContainer: {
    flex: 1,
    alignItems: 'center',
  },
  cityCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
  },
  timeText: {
    fontSize: 16,
    color: colors.gray[600],
    marginTop: 4,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  positionContainer: {
    flexDirection: 'row',
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
});