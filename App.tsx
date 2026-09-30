import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SearchScreen } from './src/screens/SearchScreen';
import { DetailScreen } from './src/screens/DetailScreen';
import { MyTripsScreen } from './src/screens/MyTripsScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { Listing, User } from './src/types';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<'SEARCH' | 'DETAIL' | 'MY_TRIPS'>('SEARCH');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'user-traveler-1',
    name: 'John M.',
    email: 'traveler@gmail.com',
    role: 'FOREIGNER',
  });
  const [authVisible, setAuthVisible] = useState(false);

  const handleSelectListing = (listing: Listing) => {
    setSelectedListing(listing);
    setActiveScreen('DETAIL');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070a12" />

      {/* Main Screen Content */}
      <View style={styles.body}>
        {activeScreen === 'SEARCH' && (
          <SearchScreen
            onSelectListing={handleSelectListing}
            onOpenAuth={() => setAuthVisible(true)}
            currentUser={currentUser}
          />
        )}

        {activeScreen === 'DETAIL' && selectedListing && (
          <DetailScreen
            listing={selectedListing}
            currentUser={currentUser}
            onBack={() => setActiveScreen('SEARCH')}
            onBookingSuccess={() => setActiveScreen('MY_TRIPS')}
            onOpenAuth={() => setAuthVisible(true)}
          />
        )}

        {activeScreen === 'MY_TRIPS' && (
          <MyTripsScreen
            onBack={() => setActiveScreen('SEARCH')}
            onOpenAuth={() => setAuthVisible(true)}
            currentUser={currentUser}
          />
        )}
      </View>

      {/* Bottom Tab Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, activeScreen === 'SEARCH' && styles.navItemActive]}
          onPress={() => setActiveScreen('SEARCH')}
        >
          <Text style={[styles.navIcon, activeScreen === 'SEARCH' && styles.navTextActive]}>🌴</Text>
          <Text style={[styles.navText, activeScreen === 'SEARCH' && styles.navTextActive]}>
            Explore Stays
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeScreen === 'MY_TRIPS' && styles.navItemActive]}
          onPress={() => setActiveScreen('MY_TRIPS')}
        >
          <Text style={[styles.navIcon, activeScreen === 'MY_TRIPS' && styles.navTextActive]}>🧳</Text>
          <Text style={[styles.navText, activeScreen === 'MY_TRIPS' && styles.navTextActive]}>
            My Trips
          </Text>
        </TouchableOpacity>
      </View>

      {/* Auth Modal */}
      <AuthScreen
        visible={authVisible}
        onClose={() => setAuthVisible(false)}
        onAuthSuccess={(user) => setCurrentUser(user)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070a12',
  },
  body: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#0d1322',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  navText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  navTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },
});
