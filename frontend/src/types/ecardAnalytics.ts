export interface EcardAnalyticsDailyCount {
  date: string;
  views: number;
  walletSaves: number;
  contactSaves: number;
  exchangeContacts: number;
}

export interface EcardAnalyticsSummary {
  totalViews: number;
  totalWalletSaves: number;
  totalContactSaves: number;
  totalExchangeContacts: number;
  averageViewDurationMs: number | null;
  dailyCounts: EcardAnalyticsDailyCount[];
}
