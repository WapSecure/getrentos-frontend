'use client';

import { useEffect, useRef, useState } from 'react';
import { Eraser, PenLine, Upload } from 'lucide-react';
import { cn } from '@getrentos/shared';

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
  className?: string;
}

type Mode = 'draw' | 'upload';

/** The longest edge we keep for an uploaded signature image. Normalising to a
 * bounded PNG keeps the payload small and the format consistent with the drawn
 * signature, whatever the user uploaded. */
const MAX_UPLOAD_EDGE = 800;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Native canvas signature capture — no third-party signing library. Signs by
 * drawing (mouse, touch, or pen via unified pointer events) OR by uploading an
 * image of a signature, for anyone who cannot draw one. Either way it reports
 * the signature as a PNG data URL (or null once cleared/empty). */
export function SignaturePad({
  onChange,
  width = 480,
  height = 160,
  className,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);
  const [mode, setMode] = useState<Mode>('draw');
  const [hasDrawn, setHasDrawn] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#1d1d1f';
  }, [width, height, mode]);

  const pointerPosition = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    const { x, y } = pointerPosition(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = pointerPosition(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasDrawn) setHasDrawn(true);
  };

  const finishStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) onChange(canvas.toDataURL('image/png'));
  };

  const handleClearDrawing = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onChange(null);
  };

  const handleFile = (file: File | undefined) => {
    setUploadError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError('That image is too large. Please use one under 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Normalise to a bounded PNG so the stored signature stays small and
        // consistent with the drawn one.
        const scale = Math.min(1, MAX_UPLOAD_EDGE / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setUploadError('We could not read that image. Please try another.');
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setUploadedUrl(dataUrl);
        onChange(dataUrl);
      };
      img.onerror = () => setUploadError('We could not read that image. Please try another.');
      img.src = typeof reader.result === 'string' ? reader.result : '';
    };
    reader.onerror = () => setUploadError('We could not read that file. Please try again.');
    reader.readAsDataURL(file);
  };

  const handleClearUpload = () => {
    setUploadedUrl(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onChange(null);
  };

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    // Switching input methods clears the pending signature so the two can't
    // disagree about what was signed.
    if (mode === 'draw') handleClearDrawing();
    else handleClearUpload();
    setMode(next);
  };

  const tabClass = (active: boolean) =>
    cn(
      'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors',
      active
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
    );

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={tabClass(mode === 'draw')}
          onClick={() => switchMode('draw')}
        >
          <PenLine className="h-3.5 w-3.5" />
          Draw
        </button>
        <button
          type="button"
          className={tabClass(mode === 'upload')}
          onClick={() => switchMode('upload')}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload
        </button>
      </div>

      {mode === 'draw' ? (
        <>
          <div className="relative rounded-xl border border-border bg-card overflow-hidden">
            <canvas
              ref={canvasRef}
              style={{ width, height, touchAction: 'none' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishStroke}
              onPointerLeave={finishStroke}
              className="cursor-crosshair block w-full"
            />
            {!hasDrawn && (
              <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                Sign here
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClearDrawing}
            disabled={!hasDrawn}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Eraser className="w-3.5 h-3.5" />
            Clear
          </button>
        </>
      ) : (
        <>
          <div
            className="relative flex items-center justify-center rounded-xl border border-dashed border-border bg-card overflow-hidden"
            style={{ width: '100%', minHeight: height }}
          >
            {uploadedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={uploadedUrl}
                alt="Uploaded signature"
                className="max-h-full max-w-full object-contain p-2"
                style={{ maxHeight: height }}
              />
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-1.5 px-4 py-6 text-sm text-muted-foreground hover:text-foreground"
              >
                <Upload className="h-5 w-5" />
                <span>
                  <span className="font-medium text-primary">Click to upload</span> a signature
                  image
                </span>
                <span className="text-xs">PNG or JPG, up to 10MB</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
          {uploadedUrl && (
            <button
              type="button"
              onClick={handleClearUpload}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <Eraser className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
        </>
      )}
    </div>
  );
}
