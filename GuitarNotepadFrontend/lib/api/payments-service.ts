import { apiClient } from "./client";

export interface PremiumUpgradeResult {
  success: boolean;
  message: string;
  premiumUntil?: string;
}

export class PaymentsService {
  private static readonly BASE_PATH = "/payments";

  static async upgradeToPremium(
    paymentMethod: string,
    paymentToken: string,
  ): Promise<PremiumUpgradeResult> {
    return await apiClient.post<
      { paymentMethod: string; paymentToken: string },
      PremiumUpgradeResult
    >(`${this.BASE_PATH}/upgrade-to-premium`, {
      paymentMethod,
      paymentToken,
    });
  }
}
