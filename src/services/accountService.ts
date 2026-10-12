import api from "../api/axios";
import type { Account } from "../types/account";

export const getMyAccount = async (): Promise<Account> => {
  const response = await api.get<Account[]>("/api/accounts");

  if (!response.data || response.data.length === 0) {
    throw new Error("No account found.");
  }

  return response.data[0];
};
