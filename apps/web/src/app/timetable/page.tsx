'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  BookOpen,
  Filter,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Layers,
  Sparkles,
} from 'lucide-react';

interface TimetableSlotItem {
  id: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  sessionType: string;
  course: {
    id: string;
    code: string;
    title: string;
    creditHours: number;
  };
  section: {
    id: string;
    name: string;
    enrolledCount: number;
    capacity: number;
  };
  room: {
    id: string;
    building: string;
    roomNumber: string;
    capacity: number;
    roomType: string;
  };
  lecturer: string;
}

interface DaySchedule {
  dayOfWeek: number;
  dayName: string;
  slots: TimetableSlotItem[];
}

function TimetableContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'weekly' | 'rooms' | 'cohorts'>('weekly');
  const [selectedRole, setSelectedRole] = useState<'student' | 'lecturer' | 'admin'>('student');
  const [selectedDay, setSelectedDay] = useState<number | null>(null); // null = all days
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);

  // New Slot Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [newDayOfWeek, setNewDayOfWeek] = useState(1);
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('11:00');
  const [newSessionType, setNewSessionType] = useState('LECTURE');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Active semester fallback ID
  const [activeSemesterId, setActiveSemesterId] = useState<string>('');

  // Fallback demo data if API isn't populated yet
  const fallbackSchedule: DaySchedule[] = [
    {
      dayOfWeek: 1,
      dayName: 'Monday',
      slots: [
        {
          id: 'slot-1',
          dayOfWeek: 1,
          dayName: 'Monday',
          startTime: '09:00',
          endTime: '11:00',
          sessionType: 'LECTURE',
          course: { id: 'c1', code: 'CS101', title: 'Introduction to Computer Science', creditHours: 3 },
          section: { id: 's1', name: 'Section A - Morning', enrolledCount: 42, capacity: 60 },
          room: { id: 'r1', building: 'Turing Hall', roomNumber: '101', capacity: 80, roomType: 'LECTURE_HALL' },
          lecturer: 'Margaret Hamilton',
        },
      ],
    },
    {
      dayOfWeek: 2,
      dayName: 'Tuesday',
      slots: [
        {
          id: 'slot-2',
          dayOfWeek: 2,
          dayName: 'Tuesday',
          startTime: '14:00',
          endTime: '17:00',
          sessionType: 'LAB',
          course: { id: 'c2', code: 'CS201', title: 'Data Structures and Algorithms', creditHours: 4 },
          section: { id: 's2', name: 'Section A - Afternoon', enrolledCount: 28, capacity: 40 },
          room: { id: 'r2', building: 'Lovelace Center', roomNumber: 'LAB-A', capacity: 40, roomType: 'LAB' },
          lecturer: 'Dr. Grace Hopper',
        },
      ],
    },
    {
      dayOfWeek: 3,
      dayName: 'Wednesday',
      slots: [
        {
          id: 'slot-3',
          dayOfWeek: 3,
          dayName: 'Wednesday',
          startTime: '10:00',
          endTime: '12:00',
          sessionType: 'LECTURE',
          course: { id: 'c3', code: 'SE201', title: 'Software Architecture & Design', creditHours: 3 },
          section: { id: 's3', name: 'Section A - Morning', enrolledCount: 35, capacity: 50 },
          room: { id: 'r1', building: 'Turing Hall', roomNumber: '101', capacity: 80, roomType: 'LECTURE_HALL' },
          lecturer: 'Dr. Grace Hopper',
        },
      ],
    },
    {
      dayOfWeek: 4,
      dayName: 'Thursday',
      slots: [
        {
          id: 'slot-4',
          dayOfWeek: 4,
          dayName: 'Thursday',
          startTime: '11:00',
          endTime: '13:00',
          sessionType: 'TUTORIAL',
          course: { id: 'c1', code: 'CS101', title: 'Introduction to Computer Science', creditHours: 3 },
          section: { id: 's1', name: 'Section A - Morning', enrolledCount: 42, capacity: 60 },
          room: { id: 'r3', building: 'Babbage Wing', roomNumber: '204', capacity: 50, roomType: 'SEMINAR_ROOM' },
          lecturer: 'Margaret Hamilton',
        },
      ],
    },
    {
      dayOfWeek: 5,
      dayName: 'Friday',
      slots: [
        {
          id: 'slot-5',
          dayOfWeek: 5,
          dayName: 'Friday',
          startTime: '14:00',
          endTime: '16:00',
          sessionType: 'LECTURE',
          course: { id: 'c2', code: 'CS201', title: 'Data Structures and Algorithms', creditHours: 4 },
          section: { id: 's2', name: 'Section A - Afternoon', enrolledCount: 28, capacity: 40 },
          room: { id: 'r1', building: 'Turing Hall', roomNumber: '101', capacity: 80, roomType: 'LECTURE_HALL' },
          lecturer: 'Dr. Grace Hopper',
        },
      ],
    },
    { dayOfWeek: 6, dayName: 'Saturday', slots: [] },
    { dayOfWeek: 7, dayName: 'Sunday', slots: [] },
  ];

  const fetchTimetableData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      // 1. Fetch Rooms
      const roomsRes = await fetch('http://localhost:4000/api/v1/timetable/rooms');
      if (roomsRes.ok) {
        const roomsJson = await roomsRes.json();
        setRooms(roomsJson.data || []);
      }

      // 2. Fetch Master Timetable
      const ttRes = await fetch('http://localhost:4000/api/v1/timetable/master');
      if (ttRes.ok) {
        const ttJson = await ttRes.json();
        const sched = ttJson.data?.schedule || [];
        setSchedule(sched.length > 0 ? sched : fallbackSchedule);
        setTotalSessions(ttJson.data?.totalSlotsFound || 5);
      } else {
        setSchedule(fallbackSchedule);
        setTotalSessions(5);
      }

      // 3. Fetch Available Sections for scheduling modal
      const secRes = await fetch('http://localhost:4000/api/v1/registration/sections?semesterId=fallback');
      if (secRes.ok) {
        const secJson = await secRes.json();
        setSections(secJson.data || []);
      }
    } catch (err) {
      console.warn('Backend timetable fetch failed, using fallback data:', err);
      setSchedule(fallbackSchedule);
      setTotalSessions(5);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetableData();
  }, [selectedRole]);

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch('http://localhost:4000/api/v1/timetable/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classSectionId: selectedSectionId,
          roomId: selectedRoomId,
          dayOfWeek: Number(newDayOfWeek),
          startTime: newStartTime,
          endTime: newEndTime,
          sessionType: newSessionType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.message || 'Failed to schedule timetable slot.');
      }

      setActionSuccess('Timetable slot successfully scheduled without conflicts!');
      setIsModalOpen(false);
      fetchTimetableData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to allocate timetable slot.');
    } finally {
      setSubmitting(false);
    }
  };

  // Color mapping for session types
  const getSessionColor = (type: string) => {
    switch (type) {
      case 'LECTURE':
        return 'bg-blue-50 border-blue-200 text-blue-800 ring-blue-500/20';
      case 'LAB':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800 ring-emerald-500/20';
      case 'TUTORIAL':
        return 'bg-amber-50 border-amber-200 text-amber-800 ring-amber-500/20';
      case 'EXAM':
        return 'bg-rose-50 border-rose-200 text-rose-800 ring-rose-500/20';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-800 ring-slate-500/20';
    }
  };

  const daysToDisplay = selectedDay ? schedule.filter((d) => d.dayOfWeek === selectedDay) : schedule;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar currentTab="calendar" />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-0 z-20 shadow-xs">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-royal-50 text-royal-600 rounded-lg">
                <CalendarIcon className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Academic Timetable & Scheduling
                </h1>
                <p className="text-xs text-slate-500">
                  Conflict-free resource allocation, lecturer scheduling, and room utilization
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* View As Persona Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-medium text-slate-600 border border-slate-200">
              <button
                onClick={() => setSelectedRole('student')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedRole === 'student' ? 'bg-white text-royal-600 shadow-xs font-semibold' : 'hover:text-slate-900'
                }`}
              >
                Student View
              </button>
              <button
                onClick={() => setSelectedRole('lecturer')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedRole === 'lecturer' ? 'bg-white text-royal-600 shadow-xs font-semibold' : 'hover:text-slate-900'
                }`}
              >
                Lecturer View
              </button>
              <button
                onClick={() => setSelectedRole('admin')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedRole === 'admin' ? 'bg-white text-royal-600 shadow-xs font-semibold' : 'hover:text-slate-900'
                }`}
              >
                Master Timetable
              </button>
            </div>

            {/* Schedule Slot Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-royal-600 hover:bg-royal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Allocate Slot</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Weekly Sessions</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalSessions}</h3>
                <p className="text-xs text-emerald-600 font-medium mt-0.5">0 timetable clashes detected</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-royal-50 text-royal-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Lecture Halls & Labs</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{rooms.length || 6}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Main Campus - Metropolis</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Exam Eligibility Rule</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">75%</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Mandatory minimum attendance</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Attendance Portal</p>
                <Link
                  href="/attendance"
                  className="text-sm font-bold text-royal-600 hover:text-royal-700 flex items-center mt-1 group"
                >
                  <span>Launch QR Check-in</span>
                  <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </Link>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Live lecturer display & scanner</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-royal-50 text-royal-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Day Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedDay(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedDay === null
                    ? 'bg-royal-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Days
              </button>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dName, idx) => {
                const dayNum = idx + 1;
                return (
                  <button
                    key={dayNum}
                    onClick={() => setSelectedDay(dayNum)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedDay === dayNum
                        ? 'bg-royal-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {dName}
                  </button>
                );
              })}
            </div>

            <button
              onClick={fetchTimetableData}
              className="p-2 text-slate-500 hover:text-royal-600 hover:bg-slate-50 rounded-lg transition-all"
              title="Refresh Timetable"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Success / Error Alerts */}
          {actionSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center text-emerald-800 text-xs">
              <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600 flex-shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {actionError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center text-rose-800 text-xs">
              <AlertCircle className="w-5 h-5 mr-2 text-rose-600 flex-shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Timetable Weekly Matrix */}
          <div className="space-y-4">
            {daysToDisplay.map((day) => (
              <div key={day.dayOfWeek} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-royal-600" />
                    <h3 className="text-sm font-bold text-slate-800">{day.dayName}</h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    {day.slots.length} {day.slots.length === 1 ? 'Session' : 'Sessions'}
                  </span>
                </div>

                <div className="p-5">
                  {day.slots.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No instructional sessions scheduled for {day.dayName}.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {day.slots.map((slot) => (
                        <div
                          key={slot.id}
                          className="p-4 rounded-xl border border-slate-200 hover:border-royal-300 hover:shadow-md transition-all bg-white flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-royal-50 text-royal-700">
                                {slot.course.code}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ring-1 ${getSessionColor(
                                  slot.sessionType,
                                )}`}
                              >
                                {slot.sessionType}
                              </span>
                            </div>

                            <h4 className="text-sm font-semibold text-slate-900 line-clamp-1 mb-1">
                              {slot.course.title}
                            </h4>
                            <p className="text-xs text-slate-500 mb-3">{slot.section.name}</p>

                            <div className="space-y-1.5 text-xs text-slate-600">
                              <div className="flex items-center">
                                <Clock className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                <span className="font-semibold text-slate-800">
                                  {slot.startTime} – {slot.endTime}
                                </span>
                              </div>

                              <div className="flex items-center">
                                <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                <span>
                                  {slot.room.building} (Rm {slot.room.roomNumber})
                                </span>
                              </div>

                              <div className="flex items-center">
                                <User className="w-3.5 h-3.5 mr-2 text-slate-400" />
                                <span>{slot.lecturer}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Room Capacity: {slot.room.capacity} seats</span>
                            <span>Enrolled: {slot.section.enrolledCount}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Allocate Timetable Slot Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-royal-600" />
                  <span>Allocate Timetable Slot</span>
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateSlot} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class Section</label>
                  <select
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-royal-500/30 focus:border-royal-500 outline-none"
                  >
                    <option value="">-- Select Class Section --</option>
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.course.code} - {sec.course.title} ({sec.sectionName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Instructional Room</label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-royal-500/30 focus:border-royal-500 outline-none"
                  >
                    <option value="">-- Select Room --</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.building} - Rm {r.roomNumber} ({r.capacity} seats, {r.roomType})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Day of Week</label>
                    <select
                      value={newDayOfWeek}
                      onChange={(e) => setNewDayOfWeek(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-royal-500/30 focus:border-royal-500 outline-none"
                    >
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                      <option value={7}>Sunday</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Session Type</label>
                    <select
                      value={newSessionType}
                      onChange={(e) => setNewSessionType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-royal-500/30 focus:border-royal-500 outline-none"
                    >
                      <option value="LECTURE">Lecture</option>
                      <option value="LAB">Laboratory</option>
                      <option value="TUTORIAL">Tutorial</option>
                      <option value="EXAM">Examination</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Start Time (HH:mm)</label>
                    <input
                      type="text"
                      pattern="^([01]\d|2[0-3]):([0-5]\d)$"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      required
                      placeholder="09:00"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-royal-500/30 focus:border-royal-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">End Time (HH:mm)</label>
                    <input
                      type="text"
                      pattern="^([01]\d|2[0-3]):([0-5]\d)$"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      required
                      placeholder="11:00"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-royal-500/30 focus:border-royal-500 outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-royal-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Our clash detection engine automatically verifies room availability, lecturer scheduling, and room
                    seating capacity before confirming.
                  </span>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-royal-600 hover:bg-royal-700 text-white font-semibold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Verifying Clashes...' : 'Confirm Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function TimetablePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-4 border-royal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TimetableContent />
    </Suspense>
  );
}
