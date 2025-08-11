export interface RestaurantPageItem {
  id: string;
  name: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  avg_rating: number | null;
  total_ratings: number | null;
  cuisine: string | null;
  image_url: string | null;
  capacity: number | null;
  offer_table_today: boolean | null;
  price_range: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_in_meters?: number | null;
  popularity?: number | null;
  postal_code?: string | null;
}
