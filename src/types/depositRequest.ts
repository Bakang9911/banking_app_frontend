export interface DepositRequest {
  id: number;
  accountId: number;
  accountNumber: string;
  accountName: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  requestedAt: string;
  processedAt: string | null;
}