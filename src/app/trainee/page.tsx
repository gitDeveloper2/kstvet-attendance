'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Attendance, Session } from '@/types';
import QrScanner from '@/components/QrScanner';
import LogoutButton from '@/components/LogoutButton';
import Link from 'next/link';

export default function TraineeDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [scanResult, setScanResult] = useState<any>(null);
  const [manualCode, setManualCode] = useState('');
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      if (user.role === 'trainer') {
        setLoadingAttendance(false);
        router.push('/trainer');
        return;
      }

      if (user.role !== 'trainee') {
        setLoadingAttendance(false);
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'trainee') {
      fetchAttendance();
      getUserLocation();
    }
  }, [user]);

  const fetchAttendance = async () => {
    if (!user?.id) {
      setLoadingAttendance(false);
      return;
    }

    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        session:sessions(*, location:locations(*))
      `)
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching attendance:', error);
    } else {
      setAttendance(data || []);
    }
    setLoadingAttendance(false);
  };

  const getUserLocation = () => {
    if (typeof window !== 'undefined') {
      const insecure = !window.isSecureContext && window.location.hostname !== 'localhost';
      if (insecure) {
        setError(
          'Location requires HTTPS on mobile browsers. Open the app using HTTPS (or test on localhost) then try again.'
        );
        return;
      }
    }

    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (geoError) => {
        console.error('Error getting location:', geoError);
        const code = (geoError as any)?.code;
        if (code === 1) {
          setError('Location permission denied. Allow location access for this site in your browser settings.');
          return;
        }
        if (code === 2) {
          setError('Location unavailable. Make sure GPS is on and you have a good signal, then try again.');
          return;
        }
        if (code === 3) {
          setError('Location request timed out. Try again or move to an area with a better signal.');
          return;
        }
        setError('Unable to get your location. Please enable location services and try again.');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handleScan = async (result: string) => {
    if (result) {
      try {
        const parsedData = JSON.parse(result);
        setScanResult(parsedData);
        setShowScanner(false);
        await markAttendance(parsedData);
      } catch (err) {
        setError('Invalid QR code format');
      }
    }
  };

  const handleScanError = (error: Error) => {
    console.error(error);
    setError('Camera error. Please try again.');
    setShowScanner(false);
  };

  const handleManualSubmit = async () => {
    const token = manualCode.trim();
    if (!token) {
      setError('Enter a session code');
      return;
    }
    await markAttendance({ token });
  };

  const markAttendance = async (qrData: any) => {
    if (!user?.id) {
      setError('You must be signed in to mark attendance');
      return;
    }

    setMarkingAttendance(true);
    setError('');
    setSuccess('');

    try {
      // First, verify the QR token and get session details
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          *,
          location:locations(*)
        `)
        .eq('qr_token', qrData.token)
        .eq('is_active', true)
        .single();

      if (sessionError || !session) {
        throw new Error('Invalid or inactive session');
      }

      // Check if user has already marked attendance for this session
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_id', (session as any).id)
        .single();

      if (existingAttendance) {
        throw new Error('Attendance already marked for this session');
      }

      // Verify GPS location only when session has a configured location_id
      if ((session as any).location_id) {
        if (!userLocation) {
          throw new Error('Location is required to mark attendance for this session');
        }

        const { data: isWithinRadius, error: locationError } = await supabase
          .rpc('is_within_location_radius' as any, {
            user_lat: userLocation.lat,
            user_lon: userLocation.lng,
            location_id: (session as any).location_id,
          } as any);

        if (locationError) {
          throw new Error('Error verifying location');
        }

        if (!isWithinRadius) {
          throw new Error('You are not within the required location radius');
        }
      }

      // Mark attendance
      const { error: attendanceError } = await supabase
        .from('attendance')
        .insert({
          user_id: user.id,
          session_id: (session as any).id,
          latitude: userLocation?.lat ?? 0,
          longitude: userLocation?.lng ?? 0,
          verified: true,
        } as any);

      if (attendanceError) {
        throw new Error(attendanceError.message);
      }

      setSuccess(`Attendance marked successfully for ${(session as any).title}`);
      fetchAttendance();
      setScanResult(null);
    } catch (err: any) {
      setError(err.message || 'Failed to mark attendance');
    } finally {
      setMarkingAttendance(false);
    }
  };

  if (loading || loadingAttendance) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'trainee') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/trainee" className="flex items-center gap-3">
                <span className="sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-md bg-indigo-600 text-white font-semibold">
                  K
                </span>
                <span className="hidden sm:inline text-xl font-semibold text-gray-900">KAS</span>
                <span className="hidden sm:inline text-sm text-gray-500">Trainee</span>
              </Link>
            </div>
            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
              <span className="text-gray-700 text-sm sm:text-base">Welcome, {user.name}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Mark Attendance</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-4">
                {success}
              </div>
            )}

            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {userLocation 
                    ? `Your location: ${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}`
                    : 'Getting your location...'}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Enter Session Code</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="e.g. copy from trainer"
                    className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <button
                    onClick={handleManualSubmit}
                    disabled={markingAttendance}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 w-full sm:w-auto"
                    type="button"
                  >
                    Submit
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  If QR scanning fails, ask the trainer for the session code/token and type it here.
                </p>
              </div>

              {!showScanner ? (
                <button
                  onClick={() => setShowScanner(true)}
                  disabled={!userLocation || markingAttendance}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {markingAttendance ? 'Processing...' : 'Scan QR Code'}
                </button>
              ) : (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Scan QR Code</h3>
                  <div className="mb-4" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
                    <QrScanner
                      onDecode={handleScan}
                      onError={handleScanError}
                    />
                  </div>
                  <button
                    onClick={() => setShowScanner(false)}
                    className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Attendance History</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {attendance.length === 0 ? (
                  <li className="px-6 py-4 text-center text-gray-500">
                    No attendance records found.
                  </li>
                ) : (
                  attendance.map((record) => (
                    <li key={record.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-indigo-600">
                            {record.session?.title || 'Unknown Session'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(record.timestamp).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            Location: {record.session?.location?.name || 'Unknown'}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            record.verified 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {record.verified ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
