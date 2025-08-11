export interface RestaurantPageItem {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  postalCode: string;
  cuisine: string;
  imageUrl: string;
  capacity: number;
  offerTableToday: boolean;
  priceRange: string;
  latitude: number | null;
  longitude: number | null;
  avgRating: number;
  totalRatings: number;
}
