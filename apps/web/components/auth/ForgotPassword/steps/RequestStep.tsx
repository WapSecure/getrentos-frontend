'use client';

import { useState } from 'react';
import { Mail, Phone, MessageCircle, CheckCircle, XCircle } from 'lucide-react';
import { VALIDATION_PATTERNS } from '@/lib/constants/auth';
import { Input } from '@getrentos/ui';

interface RequestStepProps {
  method: 'email' | 'phone' | 'whatsapp';
  setMethod: (method: 'email' | 'phone' | 'whatsapp') => void;
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

  return (
    <div className="space-y-6">
      <div className="flex gap-2 p-1 bg-secondary rounded-xl">
        <button
          type="button"
          aria-pressed={method === 'email'}
          onClick={() => {
            setMethod('email');
            setIdentifier('');
            setError('');
            setTouched(false);
          }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            method === 'email'
              ? 'bg-card text-primary shadow-sm'
              : 'text-muted-foreground'
          }`}
        >
          <Mail className="w-4 h-4 inline mr-2" />
          Email
        </button>
        <button
          type="button"
          aria-pressed={method === 'phone'}
          onClick={() => {
            setMethod('phone');
            setIdentifier('');
            setError('');
            setTouched(false);
          }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            method === 'phone'
              ? 'bg-card text-primary shadow-sm'
              : 'text-muted-foreground'
          }`}
        >
          <Phone className="w-4 h-4 inline mr-2" />
          Phone
        </button>
        <button
          type="button"
          aria-pressed={method === 'whatsapp'}
          onClick={() => {
            setMethod('whatsapp');
            setIdentifier('');
            setError('');
            setTouched(false);
          }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            method === 'whatsapp'
              ? 'bg-card text-primary shadow-sm'
              : 'text-muted-foreground'
          }`}
        >
          <MessageCircle className="w-4 h-4 inline mr-2" />
          WhatsApp
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {method === 'email' ? 'Email Address' : 'Phone Number'}
        </label>
        <div className="relative">
          <Input
            type={method === 'email' ? 'email' : 'tel'}
            value={identifier}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            className={touched && error ? 'border-destructive' : undefined}
            inputClassName="py-3"
            placeholder={method === 'email' ? 'you@example.com' : '+234 801 234 5678'}
          />
          {touched && !error && identifier && (
            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
          )}
          {touched && error && (
            <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-destructive" />
          )}
        </div>
        {touched && error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
};
