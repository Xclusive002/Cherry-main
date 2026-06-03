import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export const TermsPage: React.FC = () => {
  const [terms, setTerms] = useState('');

  useEffect(() => {
    api.get('/terms/').then((res: any) => setTerms(res.terms || res.data?.terms || ''))
      .catch(() => setTerms('Failed to load terms.'));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Terms & Conditions</h1>
      <div className="prose prose-invert whitespace-pre-wrap text-sm text-text-secondary">{terms}</div>
    </div>
  );
};
