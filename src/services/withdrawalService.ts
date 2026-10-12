import api from "../api/axios";

export const withdrawMoney = async (
  accountId: number,
  amount: number,
): Promise<void> => {
  await api.post("/api/transactions/withdraw", null, {
    params: { accountId, amount },
  });
};