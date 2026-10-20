'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Car, Bus, Train, Clock, Navigation } from 'lucide-react';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Field,
  Input,
  RadioGroup,
} from '@getrentos/ui';
import { renterService } from '@/services/renterService';

type CommuteMode = 'driving' | 'transit' | 'walking';

const modeOptions = [
  { value: 'driving', label: 'Driving', icon: <Car className="w-4 h-4" /> },
  { value: 'transit', label: 'Transit', icon: <Bus className="w-4 h-4" /> },
  { value: 'walking', label: 'Walking', icon: <Train className="w-4 h-4" /> },
] as const;

interface CommuteCalculatorProps {
  listingId: string;
  propertyLocation: string;
  propertyCoordinates?: { lat: number; lng: number };
}

export const CommuteCalculator = ({ listingId, propertyLocation }: CommuteCalculatorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [destination, setDestination] = useState('');
  const [mode, setMode] = useState<CommuteMode>('driving');
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
      <Button
        variant="link"
        onClick={() => setIsOpen(true)}
        className="gap-1 text-xs font-normal text-muted-foreground hover:text-primary"
      >
        <Navigation className="w-3 h-3" />
        Calculate commute
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="p-0">
          <div className="p-4 pr-12 border-b border-border">
            <DialogTitle className="font-semibold text-foreground">Commute Calculator</DialogTitle>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <p className="block text-sm font-medium text-foreground mb-1">From this property</p>
              <div className="flex items-center gap-2 p-2 bg-secondary rounded-lg">
                <MapPin className="w-4 h-4 shrink-0 text-primary" />
                <span className="min-w-0 text-sm text-muted-foreground">{propertyLocation}</span>
              </div>
            </div>

            <Field label="To (work/school)">
              <Input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Enter address"
              />
            </Field>

            <Field label="Mode of transport">
              <RadioGroup
                orientation="horizontal"
                value={mode}
                onValueChange={setMode}
                options={modeOptions}
              />
            </Field>

            <Button
              onClick={handleCalculate}
              disabled={!destination}
              isLoading={isCalculating}
              fullWidth
            >
              Calculate Commute
            </Button>

            {commuteTime && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Alert variant="success" icon={Clock} title="Approximate commute time">
                  <p className="text-2xl font-bold text-foreground">{commuteTime} minutes</p>
                  <p className="text-xs mt-1">
                    via{' '}
                    {mode === 'driving' ? 'car' : mode === 'transit' ? 'public transit' : 'walking'}
                  </p>
                </Alert>
              </motion.div>
            )}

            {error && (
              <Alert variant="warning" className="text-xs">
                {error}
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
