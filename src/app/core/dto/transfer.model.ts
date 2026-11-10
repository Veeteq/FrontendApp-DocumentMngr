import { ProvisionAt } from "../../features/documents/model/money-transfer-draft.model";

export interface Transfer {
  targetAccountId: number;
  transferAmount: number;
  provisionAmount?: number;
  provisionAt?: ProvisionAt;
}