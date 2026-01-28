import { useState, useEffect, useRef, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { useActionID } from '../utils/useActionID.js';
import { AxiosError } from 'axios';

export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showBiometric, setShowBiometric] = useState<boolean>(false);
  const [biometricVerifying, setBiometricVerifying] = useState<boolean>(false);
  const navigate = useNavigate();
  const cameraContainerRef = useRef<HTMLDivElement>(null);
  const { initialize, startBiometric, stop, getCsid } = useActionID();

  useEffect(() => {
    // Only check on mount, not after login or during biometric verification
    // This prevents redirecting immediately after successful login or during verification
    if (authService.isAuthenticated() && !showBiometric && !biometricVerifying && !error) {
      const user = authService.getCurrentUser();
      if (user?.enrolled) {
        // Only redirect if we're not in the middle of login flow
        // Check if we just logged in by seeing if form is visible
        const formVisible = !showBiometric;
        if (formVisible) {
          // User is already logged in, redirect to home
          navigate('/home');
        }
      } else {
        navigate('/enroll');
      }
    }
  }, [navigate]); // Simplified dependencies - only navigate, prevent re-runs that cause redirects

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login for:', email);
      const response = await authService.login(email, password);
      console.log('Login response:', response);
      const user = response.user;

      if (user.enrolled) {
        // User is enrolled, show biometric verification screen
        console.log('User is enrolled, showing biometric verification');
        setLoading(false); // Stop loading so form disappears
        setShowBiometric(true);
        
        // Wait a moment for UI to update, then initialize SDK
        setTimeout(() => {
          try {
            initialize(user.id);
            console.log('SDK initialized for biometric verification');
          } catch (initError) {
            console.error('Failed to initialize SDK:', initError);
            setError('Failed to initialize biometric verification. Please try again.');
            setShowBiometric(false);
          }
        }, 100);
      } else {
        // User not enrolled, redirect to enrollment
        console.log('User not enrolled, redirecting to enrollment');
        navigate('/enroll');
      }
    } catch (err) {
      console.error('Login error:', err);
      const error = err as AxiosError<{ error: string }>;
      setError(error.response?.data?.error || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleBiometricVerification = async () => {
    if (!cameraContainerRef.current) {
      setError('Camera container not ready. Please refresh the page.');
      return;
    }

    setBiometricVerifying(true);
    setError('');

    try {
      console.log('Starting biometric verification');
      
      // Ensure container has ID
      const containerId = cameraContainerRef.current.id || 'camera-container';
      if (!cameraContainerRef.current.id) {
        cameraContainerRef.current.id = containerId;
      }

      // Wait a moment to ensure container is fully rendered and visible
      await new Promise(resolve => setTimeout(resolve, 300));

      // Start biometric session - this will show the camera
      console.log('Starting camera in container:', containerId);
      startBiometric(containerId, {
        actionID: 'login',
        opacity: 1,
      });

      console.log('Biometric session started, camera should be visible now');
      
      // Wait for camera to initialize and start capturing
      // The SDK sends biometric frames every 2 seconds (frequency: 2000)
      // We need to wait long enough for the SDK to capture and process multiple frames
      // Minimum: 10-15 seconds to ensure enough biometric data is captured
      let captureAttempts = 0;
      const maxAttempts = 30; // 15 seconds total (30 * 500ms) - allows SDK to capture ~7-8 frames
      let validCaptureCount = 0;
      const requiredValidCaptures = 20; // Need 10 seconds of continuous valid capture (20 * 500ms)
      
      const checkCapture = setInterval(async () => {
        captureAttempts++;
        
        // Check if video element exists and is playing
        const container = cameraContainerRef.current;
        if (!container) {
          clearInterval(checkCapture);
          setError('Camera container lost. Please try again.');
          stop();
          setBiometricVerifying(false);
          return;
        }

        // Look for video element inside the container
        const videoElement = container.querySelector('video') as HTMLVideoElement | null;
        const hasVideo = videoElement !== null;
        
        let isPlaying = false;
        let hasActiveStream = false;
        let hasVideoTracks = false;
        
        if (videoElement) {
          isPlaying = !videoElement.paused && !videoElement.ended && videoElement.readyState >= 2;
          
          // Check if video has an active MediaStream with video tracks
          try {
            const stream = videoElement.srcObject as MediaStream | null;
            if (stream) {
              hasActiveStream = stream.active;
              const videoTracks = stream.getVideoTracks();
              
              // Check if we have live video tracks
              const liveTracks = videoTracks.filter(track => track.readyState === 'live');
              hasVideoTracks = liveTracks.length > 0;
              
              if (hasVideoTracks) {
                const track = liveTracks[0];
                // Video track must be enabled and not muted
                hasVideoTracks = !track.muted && track.enabled;
                
                // Additional check: verify track has actual video capabilities
                // If camera is covered, track might exist but not produce meaningful frames
                const settings = track.getSettings();
                const capabilities = track.getCapabilities();
                
                // Check if track has reasonable video dimensions (not 0x0)
                if (settings.width && settings.height) {
                  hasVideoTracks = settings.width > 0 && settings.height > 0;
                }
                
                // Check if video element has actual dimensions (not 0x0)
                if (hasVideoTracks && videoElement.videoWidth && videoElement.videoHeight) {
                  hasVideoTracks = videoElement.videoWidth > 0 && videoElement.videoHeight > 0;
                }
              }
            }
          } catch (e) {
            console.warn('Error checking video stream:', e);
            hasVideoTracks = false;
          }
        }

        const isValidCapture = hasVideo && isPlaying && hasActiveStream && hasVideoTracks;
        
        if (isValidCapture) {
          validCaptureCount++;
        } else {
          // Reset counter if capture becomes invalid
          validCaptureCount = 0;
        }

        console.log(`Capture check ${captureAttempts}/${maxAttempts}: hasVideo=${hasVideo}, isPlaying=${isPlaying}, hasActiveStream=${hasActiveStream}, hasVideoTracks=${hasVideoTracks}, validCount=${validCaptureCount}/${requiredValidCaptures}`);

        // If we've waited too long without valid capture, fail
        if (captureAttempts >= maxAttempts && validCaptureCount < requiredValidCaptures) {
          clearInterval(checkCapture);
          setError('Camera is not capturing video properly. Please ensure camera is uncovered, has proper lighting, and your face is visible, then try again.');
          stop();
          setBiometricVerifying(false);
          return;
        }
        
        // If capture becomes invalid after we started counting, reset
        // This ensures we need continuous valid capture, not just intermittent
        if (validCaptureCount > 0 && !isValidCapture) {
          console.warn('Capture became invalid, resetting counter');
          validCaptureCount = 0;
        }

        // If we have enough valid captures, proceed with verification
        if (validCaptureCount >= requiredValidCaptures) {
          clearInterval(checkCapture);
          
          // Final validation: ensure video is still valid and has actual content
          if (!hasVideo || !isPlaying || !hasActiveStream || !hasVideoTracks) {
            setError('Camera stopped capturing. Please try again.');
            stop();
            setBiometricVerifying(false);
            return;
          }
          
          // Additional final check: verify video element has actual dimensions
          if (videoElement && (!videoElement.videoWidth || !videoElement.videoHeight || 
              videoElement.videoWidth === 0 || videoElement.videoHeight === 0)) {
            setError('Camera is not producing video. Please ensure camera is uncovered and try again.');
            stop();
            setBiometricVerifying(false);
            return;
          }
          
          // Check video track settings one more time
          try {
            const stream = videoElement!.srcObject as MediaStream | null;
            if (stream) {
              const tracks = stream.getVideoTracks();
              const liveTrack = tracks.find(t => t.readyState === 'live');
              if (!liveTrack || liveTrack.muted || !liveTrack.enabled) {
                setError('Camera track is not active. Please ensure camera is uncovered and try again.');
                stop();
                setBiometricVerifying(false);
                return;
              }
              
              // CRITICAL: Check if video has actual content (not just black frames)
              // We'll sample a few frames to see if they have meaningful content
              const canvas = document.createElement('canvas');
              canvas.width = videoElement!.videoWidth;
              canvas.height = videoElement!.videoHeight;
              const ctx = canvas.getContext('2d');
              
              if (ctx && videoElement!.videoWidth > 0 && videoElement!.videoHeight > 0) {
                // Draw current video frame to canvas
                ctx.drawImage(videoElement!, 0, 0, canvas.width, canvas.height);
                
                // Get image data and check if it's mostly black (covered camera)
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                let nonBlackPixels = 0;
                const sampleSize = Math.min(data.length, 10000); // Sample first 10k pixels for performance
                
                // Check if pixels have meaningful color (not all black/dark)
                for (let i = 0; i < sampleSize; i += 4) {
                  const r = data[i];
                  const g = data[i + 1];
                  const b = data[i + 2];
                  // Consider pixel non-black if any RGB value is > 30 (not pure black/dark)
                  if (r > 30 || g > 30 || b > 30) {
                    nonBlackPixels++;
                  }
                }
                
                const nonBlackRatio = nonBlackPixels / (sampleSize / 4);
                console.log(`Video content check: ${nonBlackPixels} non-black pixels out of ${sampleSize / 4} sampled (${(nonBlackRatio * 100).toFixed(1)}%)`);
                
                // If less than 5% of pixels are non-black, likely camera is covered or showing black
                if (nonBlackRatio < 0.05) {
                  setError('Camera appears to be covered or not capturing properly. Please ensure camera is uncovered and your face is visible, then try again.');
                  stop();
                  setBiometricVerifying(false);
                  return;
                }
              }
            }
          } catch (e) {
            console.warn('Final video validation error:', e);
            setError('Unable to validate camera stream. Please try again.');
            stop();
            setBiometricVerifying(false);
            return;
          }

          try {
            const csid = getCsid();
            if (!csid) {
              setError('Session ID not found. Please try again.');
              stop();
              setBiometricVerifying(false);
              return;
            }
            
            console.log('Video confirmed capturing with active stream, verifying biometric with CSID:', csid);
            
            // Stop SDK before verifying to prevent ongoing requests
            stop();
            
            // Send videoValidated: true to indicate frontend confirmed camera is working
            const response = await authService.verifyBiometric(csid, 'login', true);
            console.log('Biometric verification response:', response);

            if (response.verified) {
              console.log('Biometric verification successful, navigating to home');
              navigate('/home');
            } else {
              const errorMsg = response.error || response.message || 'Biometric verification failed. Please try again.';
              setError(errorMsg);
              setBiometricVerifying(false);
              // Keep showBiometric true so user stays on biometric screen
            }
          } catch (err) {
            console.error('Biometric verification error:', err);
            const error = err as AxiosError<{ error: string; details?: string }>;
            const errorMessage = error.response?.data?.error || 'Biometric verification failed.';
            const errorDetails = error.response?.data?.details;
            const fullError = errorDetails ? `${errorMessage} ${errorDetails}` : errorMessage;
            
            console.error('Full error:', fullError);
            console.error('Error status:', error.response?.status);
            
            setError(fullError);
            setBiometricVerifying(false);
            // Keep showBiometric true so user stays on biometric screen and can see the error
            // Don't navigate away - let user see the error and try again
          }
        }
      }, 500); // Check every 500ms
    } catch (err) {
      console.error('Error starting biometric verification:', err);
      setError('Failed to start biometric verification. Please try again.');
      setBiometricVerifying(false);
    }
  };

  const handleCancelBiometric = () => {
    stop();
    setShowBiometric(false);
    setBiometricVerifying(false);
    setError(''); // Clear any errors when canceling
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>

        {!showBiometric ? (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/register"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Don't have an account? Register
              </Link>
            </div>
          </form>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                {biometricVerifying 
                  ? 'Please look at the camera for biometric verification'
                  : 'Click the button below to start biometric verification. You\'ll need to allow camera access.'}
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
                onClick={handleBiometricVerification}
                disabled={biometricVerifying}
                className="flex-1 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {biometricVerifying ? 'Verifying...' : 'Start Biometric Verification'}
              </button>
              <button
                onClick={handleCancelBiometric}
                disabled={biometricVerifying}
                className="flex-1 py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
