import api from "../api/axios";
import type { DepositRequest } from "../types/depositRequest";

export const createDepositRequest = async (
  amount: number,
): Promise<DepositRequest> => {
  const response = await api.post<DepositRequest>(
    "/api/deposit-requests",
    null,
    { params: { amount } },
  );
  return response.data;
};

export const getMyDepositRequests = async (): Promise<DepositRequest[]> => {
  const response = await api.get<DepositRequest[]>("/api/deposit-requests");
  return response.data;
};