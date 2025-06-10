import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Image, RefreshControl, Animated, Alert } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCrew } from '../../store/crewStore';
import { useNetwork } from '../../store/networkStore';
import { Tripulante } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

export default function CrewList() {
  const { tripulantes, loading, loadTripulantes } = useCrew();
  const { isConnected } = useNetwork();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      await loadTripulantes();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al cargar tripulantes');
    }
  };

  const handleSearch = async (text: string) => {
    setSearch(text);
    try {
      await loadTripulantes(1, text || undefined);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error en la búsqueda');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadTripulantes(1, search || undefined);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al actualizar');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCardPress = (tripulante: Tripulante) => {
    Alert.alert(
      `${tripulante.nombres_apellidos}`,
      `ID: ${tripulante.crew_id}\nPosición: ${tripulante.posicion_info.descripcion}\nPasaporte: ${tripulante.pasaporte}${tripulante.identidad ? '\nDoc: ' + tripulante.identidad : ''}`,
      [
        { text: 'Cerrar', style: 'cancel' }
      ]
    );
  };

  const renderTripulante = ({ item, index }: { item: Tripulante, index: number }) => {
    const scale = scrollY.interpolate({
      inputRange: [-1, 0, 100 * index, 100 * (index + 2)],
      outputRange: [1, 1, 1, 0.9],
      extrapolate: 'clamp'
    });

    console.log('Imagen URL:', item.imagen_url);
    
    const opacity = scrollY.interpolate({
      inputRange: [-1, 0, 100 * index, 100 * (index + 1)],
      outputRange: [1, 1, 1, 0.5],
      extrapolate: 'clamp'
    });

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            opacity,
            transform: [{ scale }],
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.card}
          onPress={() => handleCardPress(item)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.white, '#F8F9FA']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <View style={styles.cardContent}>
              {item.imagen_url ? (
                <Image source={{ uri: item.imagen_url }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>
                    {item.nombres.charAt(0)}{item.apellidos.charAt(0)}
                  </Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.name}>{item.nombres_apellidos}</Text>
                <View style={styles.detailRow}>
                  <Ionicons name="id-card-outline" size={14} color={colors.gray[500]} style={styles.detailIcon} />
                  <Text style={styles.detail}>ID: {item.crew_id}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="briefcase-outline" size={14} color={colors.gray[500]} style={styles.detailIcon} />
                  <Text style={styles.detail}>Posición: {item.posicion_info.descripcion}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="document-outline" size={14} color={colors.gray[500]} style={styles.detailIcon} />
                  <Text style={styles.detail}>Pasaporte: {item.pasaporte}</Text>
                </View>
                {item.identidad && (
                  <View style={styles.detailRow}>
                    <Ionicons name="card-outline" size={14} color={colors.gray[500]} style={styles.detailIcon} />
                    <Text style={styles.detail}>Doc: {item.identidad}</Text>
                  </View>
                )}
              </View>
              <View style={styles.actionContainer}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="ellipsis-vertical" size={18} color={colors.gray[500]} />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.gray[500]} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar tripulante..."
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
      </View>

      <Animated.FlatList
        data={tripulantes}
        renderItem={renderTripulante}
        keyExtractor={(item) => item.id_tripulante.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[colors.primary]} 
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people" size={80} color={colors.primary} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>
              {search ? 'No se encontraron tripulantes' : 'No hay tripulantes registrados'}
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton} 
              onPress={() => router.push('/(tabs)/enroll')}
            >
              <Ionicons name="person-add" size={20} color={colors.white} style={styles.emptyButtonIcon} />
              <Text style={styles.emptyButtonText}>Enrolar Tripulante</Text>
            </TouchableOpacity>
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
    marginTop: 10,
    alignSelf: 'center',
  },
  offlineText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  list: {
    padding: 15,
    paddingTop: 20,
  },
  cardContainer: {
    marginBottom: 15,
  },
  card: {
    borderRadius: 15,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 3,
    overflow: 'hidden',
  },
  cardGradient: {
    borderRadius: 15,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 15,
  },
  photo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  photoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  photoPlaceholderText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    marginRight: 6,
  },
  detail: {
    fontSize: 14,
    color: colors.gray[700],
  },
  actionContainer: {
    justifyContent: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  emptyButtonIcon: {
    marginRight: 8,
  },
  emptyButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});