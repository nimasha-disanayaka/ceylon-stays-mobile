import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Listing } from '../types';

interface ListingCardProps {
  listing: Listing;
  onPress: () => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onPress }) => {
  const imageUrl = listing.images && listing.images.length > 0 
    ? listing.images[0] 
    : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: imageUrl }} style={styles.image} />
      
      {/* Type Badge */}
      <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>
          {listing.business?.type || 'PROPERTY'}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {listing.name || listing.title}
        </Text>
        <Text style={styles.address} numberOfLines={1}>
          📍 {listing.business?.name ? `${listing.business.name} • ` : ''}{listing.business?.address || 'Sri Lanka'}
        </Text>

        <Text style={styles.description} numberOfLines={2}>
          {listing.description}
        </Text>

        {/* Amenities Preview */}
        {listing.amenities && listing.amenities.length > 0 && (
          <View style={styles.amenitiesRow}>
            {listing.amenities.slice(0, 3).map((amenity, idx) => (
              <View key={idx} style={styles.amenityTag}>
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <View>
            <Text style={styles.priceLabel}>Price per night</Text>
            <Text style={styles.priceValue}>${listing.pricePerNight}</Text>
          </View>
          <View style={styles.guestTag}>
            <Text style={styles.guestText}>👥 Up to {listing.maxGuests} guests</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#131b2e',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 4,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  image: {
    width: '100%',
    height: 190,
    backgroundColor: '#1a243b',
  },
  badgeContainer: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  address: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 18,
    marginBottom: 12,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  amenityTag: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  amenityText: {
    color: '#06b6d4',
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  priceLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10b981',
  },
  guestTag: {
    backgroundColor: '#1a243b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  guestText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '500',
  },
});
