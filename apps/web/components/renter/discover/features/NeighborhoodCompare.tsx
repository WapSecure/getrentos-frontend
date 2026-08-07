'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GitCompare, MapPin, X } from 'lucide-react';

interface Neighborhood {
  name: string;
  avgRent: number;
  safetyScore: number;
  transitScore: number;
  schoolScore: number;
  amenities: string[];
}

const neighborhoods: Neighborhood[] = [
  {
    name: 'Ikeja',
    avgRent: 250000,
    safetyScore: 85,
    transitScore: 90,
    schoolScore: 88,
    amenities: ['Malls', 'Restaurants', 'Parks', 'Schools'],
  },
  {
    name: 'Lekki Phase 1',
    avgRent: 450000,
    safetyScore: 90,
    transitScore: 75,
    schoolScore: 92,
    amenities: ['Beach', 'Malls', 'Restaurants', 'Schools'],
  },
  {
    name: 'Victoria Island',
    avgRent: 600000,
    safetyScore: 92,
    transitScore: 80,
    schoolScore: 90,
    amenities: ['Business District', 'Malls', 'Restaurants', 'Nightlife'],
  },
  {
    name: 'Surulere',
    avgRent: 180000,
    safetyScore: 75,
    transitScore: 85,
    schoolScore: 75,
    amenities: ['Markets', 'Restaurants', 'Stadium'],
  },
];

export const NeighborhoodCompare = () => {
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (name: string) => {
    if (selectedNeighborhoods.includes(name)) {
      setSelectedNeighborhoods(selectedNeighborhoods.filter((n) => n !== name));
    } else if (selectedNeighborhoods.length < 3) {
      setSelectedNeighborhoods([...selectedNeighborhoods, name]);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    return 'text-red-600';
  };

  const getScoreBar = (score: number) => {
    return (
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full bg-[#c4a747] rounded-full" style={{ width: `${score}%` }} />
      </div>
    );
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#c4a747] transition-colors"
      >
        <GitCompare className="w-3 h-3" />
        Compare neighborhoods
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#1a2a2f] rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white dark:bg-[#1a2a2f] p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Compare Neighborhoods
                </h3>
                <p className="text-xs text-gray-500">Select up to 3 neighborhoods to compare</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {/* Selection Buttons */}
              <div className="flex flex-wrap gap-2 mb-6">
                {neighborhoods.map((neighborhood) => (
                  <button
                    key={neighborhood.name}
                    onClick={() => handleSelect(neighborhood.name)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedNeighborhoods.includes(neighborhood.name)
                        ? 'bg-[#c4a747] text-white'
                        : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    } ${!selectedNeighborhoods.includes(neighborhood.name) && selectedNeighborhoods.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={
                      !selectedNeighborhoods.includes(neighborhood.name) &&
                      selectedNeighborhoods.length >= 3
                    }
                  >
                    {neighborhood.name}
                  </button>
                ))}
              </div>

              {selectedNeighborhoods.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Select neighborhoods to compare</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-white/10">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                          Feature
                        </th>
                        {selectedNeighborhoods.map((name) => (
                          <th key={name} className="text-left py-3 px-4 min-w-[150px]">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {name}
                              </span>
                              <button
                                onClick={() =>
                                  setSelectedNeighborhoods(
                                    selectedNeighborhoods.filter((n) => n !== name)
                                  )
                                }
                                className="text-gray-400 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                      {selectedNeighborhoods.map((name) => {
                        const neighborhood = neighborhoods.find((n) => n.name === name);
                        if (!neighborhood) return null;
                        return (
                          <tr key={name}>
                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                              Average Rent
                            </td>
                            <td className="py-3 px-4 font-medium text-[#c4a747]">
                              {formatCurrency(neighborhood.avgRent)}/mo
                            </td>
                          </tr>
                        );
                      })}

                      <tr>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          Safety Score
                        </td>
                        {selectedNeighborhoods.map((name) => {
                          const neighborhood = neighborhoods.find((n) => n.name === name);
                          return (
                            <td key={name} className="py-3 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-sm font-semibold ${getScoreColor(neighborhood?.safetyScore || 0)}`}
                                  >
                                    {neighborhood?.safetyScore}
                                  </span>
                                  <span className="text-xs text-gray-500">/100</span>
                                </div>
                                {getScoreBar(neighborhood?.safetyScore || 0)}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      <tr>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          Transit Score
                        </td>
                        {selectedNeighborhoods.map((name) => {
                          const neighborhood = neighborhoods.find((n) => n.name === name);
                          return (
                            <td key={name} className="py-3 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-sm font-semibold ${getScoreColor(neighborhood?.transitScore || 0)}`}
                                  >
                                    {neighborhood?.transitScore}
                                  </span>
                                  <span className="text-xs text-gray-500">/100</span>
                                </div>
                                {getScoreBar(neighborhood?.transitScore || 0)}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      <tr>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          School Score
                        </td>
                        {selectedNeighborhoods.map((name) => {
                          const neighborhood = neighborhoods.find((n) => n.name === name);
                          return (
                            <td key={name} className="py-3 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-sm font-semibold ${getScoreColor(neighborhood?.schoolScore || 0)}`}
                                  >
                                    {neighborhood?.schoolScore}
                                  </span>
                                  <span className="text-xs text-gray-500">/100</span>
                                </div>
                                {getScoreBar(neighborhood?.schoolScore || 0)}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      <tr>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          Amenities
                        </td>
                        {selectedNeighborhoods.map((name) => {
                          const neighborhood = neighborhoods.find((n) => n.name === name);
                          return (
                            <td key={name} className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {neighborhood?.amenities.map((amenity) => (
                                  <span
                                    key={amenity}
                                    className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-white/10 rounded-full"
                                  >
                                    {amenity}
                                  </span>
                                ))}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
