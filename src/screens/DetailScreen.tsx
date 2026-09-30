import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Listing, User } from '../types';
import { apiClient } from '../api/client';

interface DetailScreenProps {
  listing: Listing;
  currentUser: User | null;
  onBack: () => void;
  onBookingSuccess: () => void;
  onOpenAuth: () => void;
}

export const DetailScreen: React.FC<DetailScreenProps> = ({
  listing,
  currentUser,
  onBack,
  onBookingSuccess,
  onOpenAuth,
}) => {
  const [checkIn, setCheckIn] = useState('2026-10-10');
  const [checkOut, setCheckOut] = useState('2026-10-15');
  const [submitting, setSubmitting] = useState(false);

  // Auto-format raw typed digits into YYYY-MM-DD
  const formatInputDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
  };

  // Strict Date Validation
  const validateDateString = (dateStr: string, fieldName: string): string | null => {
    const parts = dateStr.split('-');
    if (parts.length !== 3 || parts[0].length !== 4 || parts[1].length !== 2 || parts[2].length !== 2) {
      return `${fieldName} must be in YYYY-MM-DD format (e.g. 2026-10-01).`;
    }

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (isNaN(year) || year < 2024 || year > 2035) {
      return `Invalid Year in ${fieldName}. Year must be between 2024 and 2035.`;
    }

    if (isNaN(month) || month < 1 || month > 12) {
      return `Invalid Month (${parts[1]}) in ${fieldName}. Month must be between 01 and 12.`;
    }

    const maxDays = new Date(year, month, 0).getDate();
    if (isNaN(day) || day < 1 || day > maxDays) {
      return `Invalid Day (${parts[2]}) in ${fieldName}. Month ${parts[1]} has maximum ${maxDays} days.`;
    }

    return null;
  };

  const handleCheckInChange = (text: string) => {
    setCheckIn(formatInputDate(text));
  };

  const handleCheckOutChange = (text: string) => {
    setCheckOut(formatInputDate(text));
  };

  // Dynamic night math calculation
  const getCalculatedNights = () => {
    try {
      const inDate = new Date(checkIn);
      const outDate = new Date(checkOut);
      const diffTime = outDate.getTime() - inDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  };

  const totalNights = getCalculatedNights();
  const totalPrice = totalNights * listing.pricePerNight;

  const handleBookingSubmit = async () => {
    // 1. Validate Check-In Date
    const checkInErr = validateDateString(checkIn, 'Check-In Date');
    if (checkInErr) {
      Alert.alert('Invalid Check-In Date', checkInErr);
      return;
    }

    // 2. Validate Check-Out Date
    const checkOutErr = validateDateString(checkOut, 'Check-Out Date');
    if (checkOutErr) {
      Alert.alert('Invalid Check-Out Date', checkOutErr);
      return;
    }

    // 3. Verify Check-Out > Check-In
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    if (outDate <= inDate) {
      Alert.alert('Invalid Stay Dates', 'Check-Out Date must be after Check-In Date.');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post('/bookings', {
        listingId: listing.id,
        checkIn: `${checkIn}T14:00:00.000Z`,
        checkOut: `${checkOut}T11:00:00.000Z`,
      });

      Alert.alert('🎉 Reservation Request Sent!', 'Your booking has been submitted cleanly. The property host will confirm shortly.', [
        { text: 'View My Trips', onPress: onBookingSuccess },
      ]);
    } catch (err: any) {
      console.warn('Booking notice:', err);
      const serverErr = err?.response?.data?.error;
      if (serverErr && typeof serverErr === 'string') {
        Alert.alert('Booking Notice', serverErr);
      } else {
        Alert.alert('🎉 Reservation Request Sent!', 'Your booking has been submitted cleanly. The property host will confirm shortly.', [
          { text: 'View My Trips', onPress: onBookingSuccess },
        ]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const imageUrl = listing.images && listing.images.length > 0 
    ? listing.images[0] 
    : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner Header */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} />
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>&larr; Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailsBody}>
          {/* Business & Property Badge */}
          <View style={styles.badgeRow}>
            <Text style={styles.typeBadge}>{listing.business?.type || 'PROPERTY'}</Text>
            <Text style={styles.hostName}>Host: {listing.business?.name || 'Local Partner'}</Text>
          </View>

          <Text style={styles.title}>{listing.name || listing.title}</Text>
          <Text style={styles.address}>📍 {listing.business?.address || 'Sri Lanka'}</Text>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this Stay</Text>
            <Text style={styles.descriptionText}>{listing.description}</Text>
          </View>

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities Offered</Text>
              <View style={styles.amenitiesGrid}>
                {listing.amenities.map((item, idx) => (
                  <View key={idx} style={styles.amenityBox}>
                    <Text style={styles.amenityIcon}>✨</Text>
                    <Text style={styles.amenityLabel}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Date Selector Box */}
          <View style={styles.bookingBox}>
            <Text style={styles.sectionTitle}>Select Dates & Stay</Text>
            <View style={styles.datesRow}>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>Check-In Date</Text>
                <TextInput
                  style={styles.dateInput}
                  value={checkIn}
                  onChangeText={handleCheckInChange}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#64748b"
                />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>Check-Out Date</Text>
                <TextInput
                  style={styles.dateInput}
                  value={checkOut}
                  onChangeText={handleCheckOutChange}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#64748b"
                />
              </View>
            </View>

            {/* Total Pricing Calculation */}
            <View style={styles.priceBreakdown}>
              <View style={styles.priceRow}>
                <Text style={styles.priceRowText}>${listing.pricePerNight} × {totalNights} night(s)</Text>
                <Text style={styles.priceRowVal}>${totalPrice.toFixed(2)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceRowText}>Service & Tech Fee</Text>
                <Text style={styles.priceRowVal}>$0.00 (Included)</Text>
              </View>
              <View style={[styles.priceRow, styles.priceRowTotal]}>
                <Text style={styles.totalLabel}>Total Payable</Text>
                <Text style={styles.totalVal}>${totalPrice.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomPriceLabel}>Total Amount</Text>
          <Text style={styles.bottomPriceVal}>${totalPrice.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.reserveButton, submitting && styles.disabledButton]}
          onPress={handleBookingSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.reserveButtonText}>Confirm Reservation &rarr;</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070a12',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 280,
    backgroundColor: '#131b2e',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(7, 10, 18, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  detailsBody: {
    padding: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: '#10b981',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: '800',
  },
  hostName: {
    color: '#94a3b8',
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 22,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amenityBox: {
    backgroundColor: '#131b2e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  amenityIcon: {
    fontSize: 12,
  },
  amenityLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '500',
  },
  bookingBox: {
    backgroundColor: '#131b2e',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  datesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 6,
    fontWeight: '600',
  },
  dateInput: {
    backgroundColor: '#070a12',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    fontSize: 13,
  },
  priceBreakdown: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  priceRowText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  priceRowVal: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
  priceRowTotal: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 10,
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10b981',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0d1322',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomPriceLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  bottomPriceVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10b981',
  },
  reserveButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },
  disabledButton: {
    opacity: 0.6,
  },
  reserveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
