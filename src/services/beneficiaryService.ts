import api from "../api/axios";
import type {
  Beneficiary,
  BeneficiaryLookup,
  SaveBeneficiaryRequest,
} from "../types/beneficiary";

export const lookupBeneficiaryAccount = async (
  accountNumber: string,
): Promise<BeneficiaryLookup> => {
  const response = await api.get<BeneficiaryLookup>(
    "/api/beneficiaries/lookup",
    { params: { accountNumber } },
  );

  return response.data;
};

export const saveBeneficiary = async (
  request: SaveBeneficiaryRequest,
): Promise<Beneficiary> => {
  const response = await api.post<Beneficiary>(
    "/api/beneficiaries",
    request,
  );

  return response.data;
};

export const getMyBeneficiaries = async (): Promise<Beneficiary[]> => {
  const response = await api.get<Beneficiary[]>("/api/beneficiaries");
  return response.data;
};

export const deleteBeneficiary = async (id: number): Promise<void> => {
  await api.delete(`/api/beneficiaries/${id}`);
};
