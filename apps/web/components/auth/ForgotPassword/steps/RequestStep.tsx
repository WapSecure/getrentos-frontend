'use client';

import { useState } from 'react';
import { Mail, Phone, MessageCircle, CheckCircle, XCircle } from 'lucide-react';
import { VALIDATION_PATTERNS } from '@/lib/constants/auth';
import { Field, Input, SegmentedControl, type Segment } from '@getrentos/ui';

const METHOD_SEGMENTS: Segment<'email' | 'phone' | 'whatsapp'>[] = [
  { value: 'email', label: 'Email', icon: <Mail /> },
  { value: 'phone', label: 'Phone', icon: <Phone /> },
  { value: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle /> },
];

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

  const selectMethod = (next: 'email' | 'phone' | 'whatsapp') => {
    setMethod(next);
    setIdentifier('');
    setError('');
    setTouched(false);
  };

  return (
    <div className="space-y-6">
      <SegmentedControl
        aria-label="Reset method"
        value={method}
        onValueChange={selectMethod}
        segments={METHOD_SEGMENTS}
        className="flex w-full [&>button]:flex-1"
      />

      <Field
        label={method === 'email' ? 'Email address' : 'Phone number'}
        error={touched && error ? error : undefined}
      >
        <Input
          type={method === 'email' ? 'email' : 'tel'}
          autoComplete={method === 'email' ? 'email' : 'tel'}
          value={identifier}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          inputClassName="py-3"
          placeholder={method === 'email' ? 'you@example.com' : '+234 801 234 5678'}
          trailingIcon={
            touched && !error && identifier ? (
              <CheckCircle className="w-5 h-5 text-success" aria-hidden="true" />
            ) : touched && error ? (
              <XCircle className="w-5 h-5 text-destructive" aria-hidden="true" />
            ) : undefined
          }
        />
      </Field>
    </div>
  );
};
