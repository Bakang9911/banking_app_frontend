import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { House } from "lucide-react";
import type { Account } from "../types/account";
import type { Transaction } from "../types/transaction";
import type {
  Beneficiary,
  BeneficiaryLookup,
} from "../types/beneficiary";
import { withdrawMoney } from "../services/withdrawalService";
import {
  createDepositRequest,
  getMyDepositRequests,
} from "../services/depositRequestService";
import type { DepositRequest } from "../types/depositRequest";
import { getMyAccount } from "../services/accountService";
import {
  getMyTransactions,
  transferToBeneficiary,
} from "../services/transactionService";
import {
  deleteBeneficiary,
  getMyBeneficiaries,
  lookupBeneficiaryAccount,
  saveBeneficiary,
} from "../services/beneficiaryService";
import { clearAuthData, getUsername } from "../services/storageService";

type Workspace = "home" | "transactions" | "withdraw" | "transfer" | "deposit";

function CustomerDashboard() {
  const navigate = useNavigate();
  const username = getUsername();

  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [workspace, setWorkspace] = useState<Workspace>("home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const accountData = await getMyAccount();
        setAccount(accountData);
        const transactionData = await getMyTransactions(accountData.id);
        setTransactions(transactionData);
      } catch (err) {
        console.error(err);
        setError("Unable to load your banking information.");
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const refreshDashboard = async () => {
    const accountData = await getMyAccount();
    setAccount(accountData);
    const transactionData = await getMyTransactions(accountData.id);
    setTransactions(transactionData);
  };


  const handleLogout = () => {
    clearAuthData();
    navigate("/login");
  };

  const goHome = () => setWorkspace("home");

  if (loading) {
    return (
      <div className="dashboard-page">
        <h2>Loading your banking information...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <p className="dashboard-error">{error}</p>
        <button onClick={handleLogout}>Return to Login</button>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Customer Dashboard</h1>
          <p>
            Welcome, <strong>{account?.name || username}</strong>
          </p>
        </div>
        <div className="header-actions">
          <button
            className="home-button"
            onClick={goHome}
            title="Home"
            aria-label="Home"
          ><House size={20} strokeWidth={2} aria-hidden="true" /></button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="account-card">
          <p className="card-label">Available Balance</p>
          <h2>
            {account?.currency}{" "}
            {account?.balance.toLocaleString("en-ZA", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </h2>
          <div className="account-details">
            <div>
              <span>Account Holder</span>
              <strong>{account?.name}</strong>
            </div>
            <div>
              <span>Account Number</span>
              <strong>{account?.accountNumber}</strong>
            </div>
            <div>
              <span>Account Type</span>
              <strong>{account?.type}</strong>
            </div>
          </div>
        </section>

        <section className="quick-actions">
          <h2>Banking Services</h2>
          <div className="action-grid">
            <button
              className={workspace === "withdraw" ? "action-active" : ""}
              onClick={() => setWorkspace("withdraw")}
            >
              Withdraw
            </button>
            <button
              className={workspace === "transfer" ? "action-active" : ""}
              onClick={() => setWorkspace("transfer")}
            >
              Transfer
            </button>
            <button
              className={workspace === "deposit" ? "action-active" : ""}
              onClick={() => setWorkspace("deposit")}
            >
              Deposit Request
            </button>
            <button
              className={workspace === "transactions" ? "action-active" : ""}
              onClick={() => setWorkspace("transactions")}
            >
              Transactions
            </button>
          </div>
        </section>

        <section className="dashboard-section">
          {workspace === "home" && (
            <RecentTransactionsWorkspace
              transactions={transactions}
              currency={account?.currency || "ZAR"}
              onViewAll={() => setWorkspace("transactions")}
            />
          )}

          {workspace === "transactions" && (
            <TransactionWorkspace
              transactions={transactions}
              currency={account?.currency || "ZAR"}
            />
          )}

          {workspace === "withdraw" && (
            <WithdrawWorkspace account={account} onSuccess={refreshDashboard} />
          )}

          {workspace === "transfer" && (
            <TransferWorkspace
              account={account}
              onTransferSuccess={refreshDashboard}
            />
          )}

          {workspace === "deposit" && <DepositWorkspace />}
        </section>
      </main>
    </div>
  );
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  currency: string;
  onViewAll: () => void;
}

function RecentTransactionsWorkspace({
  transactions,
  currency,
  onViewAll,
}: RecentTransactionsProps) {
  const recentTransactions = transactions.slice(0, 3);

  return (
    <>
      <div className="section-header">
        <h2>Recent Transactions</h2>
        <button onClick={onViewAll}>View All</button>
      </div>

      {recentTransactions.length === 0 ? (
        <div className="empty-state">
          <p>No recent transactions.</p>
        </div>
      ) : (
        <div className="transaction-list">
          {recentTransactions.map((transaction) => (
            <div className="transaction-row" key={transaction.id}>
              <div>
                <strong>{transaction.description}</strong>
                <span>
                  {new Date(transaction.timestamp).toLocaleDateString("en-ZA")}
                </span>
              </div>
              <div
                className={
                  transaction.direction === "MONEY_IN" ? "money-in" : "money-out"
                }
              >
                {transaction.direction === "MONEY_IN" ? "+" : "-"}
                {currency}{" "}
                {transaction.amount.toLocaleString("en-ZA", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

interface TransactionWorkspaceProps {
  transactions: Transaction[];
  currency: string;
}

function TransactionWorkspace({
  transactions,
  currency,
}: TransactionWorkspaceProps) {
  return (
    <>
      <div className="section-header">
        <h2>Transaction History</h2>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state">
          <p>No transactions found.</p>
        </div>
      ) : (
        <div className="transaction-list">
          {transactions.map((transaction) => (
            <div className="transaction-row" key={transaction.id}>
              <div>
                <strong>{transaction.description}</strong>
                <span>
                  {new Date(transaction.timestamp).toLocaleString("en-ZA")}
                </span>
                {transaction.relatedAccountNumber && (
                  <span>Account: {transaction.relatedAccountNumber}</span>
                )}
                {transaction.reference && (
                  <span>Reference: {transaction.reference}</span>
                )}
                {transaction.reference && (
                  <span>Reference: {transaction.reference}</span>
                )}
              </div>
              <div
                className={
                  transaction.direction === "MONEY_IN" ? "money-in" : "money-out"
                }
              >
                {transaction.direction === "MONEY_IN" ? "+" : "-"}
                {currency}{" "}
                {transaction.amount.toLocaleString("en-ZA", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function WithdrawWorkspace({
  account,
  onSuccess,
}: {
  account: Account | null;
  onSuccess: () => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const reviewWithdrawal = () => {
    setError("");
    setMessage("");
    const value = Number(amount);

    if (!amount.trim() || !Number.isFinite(value) || value <= 0) {
      setError("Enter a valid withdrawal amount greater than zero.");
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(amount.trim())) {
      setError("Enter an amount with no more than two decimal places.");
      return;
    }
    if (value > (account?.balance ?? 0)) {
      setError("The withdrawal exceeds your available balance.");
      return;
    }
    setReviewing(true);
  };

  const confirmWithdrawal = async () => {
    if (!account) {
      setError("Your account could not be loaded.");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      await withdrawMoney(account.id, Number(amount));
      await onSuccess();
      setAmount("");
      setReviewing(false);
      setMessage("Withdrawal completed successfully.");
    } catch (err: unknown) {
      setError(getApiError(err, "Withdrawal failed. Check your balance and try again."));
      setReviewing(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-workspace">
      <div className="section-header">
        <h2>Withdraw Money</h2>
      </div>
      <p className="workspace-balance">
        Available balance: <strong>{account?.currency}{" "}
        {(account?.balance ?? 0).toLocaleString("en-ZA", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}</strong>
      </p>

      {!reviewing ? (
        <>
          <div className="form-group">
            <label htmlFor="withdrawalAmount">Withdrawal amount</label>
            <input
              id="withdrawalAmount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
            />
          </div>
          <button type="button" onClick={reviewWithdrawal}>Review Withdrawal</button>
        </>
      ) : (
        <div className="beneficiary-verification">
          <h3>Confirm Withdrawal</h3>
          <p><strong>Amount:</strong> {account?.currency}{" "}
            {Number(amount).toLocaleString("en-ZA", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p><strong>Estimated remaining balance:</strong> {account?.currency}{" "}
            {((account?.balance ?? 0) - Number(amount)).toLocaleString("en-ZA", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <button type="button" onClick={() => void confirmWithdrawal()} disabled={submitting}>
            {submitting ? "Processing..." : "Confirm Withdrawal"}
          </button>
          <button type="button" onClick={() => setReviewing(false)} disabled={submitting}>
            Back
          </button>
        </div>
      )}

      {error && <p className="dashboard-error" role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
function TransferWorkspace({
  account,
  onTransferSuccess,
}: {
  account: Account | null;
  onTransferSuccess: () => Promise<void>;
}) {
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferReference, setTransferReference] = useState("");
  const [reviewingTransfer, setReviewingTransfer] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [nickname, setNickname] = useState("");
  const [lookup, setLookup] = useState<BeneficiaryLookup | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadBeneficiaries = async () => {
    try {
      setBeneficiaries(await getMyBeneficiaries());
    } catch (err) {
      console.error(err);
      setError("Unable to load saved beneficiaries.");
    }
  };

  useEffect(() => {
    void loadBeneficiaries();
  }, []);

  const findBeneficiary = async () => {
    setError("");
    setMessage("");
    setLookup(null);
    setNickname("");

    if (!/^\d{8}$/.test(accountNumber)) {
      setError("Enter an account number containing exactly 8 digits.");
      return;
    }

    setLoading(true);
    try {
      const result = await lookupBeneficiaryAccount(accountNumber);
      setLookup(result);
      setMessage("Account found. Verify the details before saving.");
    } catch (err: unknown) {
      console.error(err);
      setError(getApiError(err, "Unable to find that account."));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!lookup) return;

    if (!nickname.trim()) {
      setError("Enter a nickname for this beneficiary.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await saveBeneficiary({
        accountNumber: lookup.accountNumber,
        nickname: nickname.trim(),
      });
      setMessage("Beneficiary saved successfully.");
      setAccountNumber("");
      setNickname("");
      setLookup(null);
      await loadBeneficiaries();
    } catch (err: unknown) {
      setError(getApiError(err, "Unable to save this beneficiary."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setError("");
    setMessage("");

    try {
      await deleteBeneficiary(id);
      setBeneficiaries((current) => current.filter((item) => item.id !== id));
      setMessage("Beneficiary removed.");
    } catch (err: unknown) {
      setError(getApiError(err, "Unable to remove this beneficiary."));
    }
  };

  const handleReviewTransfer = () => {
    setError("");
    setMessage("");

    if (!selectedBeneficiary) {
      setError("Select a saved beneficiary first.");
      return;
    }

    const amount = Number(transferAmount);
    if (!transferAmount.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid transfer amount greater than zero.");
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(transferAmount.trim())) {
      setError("Enter an amount with no more than two decimal places.");
      return;
    }

    if (amount > (account?.balance ?? 0)) {
      setError("The transfer amount exceeds your available balance.");
      return;
    }

    if (transferReference.trim().length > 100) {
      setError("The payment reference cannot exceed 100 characters.");
      return;
    }

    setReviewingTransfer(true);
  };

  const handleConfirmTransfer = async () => {
    if (!account || !selectedBeneficiary) return;

    setTransferring(true);
    setError("");
    setMessage("");

    try {
      await transferToBeneficiary({
        fromAccountId: account.id,
        beneficiaryAccountNumber: selectedBeneficiary.accountNumber,
        amount: Number(transferAmount),
        ...(transferReference.trim()
          ? { reference: transferReference.trim() }
          : {}),
      });

      setMessage("Transfer completed successfully.");
      setSelectedBeneficiary(null);
      setTransferAmount("");
      setTransferReference("");
      setReviewingTransfer(false);
      await onTransferSuccess();
    } catch (err: unknown) {
      setError(getApiError(err, "Transfer failed. Please check your details and try again."));
      setReviewingTransfer(false);
    } finally {
      setTransferring(false);
    }
  };



  return (
    <div className="form-workspace">
      <div className="section-header">
        <h2>Add Beneficiary</h2>
      </div>

      <div className="beneficiary-form">
        <div className="form-group">
          <label htmlFor="beneficiaryAccount">Beneficiary Account Number</label>
          <input
            id="beneficiaryAccount"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={8}
            value={accountNumber}
            placeholder="Enter 8-digit account number"
            onChange={(event) => {
              setAccountNumber(event.target.value.replace(/\D/g, "").slice(0, 8));
              setLookup(null);
              setMessage("");
              setError("");
            }}
          />
        </div>

        <button type="button" onClick={findBeneficiary} disabled={loading}>
          {loading ? "Searching..." : "Find Beneficiary"}
        </button>

        {error && <p className="dashboard-error" role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}

        {lookup && (
          <div className="beneficiary-verification">
            <h3>Verify Beneficiary Details</h3>
            <p>
              <strong>Name:</strong> {lookup.name}
            </p>
            <p>
              <strong>Account Number:</strong> {lookup.accountNumber}
            </p>
            <p>
              <strong>Account Type:</strong> {lookup.type}
            </p>
            <p>
              <strong>Currency:</strong> {lookup.currency}
            </p>
            <p>Please confirm these details before saving.</p>

            <div className="form-group">
              <label htmlFor="beneficiaryNickname">Your Nickname</label>
              <input
                id="beneficiaryNickname"
                type="text"
                maxLength={40}
                value={nickname}
                placeholder="e.g. Rent, Family, Friend"
                onChange={(event) => setNickname(event.target.value)}
              />
            </div>

            <button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Confirm and Save"}
            </button>
          </div>
        )}
      </div>

      <div className="saved-beneficiaries">
        <div className="section-header">
          <h3>Saved Beneficiaries</h3>
        </div>

        {beneficiaries.length === 0 ? (
          <div className="empty-state">
            <p>You have no saved beneficiaries yet.</p>
          </div>
        ) : (
          <div className="transaction-list">
            {beneficiaries.map((beneficiary) => (
              <div className="transaction-row" key={beneficiary.id}>
                <div>
                  <strong>{beneficiary.nickname}</strong>
                  <span>{beneficiary.name}</span>
                  <span>Account: {beneficiary.accountNumber}</span>
                  <span>{beneficiary.type} · {beneficiary.currency}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBeneficiary(beneficiary);
                    setTransferAmount("");
                    setTransferReference("");
                    setReviewingTransfer(false);
                    setError("");
                    setMessage("");
                  }}
                >
                  Select to Transfer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBeneficiary(beneficiary);
                    setTransferAmount("");
                    setTransferReference("");
                    setReviewingTransfer(false);
                    setError("");
                    setMessage("");
                  }}
                >
                  Select to Transfer
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(beneficiary.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="saved-beneficiaries">
        <div className="section-header">
          <h3>Make a Transfer</h3>
        </div>

        {selectedBeneficiary ? (
          <div className="beneficiary-verification">
            <p><strong>Recipient:</strong> {selectedBeneficiary.nickname}</p>
            <p><strong>Name:</strong> {selectedBeneficiary.name}</p>
            <p><strong>Account:</strong> {selectedBeneficiary.accountNumber}</p>
            <p>
              <strong>Available balance:</strong>{" "}
              {account?.currency}{" "}
              {(account?.balance ?? 0).toLocaleString("en-ZA", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            {!reviewingTransfer ? (
              <>
                <div className="form-group">
                  <label htmlFor="transferAmount">Amount</label>
                  <input
                    id="transferAmount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={transferAmount}
                    onChange={(event) => setTransferAmount(event.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="transferReference">Payment reference (optional)</label>
                  <input
                    id="transferReference"
                    type="text"
                    maxLength={100}
                    value={transferReference}
                    onChange={(event) => setTransferReference(event.target.value)}
                    placeholder="e.g. Rent October"
                  />
                </div>

                <button type="button" onClick={handleReviewTransfer}>
                  Review Transfer
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBeneficiary(null)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <h3>Confirm Transfer</h3>
                <p>
                  <strong>Amount:</strong> {account?.currency}{" "}
                  {Number(transferAmount).toLocaleString("en-ZA", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p>
                  <strong>Remaining balance:</strong> {account?.currency}{" "}
                  {((account?.balance ?? 0) - Number(transferAmount)).toLocaleString("en-ZA", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p><strong>Reference:</strong> {transferReference.trim() || "None"}</p>
                <p>Please verify the recipient and amount before confirming.</p>
                <button
                  type="button"
                  onClick={() => void handleConfirmTransfer()}
                  disabled={transferring}
                >
                  {transferring ? "Processing..." : "Confirm and Send"}
                </button>
                <button
                  type="button"
                  onClick={() => setReviewingTransfer(false)}
                  disabled={transferring}
                >
                  Back
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <p>Select a saved beneficiary above to begin a transfer.</p>
          </div>
        )}
      </div>

      <div className="saved-beneficiaries">
        <div className="section-header">
          <h3>Make a Transfer</h3>
        </div>

        {selectedBeneficiary ? (
          <div className="beneficiary-verification">
            <p><strong>Recipient:</strong> {selectedBeneficiary.nickname}</p>
            <p><strong>Name:</strong> {selectedBeneficiary.name}</p>
            <p><strong>Account:</strong> {selectedBeneficiary.accountNumber}</p>
            <p>
              <strong>Available balance:</strong>{" "}
              {account?.currency}{" "}
              {(account?.balance ?? 0).toLocaleString("en-ZA", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            {!reviewingTransfer ? (
              <>
                <div className="form-group">
                  <label htmlFor="transferAmount">Amount</label>
                  <input
                    id="transferAmount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={transferAmount}
                    onChange={(event) => setTransferAmount(event.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="transferReference">Payment reference (optional)</label>
                  <input
                    id="transferReference"
                    type="text"
                    maxLength={100}
                    value={transferReference}
                    onChange={(event) => setTransferReference(event.target.value)}
                    placeholder="e.g. Rent October"
                  />
                </div>

                <button type="button" onClick={handleReviewTransfer}>
                  Review Transfer
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBeneficiary(null)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <h3>Confirm Transfer</h3>
                <p>
                  <strong>Amount:</strong> {account?.currency}{" "}
                  {Number(transferAmount).toLocaleString("en-ZA", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p>
                  <strong>Remaining balance:</strong> {account?.currency}{" "}
                  {((account?.balance ?? 0) - Number(transferAmount)).toLocaleString("en-ZA", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p><strong>Reference:</strong> {transferReference.trim() || "None"}</p>
                <p>Please verify the recipient and amount before confirming.</p>
                <button
                  type="button"
                  onClick={() => void handleConfirmTransfer()}
                  disabled={transferring}
                >
                  {transferring ? "Processing..." : "Confirm and Send"}
                </button>
                <button
                  type="button"
                  onClick={() => setReviewingTransfer(false)}
                  disabled={transferring}
                >
                  Back
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <p>Select a saved beneficiary above to begin a transfer.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getApiError(err: unknown, fallback: string): string {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err
  ) {
    const response = (err as {
      response?: { data?: { message?: string; error?: string } };
    }).response;

    if (response?.data?.message) return response.data.message;
    if (response?.data?.error) return response.data.error;
  }

  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function DepositWorkspace() {
  const [amount, setAmount] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requests, setRequests] = useState<DepositRequest[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadRequests = async () => {
    try {
      setRequests(await getMyDepositRequests());
    } catch (err: unknown) {
      setError(getApiError(err, "Unable to load your deposit requests."));
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const reviewRequest = () => {
    setError("");
    setMessage("");
    const value = Number(amount);

    if (!amount.trim() || !Number.isFinite(value) || value <= 0) {
      setError("Enter a valid deposit amount greater than zero.");
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(amount.trim())) {
      setError("Enter an amount with no more than two decimal places.");
      return;
    }
    setReviewing(true);
  };

  const submitRequest = async () => {
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const created = await createDepositRequest(Number(amount));
      setRequests((current) => [created, ...current]);
      setAmount("");
      setReviewing(false);
      setMessage("Deposit request submitted. Your balance will change only after admin approval.");
    } catch (err: unknown) {
      setError(getApiError(err, "Unable to submit your deposit request."));
      setReviewing(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-workspace">
      <div className="section-header">
        <h2>Deposit Request</h2>
      </div>

      <p>Submit a deposit request for admin review. Your available balance will not change until the request is approved.</p>

      {!reviewing ? (
        <>
          <div className="form-group">
            <label htmlFor="depositAmount">Requested deposit amount</label>
            <input
              id="depositAmount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
            />
          </div>
          <button type="button" onClick={reviewRequest}>Review Request</button>
        </>
      ) : (
        <div className="beneficiary-verification">
          <h3>Review Deposit Request</h3>
          <p><strong>Requested amount:</strong> {Number(amount).toLocaleString("en-ZA", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</p>
          <p>This submits a request only; it does not deposit money immediately.</p>
          <button type="button" onClick={() => void submitRequest()} disabled={submitting}>
            {submitting ? "Submitting..." : "Confirm Deposit Request"}
          </button>
          <button type="button" onClick={() => setReviewing(false)} disabled={submitting}>
            Back
          </button>
        </div>
      )}

      {error && <p className="dashboard-error" role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}

      <div className="saved-beneficiaries">
        <div className="section-header"><h3>Your Deposit Requests</h3></div>
        {loadingRequests ? (
          <p>Loading requests...</p>
        ) : requests.length === 0 ? (
          <div className="empty-state"><p>You have no deposit requests yet.</p></div>
        ) : (
          <div className="transaction-list">
            {requests.map((request) => (
              <div className="transaction-row" key={request.id}>
                <div>
                  <strong>{request.amount.toLocaleString("en-ZA", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}</strong>
                  <span>Requested: {new Date(request.requestedAt).toLocaleString("en-ZA")}</span>
                  {request.processedAt && (
                    <span>Processed: {new Date(request.processedAt).toLocaleString("en-ZA")}</span>
                  )}
                </div>
                <span>{request.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default CustomerDashboard;
