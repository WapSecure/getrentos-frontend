'use client';

import { motion } from 'framer-motion';
import { Phone, Mail, AlertTriangle, Clock, Building2, User, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  availableHours: string;
}

interface EmergencyContactProps {
  contacts: EmergencyContact[];
  onCall: (phone: string) => void;
  onMessage: (email: string) => void;
}

export const EmergencyContact = ({ contacts, onCall, onMessage }: EmergencyContactProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden"
    >
      <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-b border-red-200 dark:border-red-800">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300">Emergency Contacts</h3>
            <p className="text-xs text-red-700 dark:text-red-400">
              For urgent issues requiring immediate attention
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-white/10">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10">
                <User className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">{contact.name}</h4>
                <p className="text-sm text-gray-500">{contact.role}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span>{contact.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{contact.availableHours}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => onCall(contact.phone)}
                  className="gap-1"
                >
                  <Phone className="w-3 h-3" />
                  Call
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onMessage(contact.email)}
                  className="gap-1"
                >
                  <MessageCircle className="w-3 h-3" />
                  Message
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-white/10 text-center">
        <p className="text-xs text-gray-500">
          For life-threatening emergencies, please call 911 or your local emergency services
          immediately.
        </p>
      </div>
    </motion.div>
  );
};
