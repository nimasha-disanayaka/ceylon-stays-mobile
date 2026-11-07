import { Booking } from '../types';

let memoryBookings: Booking[] = [];

export const getLocalBookings = (): Booking[] => {
  return memoryBookings;
};

export const addLocalBooking = (booking: Booking): void => {
  memoryBookings = [booking, ...memoryBookings.filter((b) => b.id !== booking.id)];
};

export const updateLocalBookingStatus = (
  id: string,
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
): void => {
  memoryBookings = memoryBookings.map((b) => (b.id === id ? { ...b, status } : b));
};
