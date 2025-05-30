import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Image, RefreshControl, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCrew } from '../../../store/crewStore';
import { CrewMember } from '../../../types';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

export default function CrewList() {
  const { crew, loading, loadCrew } = useCrew();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCrew();
  }, []);

  const filteredCrew = crew.filter(member => 
    member.nombres.toLowerCase().includes(search.toLowerCase()) ||
    member.apellidos.toLowerCase().includes(search.toLowerCase()) ||
    member.crewId.toLowerCase().includes(search.toLowerCase()) ||
    member.posicion.toLowerCase().includes(search.toLowerCase())
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCrew();
    setRefreshing(false);
  };

  const renderCrewMember = ({ item, index }: { item: CrewMember, index: number }) => (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: scrollY.interpolate({
            inputRange: [-1, 0, 100 * index, 100 * (index + 1)],
            outputRange: [1, 1, 1, 0.5],
          }),
          transform: [{
            scale: scrollY.interpolate({
              inputRange: [-1, 0, 100 * index, 100 * (index + 2)],
              outputRange: [1, 1, 1, 0.9],
            }),
          }],
        }
      ]}
    >
      <TouchableOpacity style={styles.card}>
        <LinearGradient
          colors={[colors.white, '#F8F9FA']}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.cardContent}>
            {item.photoUri ? (
              <Image source={{ uri: item.photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>
                  {item.nombres.charAt(0)}{item.apellidos.charAt(0)}
                </Text>
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.name}>{item.nombres} {item.apellidos}</Text>
              <View style={styles.detailRow}>
                <Ionicons name="id-card-outline" size={14} color={colors.gray[500]} style={styles.detailIcon} />
                <Text style={styles.detail}>ID: {item.crewId}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="briefcase-outline" size={14} color={colors.gray[500]} style={styles.detailIcon} />
                <Text style={styles.detail}>Posición: {item.posicion}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="document-outline" size={14} color={colors.gray[500]} style={styles.detailIcon} />
                <Text style={styles.detail}>Pasaporte: {item.pasaporte}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

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
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={colors.gray[500]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Animated.FlatList
        data={filteredCrew}
        renderItem={renderCrewMember}
        keyExtractor={(item) => item.id}
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
            <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/(tabs)/enroll')}>
              <Text style={styles.emptyButtonText}>Enrolar Tripulante</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
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
    justifyContent: 'center',
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
    color: colors.gray[600],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    marginBottom: 15,
    opacity: 0.8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray[600],
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});