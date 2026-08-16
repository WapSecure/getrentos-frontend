'use client';

import { useState } from 'react';
import { Mail, Phone, CheckCircle, XCircle } from 'lucide-react';
import { VALIDATION_PATTERNS } from '@/lib/constants/auth';
import { Input } from '@getrentos/ui';

interface RequestStepProps {
  method: 'email' | 'phone';
  setMethod: (method: 'email' | 'phone') => void;
  identifier: string;
  setIdentifier: (value: string) => void;
}

export const RequestStep = ({ method, setMethod, identifier, setIdentifier }: RequestStepProps) => {
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    if (!email) return 'Email is required';
    if (!VALIDATION_PATTERNS.EMAIL.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePhone = (phone: string) => {
    if (!phone) return 'Phone number is required';
    if (!VALIDATION_PATTERNS.PHONE.test(phone))
      return 'Please enter a valid phone number (e.g., +1 234 567 8900)';
    return '';
  };

  const handleChange = (value: string) => {
    setIdentifier(value);
    setTouched(true);
    if (method === 'email') {
      setError(validateEmail(value));
    } else {
      setError(validatePhone(value));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (method === 'email') {
      setError(validateEmail(identifier));
    } else {
      setError(validatePhone(identifier));
    }
  };

  const isValid =
    method === 'email' ? validateEmail(identifier) === '' : validatePhone(identifier) === '';

  return (
    <div className="space-y-6">
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/10 rounded-xl">
        <button
          onClick={() => {
            setMethod('email');
            setIdentifier('');
            setError('');
            setTouched(false);
          }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            method === 'email'
              ? 'bg-card text-primary shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <Mail className="w-4 h-4 inline mr-2" />
          Email
        </button>
        <button
          onClick={() => {
            setMethod('phone');
            setIdentifier('');
            setError('');
            setTouched(false);
          }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            method === 'phone'
              ? 'bg-card text-primary shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <Phone className="w-4 h-4 inline mr-2" />
          Phone
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {method === 'email' ? 'Email Address' : 'Phone Number'}
        </label>
        <div className="relative">
          <Input
            type={method === 'email' ? 'email' : 'tel'}
            value={identifier}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            className={touched && error ? 'border-red-500' : undefined}
            inputClassName="py-3"
            placeholder={method === 'email' ? 'you@example.com' : '+1 234 567 8900'}
          />
          {touched && !error && identifier && (
            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
          )}
          {touched && error && (
            <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
          )}
        </div>
        {touched && error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
};
