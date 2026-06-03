import React from 'react';
import { useLocation, Link } from 'react-router-dom';

export const PaymentsVerifyPage: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const reference = params.get('reference');
  const status = params.get('status');

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Payment verification</h1>
      <div className="glass rounded-3xl border border-white/10 bg-secondary/80 p-6 space-y-4">
        <p className="text-text-secondary">
          Paystack has redirected you back to Cherry. Your payment status is being verified and your subscription will be activated once the webhook confirms the transaction.
        </p>
        {reference && (
          <p className="text-sm text-white">
            Payment reference: <span className="font-semibold">{reference}</span>
          </p>
        )}
        {status && (
          <p className="text-sm text-text-secondary">Paystack status: {status}</p>
        )}
        <p className="text-sm text-text-secondary">
          If you do not see access immediately, refresh your profile or return to the creator page after a few moments.
        </p>
        <Link to="/" className="inline-flex rounded-3xl bg-primary px-5 py-3 text-white hover:bg-primary/90 transition">
          Return home
        </Link>
      </div>
    </div>
  );
};
