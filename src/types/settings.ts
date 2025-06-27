// src/types/settings.ts
export interface NotificationSettings {
  newReservations: boolean;
  contactTableUpdates: boolean;
  platformNews: boolean;
  marketingEmails: boolean;
}

export interface PrivacySettings {
  showContactInfo: boolean;
  allowReviews: boolean;
  shareForAnalytics: boolean;
}
