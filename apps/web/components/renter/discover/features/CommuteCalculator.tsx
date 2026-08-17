'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Car, Bus, Train, Clock, Navigation, X, AlertCircle } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { renterService } from '@/services/renterService';

interface CommuteCalculatorProps {
  listingId: string;
  propertyLocation: string;
  propertyCoordinates?: { lat: number; lng: number };
}

export const CommuteCalculator = ({ listingId, propertyLocation }: CommuteCalculatorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [destination, setDestination] = useState('');
  const [mode, setMode] = useState<'driving' | 'transit' | 'walking'>('driving');
  const [commuteTime, setCommuteTime] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    if (!destination) return;

    setIsCalculating(true);
    setError(null);
    setCommuteTime(null);

    // Uses the real Google Distance Matrix data served by the backend.
    const response = await renterService.getGeoInsights(listingId, destination);
    const insights = response.data;

    const travel = insights?.travelTimes?.modes?.[mode];
    if (travel && travel.durationSeconds > 0) {
      setCommuteTime(Math.round(travel.durationSeconds / 60));
    } else {
      setError('Travel time is not available for this destination yet.');
    }
    setIsCalculating(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors"
      >
        <Navigation className="w-3 h-3" />
        Calculate commute
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-xl max-w-md w-full mx-4 overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Commute Calculator</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  From this property
                </label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-white/5 rounded-lg">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{propertyLocation}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  To (work/school)
                </label>
                <div className="flex gap-2">
                  <LegacyInput
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Enter address"
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Mode of transport
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode('driving')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors ${
                      mode === 'driving'
                        ? 'bg-primary text-white'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    Driving
                  </button>
                  <button
                    onClick={() => setMode('transit')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors ${
                      mode === 'transit'
                        ? 'bg-primary text-white'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    <Bus className="w-4 h-4" />
                    Transit
                  </button>
                  <button
                    onClick={() => setMode('walking')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors ${
                      mode === 'walking'
                        ? 'bg-primary text-white'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    <Train className="w-4 h-4" />
                    Walking
                  </button>
                </div>
              </div>

              <Button onClick={handleCalculate} disabled={!destination || isCalculating} fullWidth>
                {isCalculating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Calculate Commute'
                )}
              </Button>

              {commuteTime && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-300">
                      Approximate commute time
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">
                    {commuteTime} minutes
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                    via{' '}
                    {mode === 'driving' ? 'car' : mode === 'transit' ? 'public transit' : 'walking'}
                  </p>
                </motion.div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">{error}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
