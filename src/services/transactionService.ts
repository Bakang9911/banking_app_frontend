import api from "../api/axios";
import type { Transaction } from "../types/transaction";

export interface TransferRequest {
  fromAccountId: number;
  beneficiaryAccountNumber: string;
  amount: number;
  reference?: string;
}

export const getMyTransactions = async (
  accountId: number,
): Promise<Transaction[]> => {
  const response = await api.get<Transaction[]>(
    `/api/transactions?accountId=${accountId}`,
  );

  return response.data;
};

export const transferToBeneficiary = async (
  request: TransferRequest,
): Promise<void> => {
  await api.post(
    "/api/transactions/transfer-to-account-number",
    null,
    {
      params: {
        fromAccountId: request.fromAccountId,
        beneficiaryAccountNumber: request.beneficiaryAccountNumber,
        amount: request.amount,
        ...(request.reference?.trim()
          ? { reference: request.reference.trim() }
          : {}),
      },
    },
  );
};