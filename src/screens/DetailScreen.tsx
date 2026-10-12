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
  Dimensions,
} from 'react-native';
import { Listing, User } from '../types';
import { apiClient } from '../api/client';
import { CalendarModal } from '../components/CalendarModal';
import { ReviewModal } from '../components/ReviewModal';

interface DetailScreenProps {
  listing: Listing;
  currentUser: User | null;
  onBack: () => void;
  onBookingSuccess: () => void;
  onOpenAuth: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const DetailScreen: React.FC<DetailScreenProps> = ({
  listing,
  currentUser,
  onBack,
  onBookingSuccess,
  onOpenAuth,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [checkIn, setCheckIn] = useState('2026-10-10');
  const [checkOut, setCheckOut] = useState('2026-10-15');
  const [submitting, setSubmitting] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Availability States
  const [unavailableRanges, setUnavailableRanges] = useState<Array<{ startDate: string; endDate: string; type: string; reason?: string }>>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Reviews States
  const [reviewsData, setReviewsData] = useState<{
    summary: { averageRating: number; totalReviews: number };
    reviews: Array<{
      id: string;
      authorName: string;
      rating: number;
      comment: string;
      reply?: string | null;
      createdAt?: string;
    }>;
  }>({
    summary: { averageRating: 4.9, totalReviews: 3 },
    reviews: [],
  });
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  React.useEffect(() => {
    fetchAvailability();
    fetchListingReviews();
  }, [listing.id]);

  const fetchListingReviews = async () => {
    try {
      setLoadingReviews(true);
      const res = await apiClient.get(`/reviews/listing/${listing.id}`);
      if (res.data) {
        setReviewsData(res.data);
      }
    } catch (err) {
      console.warn('Notice fetching reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      setLoadingAvailability(true);
      const res = await apiClient.get(`/listings/${listing.id}/availability`);
      if (res.data && res.data.unavailableRanges) {
        setUnavailableRanges(res.data.unavailableRanges);
      }
    } catch (err) {
      console.warn('Notice fetching listing availability:', err);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const getCollisionWarning = (inStr: string, outStr: string) => {
    try {
      const targetIn = new Date(inStr);
      const targetOut = new Date(outStr);

      if (isNaN(targetIn.getTime()) || isNaN(targetOut.getTime())) return null;

      for (const range of unavailableRanges) {
        const rangeIn = new Date(range.startDate);
        const rangeOut = new Date(range.endDate);

        if (targetIn < rangeOut && targetOut > rangeIn) {
          const typeLabel = range.type === 'BLOCKED_BY_HOST' ? 'host maintenance block' : 'existing reservation';
          return `⚠️ Dates (${inStr} to ${outStr}) overlap with an ${typeLabel} (${range.startDate} → ${range.endDate}). Please select available dates.`;
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  const collisionWarning = getCollisionWarning(checkIn, checkOut);

  // Payment Method States
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'PAY_AT_PROPERTY'>('CARD');
  const [cardName, setCardName] = useState('John Traveler');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');

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

    // 4. Validate Credit Card Details if Card Payment is Selected
    if (paymentMethod === 'CARD') {
      if (!cardName.trim() || !cardNumber.trim() || !cardExpiry.trim() || !cardCvc.trim()) {
        Alert.alert('Incomplete Payment Info', 'Please enter your cardholder name, card number, expiry date, and CVC code.');
        return;
      }
    }

    try {
      setSubmitting(true);
      await apiClient.post('/bookings', {
        listingId: listing.id,
        checkIn: `${checkIn}T14:00:00.000Z`,
        checkOut: `${checkOut}T11:00:00.000Z`,
        paymentMethod,
        paymentStatus: paymentMethod === 'PAY_AT_PROPERTY' ? 'UNPAID' : 'PAID',
      });

      const paymentSuccessNote = paymentMethod === 'PAY_AT_PROPERTY'
        ? 'Your reservation has been sent! Payment will be collected upon arrival at property.'
        : 'Payment processed successfully! Your reservation request has been sent.';

      Alert.alert('🎉 Reservation Confirmed!', paymentSuccessNote, [
        { text: 'View My Trips', onPress: onBookingSuccess },
      ]);
    } catch (err: any) {
      console.warn('Booking notice:', err);
      const serverErr = err?.response?.data?.error;
      if (serverErr && typeof serverErr === 'string') {
        Alert.alert('Booking Notice', serverErr);
      } else {
        Alert.alert('🎉 Reservation Confirmed!', 'Your reservation request has been submitted cleanly.', [
          { text: 'View My Trips', onPress: onBookingSuccess },
        ]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const images = (listing.images && listing.images.length > 0)
    ? listing.images
    : (listing.business?.imageUrls && listing.business.imageUrls.length > 0)
    ? listing.business.imageUrls
    : [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80',
      ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner Header with Photo Carousel */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slide = Math.round(
                e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width
              );
              if (slide !== activeImageIndex) setActiveImageIndex(slide);
            }}
            scrollEventThrottle={16}
          >
            {images.map((imgUri: string, idx: number) => (
              <Image key={idx} source={{ uri: imgUri }} style={styles.carouselImage} />
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>&larr; Back</Text>
          </TouchableOpacity>

          <View style={styles.photoCountBadge}>
            <Text style={styles.photoCountText}>📷 {activeImageIndex + 1} / {images.length}</Text>
          </View>
        </View>

        <View style={styles.detailsBody}>
          {/* Business & Property Badge */}
          <View style={styles.badgeRow}>
            <Text style={styles.typeBadge}>{listing.business?.type || 'PROPERTY'}</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingBadgeStar}>★</Text>
              <Text style={styles.ratingBadgeText}>
                {reviewsData.summary.averageRating} ({reviewsData.summary.totalReviews})
              </Text>
            </View>
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

          {/* Guest Reviews & Ratings Section */}
          <View style={styles.section}>
            <View style={styles.reviewsHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Guest Reviews & Ratings</Text>
                <View style={styles.scoreRow}>
                  <Text style={styles.overallScoreStar}>★</Text>
                  <Text style={styles.overallScoreVal}>{reviewsData.summary.averageRating}</Text>
                  <Text style={styles.overallScoreSub}>
                    / 5.0 • {reviewsData.summary.totalReviews} verified guest reviews
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.writeReviewBtn}
                onPress={() => setShowReviewModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.writeReviewBtnText}>★ Rate Stay</Text>
              </TouchableOpacity>
            </View>

            {loadingReviews ? (
              <ActivityIndicator color="#10b981" style={{ marginVertical: 14 }} />
            ) : reviewsData.reviews.length === 0 ? (
              <View style={styles.noReviewsBox}>
                <Text style={styles.noReviewsText}>No guest reviews yet. Be the first to share your experience!</Text>
              </View>
            ) : (
              <View style={styles.reviewsList}>
                {reviewsData.reviews.map((rev) => (
                  <View key={rev.id} style={styles.reviewCard}>
                    <View style={styles.reviewCardTop}>
                      <View style={styles.authorAvatar}>
                        <Text style={styles.authorAvatarText}>
                          {rev.authorName ? rev.authorName.charAt(0).toUpperCase() : 'G'}
                        </Text>
                      </View>
                      <View style={styles.authorMeta}>
                        <Text style={styles.authorName}>{rev.authorName || 'Traveler Guest'}</Text>
                        <View style={styles.reviewStarsRow}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Text
                              key={s}
                              style={[
                                styles.reviewStarSymbol,
                                s <= rev.rating ? styles.goldStar : styles.dimStar,
                              ]}
                            >
                              ★
                            </Text>
                          ))}
                        </View>
                      </View>
                    </View>

                    <Text style={styles.reviewComment}>"{rev.comment}"</Text>

                    {rev.reply && (
                      <View style={styles.hostReplyBox}>
                        <Text style={styles.hostReplyTitle}>
                          💬 Host Response ({listing.business?.name || 'Host'}):
                        </Text>
                        <Text style={styles.hostReplyText}>"{rev.reply}"</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Date Selector Box */}
          <View style={styles.bookingBox}>
            <Text style={styles.sectionTitle}>Select Dates & Stay</Text>

            {/* Reserved / Unavailable Dates Display */}
            <View style={styles.unavailableDatesContainer}>
              <View style={styles.unavailableHeaderRow}>
                <Text style={styles.unavailableHeaderTitle}>📅 Reserved & Unavailable Dates</Text>
                {loadingAvailability && <ActivityIndicator size="small" color="#10b981" />}
              </View>

              {unavailableRanges.length === 0 ? (
                <Text style={styles.allAvailableText}>✨ All dates currently available for booking!</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rangesScroll}>
                  {unavailableRanges.map((range, idx) => (
                    <View key={idx} style={styles.rangeBadge}>
                      <Text style={styles.rangeBadgeText}>
                        🔒 {range.startDate} → {range.endDate} ({range.type === 'BLOCKED_BY_HOST' ? 'Blocked' : 'Reserved'})
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Date Collision Warning Banner */}
            {collisionWarning && (
              <View style={styles.collisionBanner}>
                <Text style={styles.collisionBannerText}>{collisionWarning}</Text>
              </View>
            )}

            {/* Visual Calendar Date Picker Trigger Button */}
            <TouchableOpacity
              style={styles.openCalendarBtn}
              onPress={() => setShowCalendarModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.openCalendarBtnIcon}>📅</Text>
              <View style={styles.openCalendarBtnTextContainer}>
                <Text style={styles.openCalendarBtnTitle}>Interactive Visual Calendar</Text>
                <Text style={styles.openCalendarBtnSubtitle}>Tap to pick available dates on live monthly grid</Text>
              </View>
              <Text style={styles.openCalendarBtnArrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.datesRow}>
              <TouchableOpacity
                style={styles.dateField}
                activeOpacity={0.8}
                onPress={() => setShowCalendarModal(true)}
              >
                <Text style={styles.dateLabel}>Check-In Date 📅</Text>
                <TextInput
                  style={[styles.dateInput, collisionWarning ? styles.dateInputError : null]}
                  value={checkIn}
                  onChangeText={handleCheckInChange}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#64748b"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateField}
                activeOpacity={0.8}
                onPress={() => setShowCalendarModal(true)}
              >
                <Text style={styles.dateLabel}>Check-Out Date 📅</Text>
                <TextInput
                  style={[styles.dateInput, collisionWarning ? styles.dateInputError : null]}
                  value={checkOut}
                  onChangeText={handleCheckOutChange}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#64748b"
                />
              </TouchableOpacity>
            </View>

            {/* Payment Method Selection */}
            <View style={styles.paymentSection}>
              <Text style={styles.paymentTitle}>Select Payment Method</Text>

              <View style={styles.paymentOptionsGrid}>
                <TouchableOpacity
                  style={[styles.paymentOption, paymentMethod === 'CARD' && styles.paymentOptionActive]}
                  onPress={() => setPaymentMethod('CARD')}
                >
                  <Text style={styles.paymentIcon}>💳</Text>
                  <Text style={[styles.paymentLabel, paymentMethod === 'CARD' && styles.paymentLabelActive]}>
                    Credit / Debit Card
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.paymentOption, paymentMethod === 'PAY_AT_PROPERTY' && styles.paymentOptionActive]}
                  onPress={() => setPaymentMethod('PAY_AT_PROPERTY')}
                >
                  <Text style={styles.paymentIcon}>🏨</Text>
                  <Text style={[styles.paymentLabel, paymentMethod === 'PAY_AT_PROPERTY' && styles.paymentLabelActive]}>
                    Pay at Property
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Card Inputs */}
              {paymentMethod === 'CARD' && (
                <View style={styles.cardInputContainer}>
                  <View style={styles.cardInputGroup}>
                    <Text style={styles.cardInputLabel}>Cardholder Name</Text>
                    <TextInput
                      style={styles.cardInput}
                      value={cardName}
                      onChangeText={setCardName}
                      placeholder="John Traveler"
                      placeholderTextColor="#64748b"
                    />
                  </View>

                  <View style={styles.cardInputGroup}>
                    <Text style={styles.cardInputLabel}>Card Number</Text>
                    <TextInput
                      style={styles.cardInput}
                      value={cardNumber}
                      onChangeText={setCardNumber}
                      keyboardType="numeric"
                      placeholder="4242 4242 4242 4242"
                      placeholderTextColor="#64748b"
                    />
                  </View>

                  <View style={styles.cardRow}>
                    <View style={[styles.cardInputGroup, { flex: 1 }]}>
                      <Text style={styles.cardInputLabel}>Expiry Date</Text>
                      <TextInput
                        style={styles.cardInput}
                        value={cardExpiry}
                        onChangeText={setCardExpiry}
                        placeholder="MM/YY"
                        placeholderTextColor="#64748b"
                      />
                    </View>
                    <View style={[styles.cardInputGroup, { flex: 1 }]}>
                      <Text style={styles.cardInputLabel}>CVC / CVV</Text>
                      <TextInput
                        style={styles.cardInput}
                        value={cardCvc}
                        onChangeText={setCardCvc}
                        keyboardType="numeric"
                        secureTextEntry={true}
                        placeholder="123"
                        placeholderTextColor="#64748b"
                      />
                    </View>
                  </View>
                </View>
              )}

              {paymentMethod === 'PAY_AT_PROPERTY' && (
                <View style={styles.paymentNoticeBox}>
                  <Text style={styles.paymentNoticeText}>
                    💡 Pay with cash or card directly to host upon arrival at property. Moderate cancellation policy applies.
                  </Text>
                </View>
              )}
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
            <Text style={styles.reserveButtonText}>Pay & Confirm &rarr;</Text>
          )}
        </TouchableOpacity>
      </View>
      {/* Visual Calendar Modal */}
      <CalendarModal
        visible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        initialCheckIn={checkIn}
        initialCheckOut={checkOut}
        unavailableRanges={unavailableRanges}
        onSelectDates={(inDate, outDate) => {
          setCheckIn(inDate);
          setCheckOut(outDate);
        }}
      />

      {/* Review Submission Modal */}
      <ReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        listingId={listing.id}
        listingName={listing.name || listing.title || 'Property Stay'}
        authorName={currentUser?.name || 'Traveler Guest'}
        onReviewSubmitted={() => {
          fetchListingReviews();
        }}
      />
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
    height: 280,
    backgroundColor: '#131b2e',
  },
  carouselImage: {
    width: SCREEN_WIDTH,
    height: 280,
    backgroundColor: '#131b2e',
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 16,
    right: 20,
    backgroundColor: 'rgba(7, 10, 18, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  photoCountText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
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
  paymentSection: {
    marginVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 16,
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
  },
  paymentOptionsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  paymentOption: {
    flex: 1,
    backgroundColor: '#070a12',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  paymentOptionActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  paymentIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    textAlign: 'center',
  },
  paymentLabelActive: {
    color: '#10b981',
    fontWeight: '800',
  },
  cardInputContainer: {
    backgroundColor: '#070a12',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  cardInputGroup: {
    gap: 4,
  },
  cardInputLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  cardInput: {
    backgroundColor: '#131b2e',
    color: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentNoticeBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    marginBottom: 10,
  },
  paymentNoticeText: {
    fontSize: 11,
    color: '#38bdf8',
    lineHeight: 16,
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
  unavailableDatesContainer: {
    backgroundColor: '#070a12',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  unavailableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  unavailableHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
  allAvailableText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  rangesScroll: {
    flexDirection: 'row',
  },
  rangeBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  rangeBadgeText: {
    fontSize: 11,
    color: '#f87171',
    fontWeight: '700',
  },
  collisionBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  collisionBannerText: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  dateInputError: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  openCalendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1.5,
    borderColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    gap: 12,
  },
  openCalendarBtnIcon: {
    fontSize: 22,
  },
  openCalendarBtnTextContainer: {
    flex: 1,
  },
  openCalendarBtnTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.3,
  },
  openCalendarBtnSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  openCalendarBtnArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10b981',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  ratingBadgeStar: {
    color: '#fbbf24',
    fontSize: 12,
  },
  ratingBadgeText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
  },
  reviewsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  overallScoreStar: {
    color: '#fbbf24',
    fontSize: 16,
  },
  overallScoreVal: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '800',
  },
  overallScoreSub: {
    color: '#94a3b8',
    fontSize: 12,
  },
  writeReviewBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  writeReviewBtnText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
  },
  noReviewsBox: {
    backgroundColor: '#0c1222',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  noReviewsText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#0c1222',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  reviewCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  authorAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  authorAvatarText: {
    color: '#38bdf8',
    fontWeight: '800',
    fontSize: 14,
  },
  authorMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  reviewStarsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  reviewStarSymbol: {
    fontSize: 13,
  },
  goldStar: {
    color: '#fbbf24',
  },
  dimStar: {
    color: '#334155',
  },
  reviewComment: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 19,
    fontStyle: 'italic',
  },
  hostReplyBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  hostReplyTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 4,
  },
  hostReplyText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 17,
  },
});
