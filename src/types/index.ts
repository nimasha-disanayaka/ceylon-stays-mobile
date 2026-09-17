export interface Business {
  id: string;
  name: string;
  description?: string;
  type: 'HOTEL' | 'HOMESTAY' | 'RESTAURANT';
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
}

export interface Listing {
  id: string;
  businessId: string;
  name?: string;
  title?: string;
  description: string;
  pricePerNight: number;
  maxGuests: number;
  amenities: string[];
  images?: string[];
  business?: Business;
}

export interface Booking {
  id: string;
  listingId: string;
  userId: string;
  checkIn: string;
  checkOut: string;
  totalNights: number;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  listing?: Listing;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'FOREIGNER';
  token?: string;
}
