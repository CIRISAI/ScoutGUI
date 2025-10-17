'use client';

import { useState, useEffect } from 'react';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CIRISClient } from '@/lib/ciris-sdk';

// Types
interface CreditStatus {
  has_credit: boolean;
  credits_remaining: number;
  free_uses_remaining: number;
  total_uses: number;
  plan_name: string;
  purchase_required: boolean;
  purchase_options?: {
    price_minor: number;
    uses: number;
    currency: string;
  };
}

interface Transaction {
  transaction_id: string;
  type: 'charge' | 'credit';
  amount_minor: number;
  currency: string;
  description: string;
  created_at: string;
  balance_after: number;
  metadata?: {
    agent_id?: string;
    channel?: string;
    thought_id?: string;
    [key: string]: any;
  };
  transaction_type?: string;
  external_transaction_id?: string;
}

interface PurchaseResponse {
  payment_id: string;
  client_secret: string;
  amount_minor: number;
  currency: string;
  uses_purchased: number;
  publishable_key: string;
}

type PurchaseStep = 'prompt' | 'payment' | 'processing' | 'success' | 'error';

// Stripe Elements appearance configuration
const stripeElementsOptions = {
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#3B82F6',
      colorBackground: '#FFFFFF',
      colorText: '#1F2937',
      colorDanger: '#EF4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    }
  }
};

// Credit Balance Component
function CreditBalance({ credits, onPurchaseClick }: {
  credits: CreditStatus | null;
  onPurchaseClick: () => void;
}) {
  if (!credits) {
    return (
      <div className="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
    );
  }

  const isFree = credits.free_uses_remaining > 0;
  const isLow = credits.credits_remaining < 5 && credits.free_uses_remaining === 0;
  const isEmpty = !credits.has_credit;

  let icon = '💵';
  let colorClass = 'text-blue-600 bg-blue-50 border-blue-200';
  let message = `${credits.credits_remaining} credits remaining`;

  if (isFree) {
    icon = '🎁';
    colorClass = credits.free_uses_remaining === 1 ? 'text-orange-600 bg-orange-50 border-orange-200' : 'text-green-600 bg-green-50 border-green-200';
    message = `${credits.free_uses_remaining} free tries remaining`;
  } else if (isEmpty) {
    icon = '💳';
    colorClass = 'text-red-600 bg-red-50 border-red-200';
    message = '0 credits remaining';
  } else if (isLow) {
    icon = '⚠️';
    colorClass = 'text-orange-600 bg-orange-50 border-orange-200';
    message = `${credits.credits_remaining} credits remaining`;
  }

  return (
    <div
      className={`${colorClass} border-2 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow`}
      onClick={() => (isEmpty || isLow) && onPurchaseClick()}
    >
      <div className="flex items-center gap-4">
        <span className="text-5xl">{icon}</span>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{message}</h2>
          <p className="text-sm mt-1">
            {isFree && "Try CIRIS for free! No credit card required."}
            {isEmpty && "Purchase more uses to continue"}
            {isLow && !isFree && "Running low! Purchase more to avoid interruptions"}
            {!isEmpty && !isLow && !isFree && "Click to purchase more"}
          </p>
          {credits.purchase_options && (
            <p className="text-sm font-medium mt-2">
              💰 {credits.purchase_options.uses} uses for ${(credits.purchase_options.price_minor / 100).toFixed(2)}
            </p>
          )}
        </div>
        {(isEmpty || isLow) && (
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Purchase
          </button>
        )}
      </div>
    </div>
  );
}

// Payment Form Component (uses Stripe Elements)
function PaymentForm({
  purchaseInfo,
  onSuccess,
  onError,
  onCancel
}: {
  purchaseInfo: PurchaseResponse;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return;
    }

    setProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        purchaseInfo.client_secret,
        {
          payment_method: {
            card: cardElement,
          }
        }
      );

      if (error) {
        onError(error.message || 'Payment failed');
      } else if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
        // Payment confirmed by Stripe, now poll backend for credit addition
        onSuccess(purchaseInfo.payment_id);
      }
    } catch (err) {
      onError('An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Details</h3>
        <p className="text-sm text-gray-600 mb-4">
          {purchaseInfo.uses_purchased} uses for ${(purchaseInfo.amount_minor / 100).toFixed(2)}
        </p>
      </div>

      <div className="border border-gray-300 rounded-lg p-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#1F2937',
                '::placeholder': {
                  color: '#9CA3AF'
                }
              },
              invalid: {
                color: '#EF4444',
                iconColor: '#EF4444'
              }
            }
          }}
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>🔒</span>
        <span>Secure payment powered by Stripe</span>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {processing ? 'Processing...' : `Pay $${(purchaseInfo.amount_minor / 100).toFixed(2)}`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Purchase Modal Component
function PurchaseModal({
  isOpen,
  onClose,
  onSuccess,
  credits
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  credits: CreditStatus | null;
}) {
  const [step, setStep] = useState<PurchaseStep>('prompt');
  const [error, setError] = useState<string | null>(null);
  const [purchaseInfo, setPurchaseInfo] = useState<PurchaseResponse | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [creditsAdded, setCreditsAdded] = useState<number>(0);

  const initiatePurchase = async () => {
    setStep('payment');

    try {
      const client = new CIRISClient();
      const data = await client.billing.initiatePurchase({
        return_url: window.location.href
      });

      setPurchaseInfo(data);
      setStripePromise(loadStripe(data.publishable_key));

    } catch (err) {
      setError('Failed to initialize payment. Please try again.');
      setStep('error');
    }
  };

  const pollPaymentStatus = async (paymentId: string) => {
    const maxAttempts = 30;
    const pollInterval = 2000; // 2 seconds

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const client = new CIRISClient();
        const status = await client.billing.getPurchaseStatus(paymentId);

        if (status.status === 'succeeded') {
          // Success - credits added
          setCreditsAdded(status.credits_added);
          setStep('success');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 2000);
          return;
        }

        if (status.status === 'failed' || status.status === 'canceled') {
          // Payment failed
          setError(`Payment ${status.status}. Please try again.`);
          setStep('error');
          return;
        }

        // Continue polling for processing/pending/requires_* states
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (err) {
        console.error('Error polling payment status:', err);
        // Continue polling despite errors
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    // Timeout after max attempts
    setError('Payment status unknown after 60 seconds. Please check your credit balance or contact support.');
    setStep('error');
  };

  const handlePaymentSuccess = (paymentId: string) => {
    setStep('processing');
    pollPaymentStatus(paymentId);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setStep('error');
  };

  const handleRetry = () => {
    setError(null);
    setStep('prompt');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
        {/* Prompt Step */}
        {step === 'prompt' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Continue with CIRIS</h2>
              <p className="text-gray-600 mt-2">
                {credits?.free_uses_remaining === 0
                  ? "You've used your 3 free tries! Purchase more to continue."
                  : "Purchase more uses to continue using CIRIS."}
              </p>
            </div>

            {credits?.purchase_options && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    ${(credits.purchase_options.price_minor / 100).toFixed(2)}
                  </p>
                  <p className="text-gray-700 mt-1">
                    for {credits.purchase_options.uses} uses
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={initiatePurchase}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Purchase {credits?.purchase_options?.uses || 20} uses
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Not now
              </button>
            </div>
          </div>
        )}

        {/* Payment Step */}
        {step === 'payment' && stripePromise && purchaseInfo && (
          <Elements stripe={stripePromise} options={stripeElementsOptions}>
            <PaymentForm
              purchaseInfo={purchaseInfo}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={onClose}
            />
          </Elements>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Processing payment and adding credits...</p>
            <p className="text-gray-500 text-sm mt-2">This may take a few moments</p>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✓</div>
            <h3 className="text-2xl font-bold text-green-600 mb-2">Purchase Successful!</h3>
            <p className="text-gray-700">
              {creditsAdded} {creditsAdded === 1 ? 'use' : 'uses'} added to your account
            </p>
          </div>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <div className="text-center py-8 space-y-6">
            <div className="text-6xl text-red-500">✕</div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h3>
              <p className="text-gray-600">{error}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
            <p className="text-sm text-gray-500">
              Need help? <a href="/support" className="text-blue-600 hover:underline">Contact support</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Transaction History Component
function TransactionHistory({ client }: { client: CIRISClient }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = async (offset: number = 0) => {
    try {
      setLoading(true);
      setError(null);

      const data = await client.billing.getTransactions({ limit: 20, offset });

      if (offset === 0) {
        setTransactions(data.transactions);
      } else {
        setTransactions(prev => [...prev, ...data.transactions]);
      }

      setHasMore(data.has_more);
      setTotalCount(data.total_count);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCredits = (amount: number) => {
    return Math.abs(amount);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Transaction History</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Transaction History</h2>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => loadTransactions()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
        {totalCount > 0 && (
          <span className="text-sm text-gray-600">{totalCount} total transactions</span>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <p>No transactions yet</p>
          <p className="text-sm mt-1">Your purchase and usage history will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((txn) => {
            const isCharge = txn.type === 'charge';
            const credits = formatCredits(txn.amount_minor);
            const balance = txn.balance_after;

            return (
              <div
                key={txn.transaction_id}
                className={`border rounded-lg p-4 ${
                  isCharge ? 'border-red-100 bg-red-50' : 'border-green-100 bg-green-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {txn.description}
                      </span>
                      {txn.metadata?.agent_id && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {txn.metadata.agent_id}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatDate(txn.created_at)}
                    </div>
                    {txn.external_transaction_id && (
                      <div className="text-xs text-gray-500 mt-1">
                        Payment ID: {txn.external_transaction_id.slice(0, 20)}...
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-lg font-bold ${
                        isCharge ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {isCharge ? '-' : '+'}{credits} {credits === 1 ? 'credit' : 'credits'}
                    </div>
                    <div className="text-xs text-gray-600">
                      Balance: {balance} {balance === 1 ? 'credit' : 'credits'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={() => loadTransactions(transactions.length)}
                disabled={loading}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main Billing Page
export default function BillingPage() {
  const [credits, setCredits] = useState<CreditStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [client] = useState(() => new CIRISClient());

  const loadCredits = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await client.billing.getCredits();
      setCredits(data);
    } catch (err) {
      console.error('Failed to load credits:', err);
      setError('Failed to load credit information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCredits();
  }, []);

  const handlePurchaseSuccess = () => {
    loadCredits();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-600 mt-2">Manage your CIRIS credits and purchases</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-2">⚠️</div>
            <h3 className="text-xl font-bold text-red-900 mb-2">Connection Error</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={loadCredits}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Credit Balance */}
        {!loading && !error && credits && (
          <div className="space-y-6">
            <CreditBalance
              credits={credits}
              onPurchaseClick={() => setShowPurchaseModal(true)}
            />

            {/* Usage Statistics */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Usage Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Total Uses</p>
                  <p className="text-2xl font-bold text-gray-900">{credits.total_uses}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Current Plan</p>
                  <p className="text-2xl font-bold text-gray-900">{credits.plan_name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Free Uses</p>
                  <p className="text-2xl font-bold text-gray-900">{credits.free_uses_remaining}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Paid Credits</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {credits.credits_remaining}
                  </p>
                </div>
              </div>
            </div>

            {/* Purchase Options */}
            {credits.purchase_options && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Purchase More Uses</h2>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-blue-600">
                        ${(credits.purchase_options.price_minor / 100).toFixed(2)}
                      </p>
                      <p className="text-gray-700 mt-1">
                        Get {credits.purchase_options.uses} additional uses
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPurchaseModal(true)}
                      className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
                    >
                      Purchase Now
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Transaction History */}
            <TransactionHistory client={client} />

            {/* Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 mb-2">💡 About Credits</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Each interaction with CIRIS uses one credit</li>
                <li>• Free tries are provided to new users</li>
                <li>• Purchased credits never expire</li>
                <li>• Secure payments processed by Stripe</li>
              </ul>
            </div>
          </div>
        )}

        {/* Purchase Modal */}
        <PurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          onSuccess={handlePurchaseSuccess}
          credits={credits}
        />
      </div>
    </div>
  );
}
