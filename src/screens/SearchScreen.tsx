import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { ListingCard } from '../components/ListingCard';
import { Listing } from '../types';
import { apiClient } from '../api/client';

interface SearchScreenProps {
  onSelectListing: (listing: Listing) => void;
  onOpenAuth: () => void;
  currentUser: any;
}

const CATEGORIES = ['ALL', 'HOTEL', 'HOMESTAY', 'RESTAURANT'];

export const SearchScreen: React.FC<SearchScreenProps> = ({
  onSelectListing,
  onOpenAuth,
  currentUser,
}) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    fetchListings();
  }, [selectedCategory]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      let url = '/listings/search';
      const params: string[] = [];

      if (selectedCategory !== 'ALL') {
        params.push(`type=${selectedCategory}`);
      }
      if (searchQuery.trim()) {
        params.push(`query=${encodeURIComponent(searchQuery.trim())}`);
      }

      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const res = await apiClient.get(url);
      setListings(res.data.listings || []);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      setListings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearchSubmit = () => {
    fetchListings();
  };

  return (
    <View style={styles.container}>
      {/* App Bar Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>
            Roam<Text style={styles.brandAccent}>Lanka</Text> 🌴
          </Text>
          <Text style={styles.brandSub}>Explore Stays & Dining in Sri Lanka</Text>
        </View>

        <TouchableOpacity style={styles.userButton} onPress={onOpenAuth}>
          <Text style={styles.userButtonText}>
            {currentUser ? `👤 ${currentUser.name.split(' ')[0]}` : 'Sign In'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Box */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Mirissa, Ella, Galle Fort..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearchSubmit}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Category Pills Slider */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryPill,
                selectedCategory === cat && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.categoryTextActive,
                ]}
              >
                {cat === 'ALL' ? '✨ All Stays' : cat === 'HOTEL' ? '🏨 Hotels' : cat === 'HOMESTAY' ? '🏡 Homestays' : '🍽️ Dining'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Listing List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Searching available properties...</Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListingCard listing={item} onPress={() => onSelectListing(item)} />
          )}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchListings();
              }}
              tintColor="#10b981"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No stays found</Text>
              <Text style={styles.emptySub}>Try searching for a different destination or category.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070a12',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: '#10b981',
  },
  brandSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  userButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  userButtonText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#131b2e',
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  categoriesWrapper: {
    marginBottom: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryPill: {
    backgroundColor: '#1a243b',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  categoryText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '700',
  },
  categoryTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
});
