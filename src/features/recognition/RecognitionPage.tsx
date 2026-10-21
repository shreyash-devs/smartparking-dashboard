import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { recognitionService } from '@/services/recognition.service';
import { useToast } from '@/components/feedback/ToastContext';
import type { RecognitionEvent, RecognitionLocation, RecognitionStatus } from '@/types/domain';
import type { RecognitionResponse } from '@/types/api';
import {
  Camera,
  Upload,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Key,
  Image as ImageIcon,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/formatters';

export const RecognitionPage: React.FC = () => {
  const { success, error, warning } = useToast();

  const { data: events = [], refetch } = useQuery<RecognitionEvent[]>({
    queryKey: ['recognition-events'],
    queryFn: () => recognitionService.getRecentEvents(),
  });

  const [searchPlate, setSearchPlate] = useState('');
  const [locationFilter, setLocationFilter] = useState<'ALL' | RecognitionLocation>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | RecognitionStatus>('ALL');

  // Manual snapshot test upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [testMode, setTestMode] = useState<'OCR_ONLY' | 'ENTRY_WORKFLOW' | 'EXIT_WORKFLOW'>('OCR_ONLY');
  const [ocrResult, setOcrResult] = useState<RecognitionResponse | null>(null);
  const [workflowResult, setWorkflowResult] = useState<any | null>(null);

  // Device Key state (FastAPI APIKeyHeader 'X-Device-Key')
  const [deviceKey, setDeviceKey] = useState<string>(() => {
    return (
      localStorage.getItem('smartparking_device_key') ||
      import.meta.env.VITE_DEVICE_KEY ||
      ''
    );
  });
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);

  // Handle preview URL with automatic object URL creation and revocation
  const previewUrl = useMemo(() => {
    return selectedFile ? URL.createObjectURL(selectedFile) : null;
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleDeviceKeyChange = (newKey: string) => {
    setDeviceKey(newKey);
    localStorage.setItem('smartparking_device_key', newKey);
  };

  const uploadMutation = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      if (testMode === 'OCR_ONLY') {
        const res = await recognitionService.recognizePlate(file, deviceKey || undefined);
        return { mode: 'OCR_ONLY', data: res };
      } else if (testMode === 'ENTRY_WORKFLOW') {
        const res = await recognitionService.submitEntryImage(file, deviceKey || undefined);
        return { mode: 'ENTRY_WORKFLOW', data: res };
      } else {
        const res = await recognitionService.submitExitImage(file, deviceKey || undefined);
        return { mode: 'EXIT_WORKFLOW', data: res };
      }
    },
    onSuccess: (result) => {
      refetch();
      if (result.mode === 'OCR_ONLY') {
        const res = result.data as RecognitionResponse;
        setOcrResult(res);
        setWorkflowResult(null);

        if (res.status === 'recognized' && res.plate) {
          success(
            'Vehicle Plate Recognized',
            `Plate: ${res.plate} (${Math.round((res.confidence ?? 1) * 100)}% confidence)`
          );
        } else {
          warning(
            `Status: ${res.status}`,
            res.errorMessage || "Vehicle plate not reliably identified. Only status 'recognized' is reliable."
          );
        }
      } else {
        setWorkflowResult(result.data);
        setOcrResult(null);
        success(
          'Workflow Processed',
          `Plate: ${result.data.recognizedPlate || result.data.plate || 'Detected'}`
        );
      }
    },
    onError: (err: any) => {
      const msg = err.message || 'Unknown recognition error';
      if (err.status === 401 || msg.toLowerCase().includes('device key')) {
        setShowKeyInput(true);
        error(
          'Authentication Required',
          'FastAPI requires an authorized X-Device-Key header. Please enter your device key below.'
        );
      } else {
        error('OCR Recognition Failed', msg);
      }
    },
  });

  const handleTestUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      error('Missing File', 'Please select a car photo (JPEG/PNG) to analyze.');
      return;
    }
    uploadMutation.mutate({ file: selectedFile });
  };

  const handleClear = () => {
    setSelectedFile(null);
    setOcrResult(null);
    setWorkflowResult(null);
  };

  const filteredEvents = events.filter(evt => {
    const matchesPlate =
      !searchPlate ||
      (evt.plateNumber && evt.plateNumber.toLowerCase().includes(searchPlate.toLowerCase())) ||
      evt.eventId.toLowerCase().includes(searchPlate.toLowerCase());

    const matchesLocation = locationFilter === 'ALL' || evt.location === locationFilter;
    const matchesStatus = statusFilter === 'ALL' || evt.resultStatus === statusFilter;

    return matchesPlate && matchesLocation && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Section: Overview & Manual Camera OCR Test Bench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Operator Snapshot Upload */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  FastAPI OCR Plate Engine
                </h3>
                <p className="text-xs text-slate-500">
                  Upload vehicle photo to extract number plate text
                </p>
              </div>
            </div>

            {/* Device Key Toggle */}
            <button
              type="button"
              onClick={() => setShowKeyInput(!showKeyInput)}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                deviceKey
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="FastAPI X-Device-Key Authentication"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {deviceKey ? 'Key Configured' : 'Device Key'}
              </span>
            </button>
          </div>

          {/* Optional X-Device-Key Input Bar */}
          {showKeyInput && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-amber-800 font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>FastAPI Device Authentication Header (X-Device-Key)</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={deviceKey}
                  onChange={e => handleDeviceKeyChange(e.target.value)}
                  placeholder="Enter device key (e.g. your-device-secret)"
                  className="flex-1 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                {deviceKey && (
                  <button
                    type="button"
                    onClick={() => handleDeviceKeyChange('')}
                    className="px-2 py-1 text-slate-500 hover:text-slate-800 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-[11px] text-amber-700">
                Saved automatically to browser storage. Sent with every request to the backend.
              </p>
            </div>
          )}

          <form onSubmit={handleTestUpload} className="space-y-3.5">
            {/* Mode Selector */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTestMode('OCR_ONLY')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  testMode === 'OCR_ONLY'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Plate OCR
              </button>
              <button
                type="button"
                onClick={() => setTestMode('ENTRY_WORKFLOW')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  testMode === 'ENTRY_WORKFLOW'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Entry Gate
              </button>
              <button
                type="button"
                onClick={() => setTestMode('EXIT_WORKFLOW')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  testMode === 'EXIT_WORKFLOW'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Exit Gate
              </button>
            </div>

            {/* File dropzone / image preview */}
            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-2xl p-4 text-center transition-colors bg-slate-50/50 relative overflow-hidden">
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                id="camera-file"
                onChange={e => {
                  const file = e.target.files?.[0] || null;
                  setSelectedFile(file);
                  setOcrResult(null);
                  setWorkflowResult(null);
                }}
                className="hidden"
              />

              {previewUrl ? (
                <div className="space-y-3">
                  <div className="relative mx-auto max-h-48 overflow-hidden rounded-xl border border-slate-200 bg-black/5 flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Car capture preview"
                      className="max-h-48 w-auto object-contain rounded-lg"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="font-semibold text-slate-700 truncate max-w-[200px]">
                      {selectedFile?.name}
                    </span>
                    <div className="flex gap-2">
                      <label
                        htmlFor="camera-file"
                        className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                      >
                        Change
                      </label>
                      <button
                        type="button"
                        onClick={handleClear}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <label htmlFor="camera-file" className="cursor-pointer block space-y-2 py-4">
                  <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-indigo-600">Click to upload</span> or drag and drop
                  </div>
                  <p className="text-[11px] text-slate-400">JPEG or PNG car photo with visible license plate</p>
                </label>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={uploadMutation.isPending || !selectedFile}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {uploadMutation.isPending ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Processing with Plate Recognizer...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {testMode === 'OCR_ONLY'
                        ? 'Recognize License Plate (POST /recognition)'
                        : testMode === 'ENTRY_WORKFLOW'
                        ? 'Submit Entry (POST /sessions/entry)'
                        : 'Submit Exit (POST /sessions/exit)'}
                    </span>
                  </>
                )}
              </button>
              {selectedFile && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 text-xs transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right: Plate Recognizer Output & OCR Pipeline Metrics */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                OCR Engine Response
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                https://smartparking-iot.vercel.app/recognition
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Plate text extracted via cloud OCR model. Only status{' '}
              <code className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono font-bold">
                recognized
              </code>{' '}
              is considered authoritative.
            </p>
          </div>

          {/* OCR Result Card Display */}
          {ocrResult ? (
            <div className="p-4 rounded-2xl bg-slate-950 text-slate-100 space-y-3.5 border border-slate-800 shadow-inner">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px]">Event: {ocrResult.eventId}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                    ocrResult.status === 'recognized'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {ocrResult.status === 'recognized' ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  {ocrResult.status}
                </span>
              </div>

              {/* Number Plate Visual Badge */}
              <div className="py-2 text-center">
                {ocrResult.plate ? (
                  <div className="inline-flex items-center rounded-lg overflow-hidden border-2 border-slate-300 shadow-md bg-white text-slate-950 font-mono tracking-widest text-xl sm:text-2xl font-black px-4 py-2 select-all">
                    <div className="bg-blue-700 text-white text-[10px] font-bold px-1.5 py-1 -ml-4 mr-3 self-stretch flex flex-col justify-center items-center">
                      <span>IND</span>
                    </div>
                    <span>{ocrResult.plate}</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 text-xs">
                    No license plate identified in this photo
                  </div>
                )}
              </div>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 border-t border-slate-800">
                <div className="bg-slate-900 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase">Confidence</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {ocrResult.confidence !== null && ocrResult.confidence !== undefined
                      ? `${Math.round(ocrResult.confidence * 100)}%`
                      : 'N/A'}
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase">Timestamp</span>
                  <span className="text-slate-300 text-xs truncate block">
                    {ocrResult.createdAt ? new Date(ocrResult.createdAt).toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
              </div>

              {ocrResult.errorMessage && (
                <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-900/50 text-rose-300 text-[11px]">
                  {ocrResult.errorMessage}
                </div>
              )}
            </div>
          ) : workflowResult ? (
            <div className="p-4 rounded-2xl bg-slate-950 text-slate-100 space-y-3 font-mono text-xs border border-slate-800">
              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>FastAPI Gate Decision</span>
                <span className={workflowResult.decision === 'AUTHORIZED' ? 'text-emerald-400' : 'text-amber-400'}>
                  {workflowResult.decision || (workflowResult.openGate ? 'AUTHORIZED' : 'DENIED')}
                </span>
              </div>
              <div className="py-2 text-center">
                <div className="inline-block rounded-lg border-2 border-slate-300 bg-white text-slate-950 px-4 py-1.5 font-black text-xl">
                  {workflowResult.recognizedPlate || workflowResult.plate || 'NONE'}
                </div>
              </div>
              {workflowResult.slotCode && (
                <div className="flex justify-between border-t border-slate-800 pt-2 text-xs">
                  <span className="text-slate-400">Allocated Slot:</span>
                  <span className="text-white font-bold">{workflowResult.slotCode}</span>
                </div>
              )}
              {workflowResult.message && (
                <p className="text-[11px] text-slate-400 font-sans">{workflowResult.message}</p>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 text-center text-slate-400 space-y-2">
              <ImageIcon className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Awaiting Vehicle Capture</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Select or drag a car photo on the left and click Recognize to call the FastAPI OCR engine.
              </p>
            </div>
          )}

          {/* Pipeline Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 border">
              <p className="text-[10px] text-slate-400 uppercase font-mono">Total Scans</p>
              <p className="text-base font-bold text-slate-900">{events.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <p className="text-[10px] text-emerald-700 uppercase font-mono">Recognized</p>
              <p className="text-base font-bold text-emerald-700">
                {events.filter(e => e.resultStatus === 'SUCCESS').length}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
              <p className="text-[10px] text-indigo-700 uppercase font-mono">Reliability</p>
              <p className="text-base font-bold text-indigo-700">
                {events.length > 0
                  ? `${Math.round(
                      (events.filter(e => e.resultStatus === 'SUCCESS').length / events.length) * 100
                    )}%`
                  : '100%'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recognition History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchPlate}
              onChange={e => setSearchPlate(e.target.value)}
              placeholder="Search plate or event ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Barriers</option>
              <option value="ENTRY">Entry Barrier</option>
              <option value="EXIT">Exit Barrier</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Results</option>
              <option value="SUCCESS">Success</option>
              <option value="NO_PLATE">No Plate Detected</option>
              <option value="LOW_CONFIDENCE">Low Confidence</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">License Plate</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Result Status</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <Camera className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No data available</p>
                    <p className="text-xs text-slate-400 mt-1">No recognition event documents found on Firebase.</p>
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-700">No events matched your filters</p>
                  </td>
                </tr>
              ) : (
                filteredEvents.map(evt => (
                  <tr key={evt.eventId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{evt.eventId}</td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        {evt.location === 'ENTRY' ? (
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span>{evt.location}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                      {evt.plateNumber ? (
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {evt.plateNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No plate detected</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold">
                      {evt.confidence > 0 ? `${Math.round(evt.confidence * 100)}%` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          evt.resultStatus === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {evt.resultStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          evt.decision === 'AUTHORIZED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : evt.decision === 'PAYMENT_REQUIRED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {evt.decision || 'NONE'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {formatRelativeTime(evt.timestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
