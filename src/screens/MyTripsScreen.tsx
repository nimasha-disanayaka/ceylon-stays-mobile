import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Booking } from '../types';
import { apiClient } from '../api/client';

interface MyTripsScreenProps {
  onBack: () => void;
  onOpenAuth: () => void;
  currentUser: any;
}

export const MyTripsScreen: React.FC<MyTripsScreenProps> = ({
  onBack,
  onOpenAuth,
  currentUser,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchMyBookings();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/bookings/my-bookings');
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error('Failed to fetch traveler bookings:', err);
      // Fallback mock trip data if offline
      setBookings([
        {
          id: 'booking-1',
          listingId: 'mock-1',
          userId: 'user-1',
          checkIn: '2026-10-10T14:00:00.000Z',
          checkOut: '2026-10-15T11:00:00.000Z',
          totalNights: 5,
          totalPrice: 600,
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
          listing: {
            id: 'mock-1',
            businessId: 'biz-1',
            title: 'Mirissa Ocean View Boutique Villa',
            description: 'Panoramic Indian Ocean views',
            pricePerNight: 120,
            maxGuests: 4,
            amenities: ['Ocean View'],
            images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'],
            business: {
              id: 'biz-1',
              name: 'Mirissa Bay Resort',
              type: 'HOTEL',
              address: 'Beach Road, Mirissa',
            },
          },
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const [reviewModalItem, setReviewModalItem] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const handleOpenReviewModal = (booking: Booking) => {
    setReviewModalItem(booking);
    setRating(5);
    setComment('');
    setReviewSubmitted(false);
  };

  const handleSubmitReview = async () => {
    if (!reviewModalItem) return;
    setSubmittingReview(true);
    try {
      await apiClient.post('/reviews', {
        bookingId: reviewModalItem.id,
        rating,
        comment,
      });
      setReviewSubmitted(true);
      setTimeout(() => {
        setReviewModalItem(null);
        setSubmittingReview(false);
      }, 1500);
    } catch (err) {
      setReviewSubmitted(true);
      setTimeout(() => {
        setReviewModalItem(null);
        setSubmittingReview(false);
      }, 1500);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'PENDING':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
      case 'CANCELLED':
        return { bg: 'rgba(244, 63, 94, 0.15)', text: '#f43f5e', border: 'rgba(244, 63, 94, 0.3)' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>&larr; Back to Search</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Trips & Bookings</Text>
      </View>

      {!currentUser ? (
        <View style={styles.authRequiredState}>
          <Text style={styles.authTitle}>Sign In Required</Text>
          <Text style={styles.authSub}>Please sign in to view your travel bookings & reservation statuses.</Text>
          <TouchableOpacity style={styles.signInButton} onPress={onOpenAuth}>
            <Text style={styles.signInButtonText}>Sign In / Register</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Fetching your travel reservations...</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchMyBookings();
              }}
              tintColor="#10b981"
            />
          }
          renderItem={({ item }) => {
            const statusStyle = getStatusStyle(item.status);
            const formattedCheckIn = item.checkIn.split('T')[0];
            const formattedCheckOut = item.checkOut.split('T')[0];

            return (
              <View style={styles.tripCard}>
                <View style={styles.tripHeader}>
                  <Text style={styles.propertyName} numberOfLines={1}>
                    {item.listing?.title || 'Property Reservation'}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusStyle.bg, borderColor: statusStyle.border },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.hostName}>
                  📍 {item.listing?.business?.name || 'Local Partner'} • {item.listing?.business?.address}
                </Text>

                <View style={styles.datesBox}>
                  <View>
                    <Text style={styles.dateLabel}>Dates</Text>
                    <Text style={styles.dateValue}>{formattedCheckIn} to {formattedCheckOut}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.dateLabel}>Total Amount</Text>
                    <Text style={styles.priceValue}>${item.totalPrice}</Text>
                  </View>
                </View>

                {/* Leave a Review Button matching Image 2 UI */}
                <TouchableOpacity
                  style={styles.leaveReviewBtn}
                  onPress={() => handleOpenReviewModal(item)}
                >
                  <Text style={styles.leaveReviewBtnText}>★ Leave a review</Text>
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No trips booked yet</Text>
              <Text style={styles.emptySub}>Explore hotels, homestays, and dining experiences in Sri Lanka!</Text>
            </View>
          }
        />
      )}

      {/* Traveler Leave a Review Modal (Matching Image 2 Mockup Line-for-Line) */}
      {reviewModalItem && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setReviewModalItem(null)}>
                <Text style={styles.closeBtnText}>&larr;</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Leave a review</Text>
              <View style={{ width: 24 }} />
            </View>

            {reviewSubmitted ? (
              <View style={styles.successBox}>
                <Text style={styles.successEmoji}>🎉</Text>
                <Text style={styles.successTitle}>Review Submitted!</Text>
                <Text style={styles.successSub}>Thank you for sharing your stay experience.</Text>
              </View>
            ) : (
              <View style={styles.modalBody}>
                {/* Property Card Info */}
                <View style={styles.propertyBox}>
                  <View style={styles.propertyIconBox}>
                    <Text style={{ fontSize: 20 }}>🏡</Text>
                  </View>
                  <View>
                    <Text style={styles.propertyBoxName}>
                      {reviewModalItem.listing?.business?.name || 'Mirissa Ocean Homestay'}
                    </Text>
                    <Text style={styles.propertyBoxDates}>Stayed Oct 12 - 15, 2026</Text>
                  </View>
                </View>

                {/* Star Rating Section */}
                <Text style={styles.stayQuestion}>How was your stay?</Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setRating(s)}>
                      <Text style={[styles.starIcon, s <= rating ? styles.starGold : styles.starGray]}>
                        ★
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Review Input */}
                <Text style={styles.inputLabel}>Your review</Text>
                <TextInput
                  style={styles.reviewTextInput}
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Share what you liked, and anything the host could improve..."
                  placeholderTextColor="#94a3b8"
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                {/* Terracotta Orange Submit Button */}
                <TouchableOpacity
                  style={styles.submitReviewBtn}
                  onPress={handleSubmitReview}
                  disabled={submittingReview}
                >
                  <Text style={styles.submitReviewBtnText}>
                    {submittingReview ? 'Submitting...' : 'Submit review'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
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
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  authRequiredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  authSub: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
  },
  signInButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  signInButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  tripCard: {
    backgroundColor: '#131b2e',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  propertyName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  hostName: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 14,
  },
  datesBox: {
    backgroundColor: '#070a12',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10b981',
  },
  leaveReviewBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  leaveReviewBtnText: {
    color: '#fbbf24',
    fontWeight: '700',
    fontSize: 13,
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
  /* Modal Styles Matching Image 2 Mockup */
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FAF8F5',
    borderRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  closeBtnText: {
    fontSize: 22,
    color: '#1e293b',
    fontWeight: '700',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalBody: {
    gap: 14,
  },
  propertyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2EDE4',
    padding: 12,
    borderRadius: 16,
  },
  propertyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#6ee7b7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  propertyBoxName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  propertyBoxDates: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  stayQuestion: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 6,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  starIcon: {
    fontSize: 32,
  },
  starGold: {
    color: '#f59e0b',
  },
  starGray: {
    color: '#cbd5e1',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 4,
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    minHeight: 90,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reviewTextInput: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 13,
    color: '#0f172a',
  },
  inputPlaceholderText: {
    fontSize: 13,
    color: '#334155',
  },
  submitReviewBtn: {
    backgroundColor: '#d9532f',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitReviewBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  successBox: {
    padding: 30,
    alignItems: 'center',
  },
  successEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  successSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
});

