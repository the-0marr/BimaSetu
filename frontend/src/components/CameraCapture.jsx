// frontend/src/components/CameraCapture.jsx
// Opens rear camera, captures a still frame with GPS + timestamp

import { useRef, useState, useEffect, useCallback } from 'react'

export default function CameraCapture({ onCapture }) {
  const videoRef    = useRef(null)
  const canvasRef   = useRef(null)
  const streamRef   = useRef(null)

  const [cameraActive, setCameraActive] = useState(false)
  const [preview,      setPreview]      = useState(null)  // data URL
  const [capturedBlob, setCapturedBlob] = useState(null)
  const [gps,          setGps]          = useState(null)
  const [gpsError,     setGpsError]     = useState(null)
  const [timestamp,    setTimestamp]    = useState(null)
  const [camError,     setCamError]     = useState(null)
  const [capturing,    setCapturing]    = useState(false)
  const [gpsLoading,   setGpsLoading]   = useState(false)

  // ── Stop stream on unmount ─────────────────────────────────────
  useEffect(() => {
    return () => stopCamera()
  }, [])

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  // ── Request GPS location using browser/device hardware ─────────
  const requestGPSLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported in this browser')
      setGpsLoading(false)
      return
    }

    setGpsLoading(true)
    setGpsError(null)

    const options = {
      enableHighAccuracy: true, // Forces using high-accuracy GPS hardware (device GPS)
      timeout: 10000,           // 10 seconds timeout
      maximumAge: 0             // Bypass cached values
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        }
        setGps(coords)
        setGpsError(null)
        setGpsLoading(false)
        console.log("GPS location fetched successfully via browser:", coords)
      },
      err => {
        console.error("GPS location permission or fetch failed:", err)
        let errorMsg = 'GPS unavailable. Enable location access and GPS on your device.'
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg = 'Location permission denied. Please allow location access in your browser settings.'
        } else if (err.code === err.TIMEOUT) {
          errorMsg = 'GPS lock timeout. Ensure you are outdoors or near a window for better GPS reception.'
        }
        setGpsError(errorMsg)
        setGpsLoading(false)
      },
      options
    )
  }, [])

  // ── Start rear camera + Request location permission ────────────
  const startCamera = async () => {
    setCamError(null)
    setGps(null)
    setGpsError(null)
    
    // Explicitly prompt/request GPS permission from the browser immediately
    requestGPSLocation()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
    } catch (err) {
      console.error('Camera error:', err)
      setCamError('Could not access camera. Check permissions or use the file upload below.')
    }
  }

  // ── Capture frame + GPS ────────────────────────────────────────
  const capturePhoto = useCallback(() => {
    if (capturing) return
    setCapturing(true)
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) {
      setCapturing(false)
      return
    }

    canvas.width  = video.videoWidth  || 1280
    canvas.height = video.videoHeight || 720
    canvas.getContext('2d').drawImage(video, 0, 0)

    const ts = new Date().toISOString()
    setTimestamp(ts)

    canvas.toBlob(blob => {
      if (!blob) { setCapturing(false); return }

      const finishCapture = (finalGps) => {
        const url = URL.createObjectURL(blob)
        setPreview(url)
        setCapturedBlob(blob)
        onCapture?.({ blob, timestamp: ts, ...finalGps })
        setCapturing(false)
        stopCamera()
      }

      // Use the pre-acquired GPS coordinates if available
      if (gps) {
        finishCapture(gps)
      } else {
        // Fallback: Attempt to query coordinates again using device GPS
        if (navigator.geolocation) {
          setGpsLoading(true)
          navigator.geolocation.getCurrentPosition(
            pos => {
              const g = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }
              setGps(g)
              setGpsError(null)
              setGpsLoading(false)
              finishCapture(g)
            },
            err => {
              console.error("GPS fetch during capture failed:", err)
              let errorMsg = 'GPS unavailable — location will be recorded as 0, 0'
              if (err.code === err.PERMISSION_DENIED) {
                errorMsg = 'Location permission denied. GPS recorded as 0, 0.'
              }
              setGpsError(errorMsg)
              setGpsLoading(false)
              finishCapture({ lat: 0, lng: 0, accuracy: null })
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
          )
        } else {
          setGpsError('Geolocation not supported in this browser')
          finishCapture({ lat: 0, lng: 0, accuracy: null })
        }
      }
    }, 'image/jpeg', 0.92)
  }, [onCapture, gps, capturing, requestGPSLocation])

  // ── File upload fallback ───────────────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ts  = new Date().toISOString()
    const url = URL.createObjectURL(file)
    setPreview(url)
    setCapturedBlob(file)
    setTimestamp(ts)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const g = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }
          setGps(g)
          onCapture?.({ blob: file, timestamp: ts, ...g })
        },
        () => {
          setGpsError('GPS unavailable')
          onCapture?.({ blob: file, timestamp: ts, lat: 0, lng: 0, accuracy: null })
        }
      )
    } else {
      onCapture?.({ blob: file, timestamp: ts, lat: 0, lng: 0, accuracy: null })
    }
  }

  const reset = () => {
    setPreview(null)
    setCapturedBlob(null)
    setGps(null)
    setTimestamp(null)
    setGpsError(null)
    onCapture?.(null)
  }

  return (
    <div className="space-y-4">
      {/* Camera viewfinder / preview */}
      <div className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-[#FCFAF5] border border-[#E6DCC9] ${cameraActive && !preview ? 'scan-container scan-border scan-pulse' : ''}`}>
        {!preview && (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            style={{ display: cameraActive ? 'block' : 'none' }}
          />
        )}
        {preview ? (
          <img src={preview} alt="Captured" className="w-full h-full object-cover" />
        ) : !cameraActive ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
            <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm font-semibold text-gray-500">Camera preview will appear here</p>
          </div>
        ) : null}

        {/* GPS HUD Overlay */}
        {cameraActive && !preview && (
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 max-w-[90%] pointer-events-auto">
            {gpsLoading ? (
              <div className="bg-black/75 backdrop-blur-md px-3 py-2 rounded-xl border border-amber-500/30 text-amber-300 flex items-center gap-2 text-xs font-semibold shadow-lg">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>🛰️ Acquiring GPS Lock (Device GPS)...</span>
              </div>
            ) : gps ? (
              <div className="bg-black/75 backdrop-blur-md px-3 py-2 rounded-xl border border-emerald-500/30 text-emerald-400 flex flex-col gap-0.5 text-xs font-semibold shadow-lg animate-fade-in">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>📍 GPS Lock Acquired</span>
                  {gps.accuracy && (
                    <span className="text-[10px] text-green-300 bg-green-950/60 px-1 py-0.2 rounded border border-green-800">
                      ±{Math.round(gps.accuracy)}m
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-green-300 font-mono pl-3.5">
                  {gps.lat.toFixed(6)}°, {gps.lng.toFixed(6)}°
                </div>
              </div>
            ) : gpsError ? (
              <div className="bg-black/75 backdrop-blur-md px-3 py-2 rounded-xl border border-rose-500/30 text-rose-400 flex flex-col gap-1 text-xs font-semibold shadow-lg animate-fade-in">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>⚠️ GPS Location Error</span>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); requestGPSLocation(); }}
                    className="text-[10px] text-sky-400 hover:text-sky-300 underline font-medium cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
                <div className="text-[10px] text-rose-300 font-medium pl-3.5 leading-normal max-w-xs">
                  {gpsError}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Blocking Loading Overlay during Capture */}
        {capturing && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20 text-white">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold tracking-wide text-emerald-400">Processing Photo & Securing GPS Lock...</p>
            <p className="text-[11px] text-gray-400">Using high accuracy hardware GPS</p>
          </div>
        )}

        {/* Capture button overlay */}
        {cameraActive && !preview && (
          <div className="absolute bottom-4 inset-x-0 flex justify-center">
            <button
              onClick={capturePhoto}
              disabled={capturing}
              className="w-16 h-16 rounded-full bg-white border-4 border-[#E88125] shadow-lg
                         hover:scale-105 active:scale-95 transition-transform duration-150 flex items-center justify-center"
            >
              {capturing
                ? <div className="w-6 h-6 rounded-full border-2 border-[#E88125] border-t-transparent animate-spin" />
                : <div className="w-10 h-10 rounded-full bg-[#E88125]" />}
            </button>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Metadata strip */}
      {(gps || gpsError || timestamp) && (
        <div className="bg-[#FCFAF5] border border-[#E6DCC9] rounded-xl p-3 space-y-1.5 text-xs font-mono shadow-inner">
          {timestamp && (
            <div className="flex items-center gap-2 text-gray-700">
              <span className="text-gray-400">⏱</span>
              <span>{timestamp}</span>
            </div>
          )}
          {gps && (
            <div className="flex items-center gap-2 text-gray-700">
              <span className="text-gray-400">📍</span>
              <span>{gps.lat.toFixed(6)}°, {gps.lng.toFixed(6)}°</span>
              {gps.accuracy && <span className="text-gray-500">±{Math.round(gps.accuracy)}m</span>}
            </div>
          )}
          {gpsError && (
            <div className="flex items-center gap-2 text-amber-800">
              <span>⚠️</span>
              <span>{gpsError}</span>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      {camError && (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{camError}</p>
      )}

      <div className="flex gap-3 flex-wrap">
        {!preview && !cameraActive && (
          <button onClick={startCamera} className="bg-[#E88125] hover:bg-[#cf6f1b] text-white font-bold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Open Camera
          </button>
        )}
        {cameraActive && (
          <button onClick={stopCamera} className="border border-[#E6DCC9] text-[#10261C] bg-white hover:bg-gray-50 font-bold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-sm text-sm">Cancel</button>
        )}

        {/* File upload always available */}
        <label className="border border-[#E6DCC9] text-[#10261C] bg-white hover:bg-gray-50 font-bold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 shadow-sm flex items-center gap-2 cursor-pointer text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Upload Photo
          <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </label>

        {preview && (
          <button onClick={reset} className="text-sm text-red-600 hover:text-red-800 font-bold transition-colors ml-auto">
            Retake
          </button>
        )}
      </div>
    </div>
  )
}
