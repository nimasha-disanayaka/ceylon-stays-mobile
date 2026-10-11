import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDates: (checkIn: string, checkOut: string) => void;
  initialCheckIn: string;
  initialCheckOut: string;
  unavailableRanges: Array<{ startDate: string; endDate: string; type: string; reason?: string }>;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const CalendarModal: React.FC<CalendarModalProps> = ({
  visible,
  onClose,
  onSelectDates,
  initialCheckIn,
  initialCheckOut,
  unavailableRanges,
}) => {
  // Parse initial check-in date for default calendar view month
  const initialDate = initialCheckIn ? new Date(initialCheckIn) : new Date();
  const [currentYear, setCurrentYear] = useState(
    isNaN(initialDate.getFullYear()) ? 2026 : initialDate.getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState(
    isNaN(initialDate.getMonth()) ? 9 : initialDate.getMonth()
  ); // 0-indexed (9 = October)

  const [selectedIn, setSelectedIn] = useState<string>(initialCheckIn || '');
  const [selectedOut, setSelectedOut] = useState<string>(initialCheckOut || '');

  // Helper to format date as YYYY-MM-DD
  const formatDateStr = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  // Check if a date string is booked/unavailable
  const isDateBooked = (dateStr: string) => {
    const target = new Date(dateStr);
    for (const range of unavailableRanges) {
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      // Considered booked if target >= start and target < end
      if (target >= start && target < end) {
        return true;
      }
    }
    return false;
  };

  // Check if range contains any booked dates
  const rangeHasBookedDates = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    for (const range of unavailableRanges) {
      const rStart = new Date(range.startDate);
      const rEnd = new Date(range.endDate);
      if (start < rEnd && end > rStart) {
        return true;
      }
    }
    return false;
  };

  // Day click handler
  const handleDayPress = (dateStr: string) => {
    if (isDateBooked(dateStr)) return;

    if (!selectedIn || (selectedIn && selectedOut)) {
      // First click: select check-in
      setSelectedIn(dateStr);
      setSelectedOut('');
    } else if (selectedIn && !selectedOut) {
      // Second click: select check-out
      if (dateStr > selectedIn) {
        if (rangeHasBookedDates(selectedIn, dateStr)) {
          alert('Selected stay range includes booked dates. Please choose continuous free dates.');
          return;
        }
        setSelectedOut(dateStr);
      } else {
        // Clicked date is earlier than selectedIn, so reset check-in
        setSelectedIn(dateStr);
        setSelectedOut('');
      }
    }
  };

  // Calculate days in month and starting weekday
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // Calculate nights count
  const calculateNights = () => {
    if (!selectedIn || !selectedOut) return 0;
    const diff = new Date(selectedOut).getTime() - new Date(selectedIn).getTime();
    const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
  };

  const totalNights = calculateNights();

  const handleApply = () => {
    if (selectedIn && selectedOut) {
      onSelectDates(selectedIn, selectedOut);
      onClose();
    } else {
      alert('Please select both Check-In and Check-Out dates.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Select Stay Dates</Text>
              <Text style={styles.modalSubtitle}>Tap free days for check-in & check-out</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.legendAvailable]} />
              <Text style={styles.legendLabel}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.legendSelected]} />
              <Text style={styles.legendLabel}>Selected</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.legendBooked]} />
              <Text style={styles.legendLabel}>Booked (🔒)</Text>
            </View>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navArrowBtn}>
              <Text style={styles.navArrowText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navArrowBtn}>
              <Text style={styles.navArrowText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Week Days Header */}
          <View style={styles.weekHeader}>
            {WEEK_DAYS.map((day, idx) => (
              <Text key={idx} style={styles.weekDayText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {/* Blank offset days */}
            {Array.from({ length: startDayOfWeek }).map((_, idx) => (
              <View key={`empty-${idx}`} style={styles.dayCellEmpty} />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = formatDateStr(currentYear, currentMonth, dayNum);
              const booked = isDateBooked(dateStr);
              const isStart = selectedIn === dateStr;
              const isEnd = selectedOut === dateStr;
              const inRange =
                selectedIn && selectedOut && dateStr > selectedIn && dateStr < selectedOut;

              return (
                <TouchableOpacity
                  key={`day-${dayNum}`}
                  disabled={booked}
                  onPress={() => handleDayPress(dateStr)}
                  style={[
                    styles.dayCell,
                    booked && styles.dayCellBooked,
                    inRange && styles.dayCellInRange,
                    (isStart || isEnd) && styles.dayCellSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      booked && styles.dayTextBooked,
                      inRange && styles.dayTextInRange,
                      (isStart || isEnd) && styles.dayTextSelected,
                    ]}
                  >
                    {dayNum}
                  </Text>
                  {booked && <Text style={styles.bookedLockIcon}>🔒</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selection Summary */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>CHECK-IN</Text>
              <Text style={styles.summaryVal}>{selectedIn || '—'}</Text>
            </View>
            <View style={styles.summaryMiddle}>
              <Text style={styles.nightsBadge}>
                {totalNights > 0 ? `${totalNights} Night(s)` : 'Select Range'}
              </Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>CHECK-OUT</Text>
              <Text style={styles.summaryVal}>{selectedOut || '—'}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => {
                setSelectedIn('');
                setSelectedOut('');
              }}
              style={styles.clearBtn}
            >
              <Text style={styles.clearBtnText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleApply}
              style={[
                styles.applyBtn,
                (!selectedIn || !selectedOut) && styles.applyBtnDisabled,
              ]}
              disabled={!selectedIn || !selectedOut}
            >
              <Text style={styles.applyBtnText}>
                {totalNights > 0 ? `Apply ${totalNights} Night(s)` : 'Select Dates'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 15, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#0d1322',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#070a12',
    borderRadius: 12,
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendAvailable: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#475569',
  },
  legendSelected: {
    backgroundColor: '#10b981',
  },
  legendBooked: {
    backgroundColor: '#ef4444',
  },
  legendLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
  monthTitle: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  weekDayText: {
    width: 40,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 14,
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 40,
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 2,
  },
  dayCellBooked: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  dayCellInRange: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 0,
  },
  dayCellSelected: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  dayText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  dayTextBooked: {
    color: '#ef4444',
    textDecorationLine: 'line-through',
    fontSize: 11,
  },
  bookedLockIcon: {
    fontSize: 8,
    marginTop: -2,
  },
  dayTextInRange: {
    color: '#6ee7b7',
    fontWeight: '700',
  },
  dayTextSelected: {
    color: '#ffffff',
    fontWeight: '900',
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#070a12',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '700',
    marginBottom: 2,
  },
  summaryVal: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  summaryMiddle: {
    paddingHorizontal: 8,
  },
  nightsBadge: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '800',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  clearBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  applyBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyBtnDisabled: {
    backgroundColor: '#334155',
    shadowOpacity: 0,
    elevation: 0,
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
