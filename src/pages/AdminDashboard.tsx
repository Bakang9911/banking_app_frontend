import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { clearAuthData, getUsername } from "../services/storageService";

interface Customer {
  id: number;
  username: string;
  role: string;
}

interface BankAccount {
  id: number;
  accountNumber: string;
  balance: number;
  currency: string;
  name: string;
  type: string;
}

interface DepositRequest {
  id: number;
  accountId: number;
  accountNumber: string;
  accountName: string;
  amount: number;
  status: string;
  requestedAt: string;
  processedAt: string | null;
}

interface BankTransaction {
  id: number;
  type: string;
  direction: string;
  description: string;
  amount: number;
  timestamp: string;
  relatedAccountNumber?: string;
  relatedAccountName?: string;
  reference?: string;
}

type AdminSection = "overview" | "customers" | "accounts" | "deposits" | "transactions";

function formatMoney(amount: number, currency = "ZAR") {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-ZA");
}

function getApiError(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (error as {
      response?: { data?: { message?: string; error?: string } };
    }).response;
    return response?.data?.message ?? response?.data?.error ?? fallback;
  }
  return fallback;
}

function AdminDashboard() {
  const navigate = useNavigate();
  const username = getUsername();

  const [section, setSection] = useState<AdminSection>("overview");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [customerResponse, accountResponse, depositResponse, transactionResponse] =
        await Promise.all([
          api.get<Customer[]>("/api/admin/customers"),
          api.get<BankAccount[]>("/api/admin/accounts"),
          api.get<DepositRequest[]>("/api/admin/deposit-requests"),
          api.get<BankTransaction[]>("/api/admin/transactions"),
        ]);

      setCustomers(customerResponse.data);
      setAccounts(accountResponse.data);
      setDeposits(depositResponse.data);
      setTransactions(transactionResponse.data);
    } catch (err: unknown) {
      setError(
        getApiError(
          err,
          "Unable to load the admin dashboard. Check your connection and administrator access.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const reviewDeposit = async (
    request: DepositRequest,
    action: "approve" | "reject",
  ) => {
    const verb = action === "approve" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${verb} the deposit request for ${formatMoney(request.amount)} from account ${request.accountNumber}?`,
    );

    if (!confirmed) return;

    setProcessingId(request.id);
    setError("");
    setMessage("");

    try {
      const response = await api.post<DepositRequest>(
        `/api/admin/deposit-requests/${request.id}/${action}`,
      );

      setDeposits((current) =>
        current.filter((item) => item.id !== request.id),
      );

      setMessage(
        `Deposit request #${request.id} ${response.data.status.toLowerCase()} successfully.`,
      );

      // Reload balances and transactions after the decision.
      await loadDashboard();
    } catch (err: unknown) {
      setError(
        getApiError(err, `Unable to ${verb} this deposit request.`),
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = () => {
    clearAuthData();
    navigate("/login");
  };

  const navItems: { id: AdminSection; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "customers", label: "Customers" },
    { id: "accounts", label: "Accounts" },
    { id: "deposits", label: "Deposit Requests" },
    { id: "transactions", label: "Transactions" },
  ];

  return (
    <main className="dashboard-page admin-page">
      <header className="dashboard-header admin-header">
        <div>
          <p className="admin-eyebrow">BANKING APPLICATION</p>
          <h1>Admin Dashboard</h1>
          <p>Welcome, {username || "Administrator"}. Manage banking operations.</p>
        </div>
        <div className="admin-header-actions">
          <button type="button" onClick={() => void loadDashboard()} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button type="button" className="admin-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="admin-content">
        <nav className="admin-nav" aria-label="Admin sections">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={section === item.id ? "admin-nav-active" : ""}
              onClick={() => setSection(item.id)}
            >
              {item.label}
              {item.id === "deposits" && deposits.length > 0 && (
                <span className="admin-nav-count">{deposits.length}</span>
              )}
            </button>
          ))}
        </nav>

        {error && <p className="dashboard-error admin-alert" role="alert">{error}</p>}
        {message && <p className="admin-success" role="status">{message}</p>}

        {loading ? (
          <section className="dashboard-section">
            <p>Loading admin dashboard...</p>
          </section>
        ) : (
          <>
            {section === "overview" && (
              <>
                <section className="admin-stat-grid">
                  <article className="admin-stat-card">
                    <span>Total customers</span>
                    <strong>{customers.length}</strong>
                  </article>
                  <article className="admin-stat-card">
                    <span>Total accounts</span>
                    <strong>{accounts.length}</strong>
                  </article>
                  <article className="admin-stat-card admin-stat-highlight">
                    <span>Pending deposits</span>
                    <strong>{deposits.length}</strong>
                  </article>
                  <article className="admin-stat-card">
                    <span>Total transactions</span>
                    <strong>{transactions.length}</strong>
                  </article>
                </section>

                <section className="dashboard-section">
                  <div className="section-header admin-section-header">
                    <h2>Deposit Requests Requiring Attention</h2>
                    <button type="button" onClick={() => setSection("deposits")}>
                      View All
                    </button>
                  </div>

                  {deposits.length === 0 ? (
                    <div className="empty-state">
                      <p>No pending deposit requests.</p>
                    </div>
                  ) : (
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Account</th>
                            <th>Amount</th>
                            <th>Requested</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deposits.slice(0, 5).map((request) => (
                            <tr key={request.id}>
                              <td>
                                <strong>{request.accountName}</strong>
                                <small>{request.accountNumber}</small>
                              </td>
                              <td>{formatMoney(request.amount)}</td>
                              <td>{formatDate(request.requestedAt)}</td>
                              <td>
                                <div className="admin-row-actions">
                                  <button
                                    type="button"
                                    className="admin-approve"
                                    disabled={processingId === request.id}
                                    onClick={() => void reviewDeposit(request, "approve")}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-reject"
                                    disabled={processingId === request.id}
                                    onClick={() => void reviewDeposit(request, "reject")}
                                  >
                                    Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="dashboard-section">
                  <h2>Recent Transactions</h2>
                  {transactions.length === 0 ? (
                    <div className="empty-state"><p>No transactions found.</p></div>
                  ) : (
                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Transaction</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.slice(0, 8).map((transaction) => (
                            <tr key={transaction.id}>
                              <td>#{transaction.id}</td>
                              <td>{transaction.description || transaction.type}</td>
                              <td>{formatMoney(transaction.amount)}</td>
                              <td>{formatDate(transaction.timestamp)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}

            {section === "customers" && (
              <section className="dashboard-section">
                <h2>Customers</h2>
                {customers.length === 0 ? (
                  <div className="empty-state"><p>No customers found.</p></div>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr><th>ID</th><th>Username</th><th>Role</th></tr>
                      </thead>
                      <tbody>
                        {customers.map((customer) => (
                          <tr key={customer.id}>
                            <td>{customer.id}</td>
                            <td>{customer.username}</td>
                            <td><span className="admin-status">{customer.role}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {section === "accounts" && (
              <section className="dashboard-section">
                <h2>Accounts</h2>
                {accounts.length === 0 ? (
                  <div className="empty-state"><p>No accounts found.</p></div>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Account name</th>
                          <th>Account number</th>
                          <th>Type</th>
                          <th>Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accounts.map((account) => (
                          <tr key={account.id}>
                            <td>{account.name}</td>
                            <td>{account.accountNumber}</td>
                            <td>{account.type}</td>
                            <td>{formatMoney(account.balance, account.currency || "ZAR")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {section === "deposits" && (
              <section className="dashboard-section">
                <h2>Pending Deposit Requests</h2>
                {deposits.length === 0 ? (
                  <div className="empty-state"><p>All deposit requests have been processed.</p></div>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Account</th>
                          <th>Amount</th>
                          <th>Requested</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deposits.map((request) => (
                          <tr key={request.id}>
                            <td>
                              <strong>{request.accountName}</strong>
                              <small>{request.accountNumber}</small>
                            </td>
                            <td>{formatMoney(request.amount)}</td>
                            <td>{formatDate(request.requestedAt)}</td>
                            <td>
                              <div className="admin-row-actions">
                                <button
                                  type="button"
                                  className="admin-approve"
                                  disabled={processingId === request.id}
                                  onClick={() => void reviewDeposit(request, "approve")}
                                >
                                  {processingId === request.id ? "Processing..." : "Approve"}
                                </button>
                                <button
                                  type="button"
                                  className="admin-reject"
                                  disabled={processingId === request.id}
                                  onClick={() => void reviewDeposit(request, "reject")}
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {section === "transactions" && (
              <section className="dashboard-section">
                <h2>All Transactions</h2>
                {transactions.length === 0 ? (
                  <div className="empty-state"><p>No transactions found.</p></div>
                ) : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Description</th>
                          <th>Type</th>
                          <th>Direction</th>
                          <th>Amount</th>
                          <th>Reference</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td>{transaction.id}</td>
                            <td>{transaction.description || "Transaction"}</td>
                            <td>{transaction.type}</td>
                            <td>{transaction.direction}</td>
                            <td>{formatMoney(transaction.amount)}</td>
                            <td>{transaction.reference || "—"}</td>
                            <td>{formatDate(transaction.timestamp)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default AdminDashboard;