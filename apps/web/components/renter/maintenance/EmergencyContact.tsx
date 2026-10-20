'use client';

import { motion } from 'framer-motion';
import { Phone, Mail, AlertTriangle, Clock, User, MessageCircle } from 'lucide-react';
import { Button } from '@getrentos/ui';

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
      className="bg-card rounded-xl border border-border overflow-hidden"
    >
      <div className="border-b border-destructive/20 bg-destructive-subtle p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <div>
            <h3 className="font-semibold text-destructive">Emergency Contacts</h3>
            <p className="text-xs text-destructive/80">
              For urgent issues requiring immediate attention
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-border">
        {contacts.map((contact) => (
          <div key={contact.id} className="p-4 hover:bg-secondary transition-colors">
            <div className="flex flex-wrap items-start gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-foreground">{contact.name}</h4>
                <p className="text-sm text-muted-foreground">{contact.role}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
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

      <div className="p-3 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          For life-threatening emergencies, please call 112 (Nigeria&apos;s emergency number) or
          your local emergency services immediately.
        </p>
      </div>
    </motion.div>
  );
};
