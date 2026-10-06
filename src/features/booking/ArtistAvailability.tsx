import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api';
import { Calendar, Clock, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

interface AvailabilitySlot {
  id?: number;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string; // HH:mm
  end_time: string; // HH:mm
}

const DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export const ArtistAvailability = () => {
  const queryClient = useQueryClient();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

  const { data: existingSlots, isLoading } = useQuery({
    queryKey: ['artist-availability'],
    queryFn: async () => {
      const response = await api.get('/artist/availability');
      return response as AvailabilitySlot[];
    }
  });

  // Sync state with fetched data
  React.useEffect(() => {
    if (existingSlots) {
      setSlots(existingSlots);
    }
  }, [existingSlots]);

  const updateAvailabilityMutation = useMutation({
    mutationFn: async (newSlots: AvailabilitySlot[]) => {
      return await api.post('/artist/availability', { slots: newSlots });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artist-availability'] });
      toast.success('Availability updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update availability');
    }
  });

  const addSlot = (dayIndex: number) => {
    const newSlot: AvailabilitySlot = {
      day_of_week: dayIndex,
      start_time: '09:00',
      end_time: '17:00'
    };
    setSlots(prev => [...prev, newSlot]);
  };

  const removeSlot = (index: number) => {
    setSlots(prev => {
      const newSlots = [...prev];
      newSlots.splice(index, 1);
      return newSlots;
    });
  };

  const updateSlot = (index: number, field: keyof AvailabilitySlot, value: any) => {
    setSlots(prev => {
      const newSlots = [...prev];
      newSlots[index] = { ...newSlots[index], [field]: value };
      return newSlots;
    });
  };

  const handleSave = () => {
    // Basic validation: end time must be after start time
    const isValid = slots.every(slot => {
      const start = parseInt(slot.start_time.replace(':', ''));
      const end = parseInt(slot.end_time.replace(':', ''));
      return end > start;
    });

    if (!isValid) {
      toast.error('End time must be after start time for all slots');
      return;
    }

    updateAvailabilityMutation.mutate(slots);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-6 bg-zinc-900/50 border border-white/5 rounded-[32px]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Manage Availability</h2>
          <p className="text-zinc-400 mt-1">Set your weekly recurring available time slots for bookings.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={updateAvailabilityMutation.isPending}
          className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          <Save size={20} />
          {updateAvailabilityMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid gap-6">
        {DAYS.map((day, dayIndex) => {
          const daySlots = slots.filter(s => s.day_of_week === dayIndex);

          return (
            <div key={day} className="p-6 bg-black/40 border border-white/5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Calendar size={20} className="text-zinc-500" />
                  <h3 className="text-xl font-bold">{day}</h3>
                </div>
                <button
                  onClick={() => addSlot(dayIndex)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {daySlots.length === 0 ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-zinc-500 italic text-sm"
                    >
                      No availability set for this day.
                    </motion.p>
                  ) : (
                    daySlots.map((slot, idx) => {
                      const globalIndex = slots.findIndex(s => s === slot);
                      return (
                        <motion.div
                          key={`${dayIndex}-${idx}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <Clock size={16} className="text-zinc-500" />
                            <input
                              type="time"
                              value={slot.start_time}
                              onChange={(e) => updateSlot(globalIndex, 'start_time', e.target.value)}
                              className="bg-transparent border-none focus:ring-0 text-white text-sm"
                            />
                            <span className="text-zinc-500">to</span>
                            <input
                              type="time"
                              value={slot.end_time}
                              onChange={(e) => updateSlot(globalIndex, 'end_time', e.target.value)}
                              className="bg-transparent border-none focus:ring-0 text-white text-sm"
                            />
                          </div>
                          <button
                            onClick={() => removeSlot(globalIndex)}
                            className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex gap-3">
        <AlertCircle className="text-blue-500 shrink-0" size={20} />
        <p className="text-sm text-blue-200/80">
          These slots will be used to generate available booking times for fans. 
          Bookings can only be made within these recurring windows.
        </p>
      </div>
    </div>
  );
};
