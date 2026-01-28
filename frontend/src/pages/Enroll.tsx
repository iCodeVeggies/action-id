import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { useActionID } from '../utils/useActionID.js';
import { AxiosError } from 'axios';
import { User } from '../types/index.js';

export default function Enroll() {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [enrolling, setEnrolling] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);
  const navigate = useNavigate();
  const cameraContainerRef = useRef<HTMLDivElement>(null);
  const { initialize, startBiometric, stop, getCsid } = useActionID();

  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    const user = authService.getCurrentUser();
    if (user?.enrolled) {
      navigate('/home');
      return;
    }

    // Don't initialize SDK here - wait for user to click button
    // This prevents the SDK from auto-starting/polling

    return () => {
      // Cleanup on unmount
      stop();
    };
  }, [navigate, stop]);

  const handleStartEnrollment = async () => {
    console.log('Start Enrollment button clicked');
    setError('');

    try {
      // Get user ID
      const user = authService.getCurrentUser();
      if (!user?.id) {
        setError('User not found. Please log in again.');
        return;
      }

      console.log('Initializing SDK for user:', user.id);

      // Initialize SDK only when user clicks the button
      if (!initialized) {
        try {
          initialize(user.id);
          setInitialized(true);
          console.log('SDK initialized successfully');
          // Small delay to ensure SDK is ready
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (initError) {
          console.error('SDK initialization error:', initError);
          setError(`Failed to initialize SDK: ${initError instanceof Error ? initError.message : 'Unknown error'}`);
          return;
        }
      }

      // Now show the camera container and start biometric
      setEnrolling(true);
      
      // Wait for DOM to update and container to be visible
      await new Promise(resolve => setTimeout(resolve, 100));

      // Ensure container exists and has ID
      if (!cameraContainerRef.current) {
        setError('Camera container not found. Please refresh the page.');
        setEnrolling(false);
        return;
      }

      const containerId = cameraContainerRef.current.id || 'camera-container';
      if (!cameraContainerRef.current.id) {
        cameraContainerRef.current.id = containerId;
      }

      console.log('Starting biometric session with container:', containerId);

      // Start biometric session for enrollment
      startBiometric(containerId, {
        actionID: 'enrollment',
        opacity: 1,
      });

      console.log('Biometric session started');
      
      // Note: The SDK will handle biometric capture automatically
      // User should wait a few seconds for capture, then click "Complete Enrollment"
    } catch (err) {
      console.error('Error starting enrollment:', err);
      setError(`Failed to start enrollment: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setEnrolling(false);
      setInitialized(false);
    }
  };

  const handleCompleteEnrollment = async () => {
    setLoading(true);
    setError('');

    try {
      const csid = getCsid();
      if (!csid) {
        setError('Session ID not found. Please try starting enrollment again.');
        setLoading(false);
        return;
      }

      console.log('Completing enrollment with CSID:', csid);
      
      // Stop SDK first to prevent any ongoing requests/polling
      stop();
      
      const response = await authService.completeEnrollment(csid);
      console.log('Enrollment response:', response);

      if (response.enrolled) {
        console.log('Enrollment successful, navigating to home');
        navigate('/home');
      } else {
        setError('Enrollment failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Enrollment completion error:', err);
      const error = err as AxiosError<{ error: string; details?: string }>;
      
      // Stop SDK to prevent repeated requests
      stop();
      
      // Check if backend marked user as enrolled despite API error
      const errorDetails = error.response?.data?.details || '';
      if (error.response?.status === 500) {
        console.log('API error occurred, checking if user was enrolled locally...');
        // Wait a moment for backend to process
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          const profile = await authService.getProfile();
          if (profile.user.enrolled) {
            console.log('User marked as enrolled locally, navigating to home');
            navigate('/home');
            return;
          }
        } catch (profileErr) {
          console.error('Profile check error:', profileErr);
        }
      }
      
      setError(error.response?.data?.error || 'Enrollment failed. Please try again.');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    stop();
    setEnrolling(false);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Biometric Enrollment
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Complete your biometric enrollment to enable secure authentication
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {!enrolling ? (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Click the button below to start your biometric enrollment. You'll need to allow camera access.
              </p>
              <button
                onClick={handleStartEnrollment}
                className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Start Enrollment
              </button>
            </div>
          ) : (
            <>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Please look at the camera. Keep your face centered and visible.
                </p>
              </div>

              <div
                id="camera-container"
                ref={cameraContainerRef}
                className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden"
                style={{ minHeight: '256px' }}
              />

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={handleCompleteEnrollment}
                  disabled={loading}
                  className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Completing...' : 'Complete Enrollment'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
