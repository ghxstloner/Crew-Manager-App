import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Image, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCrew } from '../../../store/crewStore';
import { CrewMember } from '../../../types';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';

export default function CrewList() {
  const { crew, loading, loadCrew } = useCrew();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

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

  const renderCrewMember = ({ item }: { item: CrewMember }) => (
    <TouchableOpacity style={styles.card}>
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
          <Text style={styles.detail}>ID: {item.crewId}</Text>
          <Text style={styles.detail}>Posición: {item.posicion}</Text>
          <Text style={styles.detail}>Pasaporte: {item.pasaporte}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Inicio</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.gray[500]} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar tripulante..."
            placeholderTextColor={colors.gray[500]}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filteredCrew}
        renderItem={renderCrewMember}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color={colors.gray[400]} />
            <Text style={styles.emptyText}>
              {search ? 'No se encontraron tripulantes' : 'No hay tripulantes registrados'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.dark,
  },
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
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
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  photoPlaceholderText: {
    color: colors.white,
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
    color: colors.dark,
    marginBottom: 5,
  },
  detail: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray[500],
    marginTop: 10,
  },
});