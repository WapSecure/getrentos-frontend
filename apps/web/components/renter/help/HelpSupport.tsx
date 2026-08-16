'use client';

import { MessageCircle, Mail, Phone, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@getrentos/ui';

export const HelpSupport = () => {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Contact Support</h3>
        <p className="text-xs text-muted-foreground mt-0.5">We&apos;re here to help</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
            <MessageCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Live Chat</p>
            <p className="text-xs text-blue-700 dark:text-blue-400">Available 24/7</p>
            <Button variant="primary" size="sm" className="mt-2">
              Start Chat
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-white/5">
          <div className="p-2 rounded-lg bg-secondary">
            <Mail className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Email Support</p>
            <p className="text-xs text-gray-500">support@getrentos.com</p>
            <p className="text-xs text-gray-500">Response within 24 hours</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-white/5">
          <div className="p-2 rounded-lg bg-secondary">
            <Phone className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Phone Support</p>
            <p className="text-xs text-gray-500">+1 (555) 123-4567</p>
            <p className="text-xs text-gray-500">Mon-Fri, 9am-6pm</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>Average response time: 2 minutes</span>
        </div>
      </div>
    </div>
  );
};
