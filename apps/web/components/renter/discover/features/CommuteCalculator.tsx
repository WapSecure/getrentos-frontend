'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Car, Bus, Train, Clock, Navigation, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CommuteCalculatorProps {
  propertyLocation: string;
  propertyCoordinates?: { lat: number; lng: number };
}

export const CommuteCalculator = ({ propertyLocation }: CommuteCalculatorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [destination, setDestination] = useState('');
  const [mode, setMode] = useState<'driving' | 'transit' | 'walking'>('driving');
  const [commuteTime, setCommuteTime] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    if (!destination) return;

    setIsCalculating(true);
    // Simulate API call to maps service
    setTimeout(() => {
      // Mock commute time based on mode
      const times = { driving: 25, transit: 45, walking: 120 };
      setCommuteTime(times[mode]);
      setIsCalculating(false);
    }, 1000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#c4a747] transition-colors"
      >
        <Navigation className="w-3 h-3" />
        Calculate commute
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#1a2a2f] rounded-xl max-w-md w-full mx-4 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-white">Commute Calculator</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  From this property
                </label>
                <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-white/5 rounded-lg">
                  <MapPin className="w-4 h-4 text-[#c4a747]" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {propertyLocation}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  To (work/school)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Enter address"
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mode of transport
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode('driving')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors ${
                      mode === 'driving'
                        ? 'bg-[#c4a747] text-white'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    Driving
                  </button>
                  <button
                    onClick={() => setMode('transit')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors ${
                      mode === 'transit'
                        ? 'bg-[#c4a747] text-white'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Bus className="w-4 h-4" />
                    Transit
                  </button>
                  <button
                    onClick={() => setMode('walking')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors ${
                      mode === 'walking'
                        ? 'bg-[#c4a747] text-white'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'
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
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
