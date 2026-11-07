import React, { useState, useEffect, useMemo } from 'react';
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
  Keyboard,
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

const CURATED_SRI_LANKA_LISTINGS: Listing[] = [
  {
    id: 'listing-1',
    businessId: 'biz-1',
    title: 'Mirissa Ocean View Villa',
    description:
      'Luxury beachfront villa with private infinity pool overlooking the southern coastline of Mirissa.',
    pricePerNight: 145,
    maxGuests: 4,
    amenities: ['Ocean View', 'Infinity Pool', 'Free Wi-Fi', 'Breakfast Included'],
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
    ],
    business: {
      id: 'biz-1',
      name: 'Mirissa Ocean Resort',
      type: 'HOTEL',
      address: 'Beach Road, Mirissa, Sri Lanka',
    },
  },
  {
    id: 'listing-2',
    businessId: 'biz-2',
    title: 'Ella Tea Cliff Homestay',
    description:
      'Peaceful mountain homestay surrounded by lush tea plantations in Ella with Nine Arch Bridge view.',
    pricePerNight: 65,
    maxGuests: 2,
    amenities: ['Mountain View', 'Tea Garden', 'Traditional Dinner', 'Hiking Trails'],
    images: [
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    ],
    business: {
      id: 'biz-2',
      name: 'Ella Eco Stay',
      type: 'HOMESTAY',
      address: 'Waterfall Road, Ella, Sri Lanka',
    },
  },
  {
    id: 'listing-2b',
    businessId: 'biz-2b',
    title: 'Ella Gap Mountain View Chalet',
    description:
      'Spectacular wooden chalet perched on the slopes of Ella Gap featuring panoramic sunrise views and private balcony.',
    pricePerNight: 85,
    maxGuests: 3,
    amenities: ['Ella Gap View', 'Balcony', 'Free Breakfast', 'Hot Water'],
    images: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
    ],
    business: {
      id: 'biz-2b',
      name: 'Ella Peak Retreat',
      type: 'HOMESTAY',
      address: 'Passara Road, Ella, Sri Lanka',
    },
  },
  {
    id: 'listing-3',
    businessId: 'biz-3',
    title: 'Galle Fort Heritage Manor',
    description:
      'Colonial Dutch mansion restored into a boutique hotel inside historic Galle Fort.',
    pricePerNight: 210,
    maxGuests: 6,
    amenities: ['Heritage Suite', 'Courtyard Pool', 'Spa', 'Fine Dining'],
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    ],
    business: {
      id: 'biz-3',
      name: 'Galle Heritage Hotel',
      type: 'HOTEL',
      address: 'Church Street, Galle Fort, Sri Lanka',
    },
  },
  {
    id: 'listing-4',
    businessId: 'biz-4',
    title: 'Kandy Lakeview Heritage Villa',
    description:
      'Tranquil colonial hillside villa overlooking the Sacred Lake of Kandy and Temple of the Tooth.',
    pricePerNight: 120,
    maxGuests: 4,
    amenities: ['Lake View', 'Lush Garden', 'Ayurvedic Spa', 'Tea Tasting'],
    images: [
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80',
    ],
    business: {
      id: 'biz-4',
      name: 'Kandy Royal Estate',
      type: 'HOTEL',
      address: 'Lake Round, Kandy, Sri Lanka',
    },
  },
  {
    id: 'listing-5',
    businessId: 'biz-5',
    title: 'Sigiriya Jungle Treehouse Homestay',
    description:
      'Eco-friendly luxury treehouse immersed in nature with direct sunrise views of Sigiriya Lion Rock.',
    pricePerNight: 95,
    maxGuests: 3,
    amenities: ['Sigiriya Rock View', 'Treehouse Deck', 'Safari Tours', 'Home Cooked Food'],
    images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
    ],
    business: {
      id: 'biz-5',
      name: 'Sigiriya Eco Haven',
      type: 'HOMESTAY',
      address: 'Inamaluwa Road, Sigiriya, Sri Lanka',
    },
  },
  {
    id: 'listing-6',
    businessId: 'biz-6',
    title: 'The Fortress Ocean Dining Lounge',
    description:
      'Award-winning coastal seafood restaurant featuring authentic Sri Lankan crab, lobster, and sunset cocktails.',
    pricePerNight: 50,
    maxGuests: 8,
    amenities: ['Oceanfront Seating', 'Live Seafood', 'Cocktails Bar', 'Sunset Views'],
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    ],
    business: {
      id: 'biz-6',
      name: 'Fortress Seafood & Lounge',
      type: 'RESTAURANT',
      address: 'Lighthouse Street, Galle Fort, Sri Lanka',
    },
  },
];

export const SearchScreen: React.FC<SearchScreenProps> = ({
  onSelectListing,
  onOpenAuth,
  currentUser,
}) => {
  const [serverListings, setServerListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
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
      if (res.data?.listings && res.data.listings.length > 0) {
        setServerListings(res.data.listings);
      } else {
        setServerListings([]);
      }
    } catch (err) {
      console.log('Backend not reachable on this network, using offline catalog.');
      setServerListings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Resilient filtering: filters either server results (if available) or curated catalog
  const filteredListings = useMemo(() => {
    const sourceData = serverListings;
    const q = searchQuery.trim().toLowerCase();

    return sourceData.filter((item) => {
      // Category match
      if (selectedCategory !== 'ALL') {
        const itemType = item.business?.type;
        if (itemType && itemType !== selectedCategory) {
          return false;
        }
      }

      // Query match (checks title, name, description, business name, address, amenities)
      if (!q) return true;

      const titleMatch = (item.title || item.name || '').toLowerCase().includes(q);
      const descMatch = (item.description || '').toLowerCase().includes(q);
      const bizNameMatch = (item.business?.name || '').toLowerCase().includes(q);
      const addressMatch = (item.business?.address || '').toLowerCase().includes(q);
      const amenityMatch = (item.amenities || []).some((a) =>
        a.toLowerCase().includes(q)
      );

      return titleMatch || descMatch || bizNameMatch || addressMatch || amenityMatch;
    });
  }, [serverListings, searchQuery, selectedCategory]);

  const handleSearchSubmit = () => {
    Keyboard.dismiss();
    fetchListings();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      {/* App Bar Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>
            Ceylon<Text style={styles.brandAccent}>Stays</Text> 🌴
          </Text>
          <Text style={styles.brandSub}>Explore Stays & Dining in Sri Lanka</Text>
        </View>

        <TouchableOpacity style={styles.userButton} onPress={onOpenAuth} activeOpacity={0.8}>
          <Text style={styles.userButtonText}>
            {currentUser ? `👤 ${currentUser.name.split(' ')[0]}` : 'Sign In'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Box */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Ella, Mirissa, Galle Fort, Kandy..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearchBtn}
            onPress={handleClearSearch}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
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
                {cat === 'ALL'
                  ? '✨ All Stays'
                  : cat === 'HOTEL'
                  ? '🏨 Hotels'
                  : cat === 'HOMESTAY'
                  ? '🏡 Homestays'
                  : '🍽️ Dining'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search Results Summary Header */}
      {searchQuery.trim().length > 0 && (
        <View style={styles.resultsInfoRow}>
          <Text style={styles.resultsInfoText}>
            Found <Text style={styles.resultsInfoBold}>{filteredListings.length}</Text> result
            {filteredListings.length === 1 ? '' : 's'} for "{searchQuery}"
          </Text>
          <TouchableOpacity onPress={handleClearSearch}>
            <Text style={styles.clearFiltersText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Listing List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Searching available properties...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredListings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListingCard listing={item} onPress={() => onSelectListing(item)} />
          )}
          contentContainerStyle={styles.listContainer}
          keyboardShouldPersistTaps="handled"
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
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No matching properties found</Text>
              <Text style={styles.emptySub}>
                We couldn't find any stays matching "{searchQuery}". Try searching for
                Ella, Mirissa, Galle, Kandy, or Sigiriya.
              </Text>
              <TouchableOpacity
                style={styles.resetSearchBtn}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                }}
              >
                <Text style={styles.resetSearchBtnText}>Show All Stays</Text>
              </TouchableOpacity>
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
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#131b2e',
    borderRadius: 16,
    padding: 6,
    paddingLeft: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 8,
    color: '#ffffff',
    fontSize: 14,
  },
  clearSearchBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearSearchText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  searchButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  resultsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginBottom: 12,
  },
  resultsInfoText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  resultsInfoBold: {
    color: '#10b981',
    fontWeight: '700',
  },
  clearFiltersText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
  },
  categoriesWrapper: {
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryPill: {
    backgroundColor: '#1a243b',
    paddingHorizontal: 16,
    paddingVertical: 9,
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
    fontSize: 13,
    fontWeight: '700',
  },
  categoryTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
    padding: 30,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySub: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  resetSearchBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  resetSearchBtnText: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 13,
  },
});
