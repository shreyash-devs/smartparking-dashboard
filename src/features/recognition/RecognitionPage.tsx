import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recognitionService } from '@/services/recognition.service';
import { useToast } from '@/components/feedback/ToastContext';
import type { RecognitionEvent, RecognitionLocation, RecognitionStatus } from '@/types/domain';
import {
  Camera,
  Upload,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Sparkles,
  Zap,
} from 'lucide-react';
import { formatDateTime, formatRelativeTime } from '@/lib/formatters';

export const RecognitionPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data: events = [], refetch } = useQuery<RecognitionEvent[]>({
    queryKey: ['recognition-events'],
    queryFn: () => recognitionService.getRecentEvents(),
  });

  const [searchPlate, setSearchPlate] = useState('');
  const [locationFilter, setLocationFilter] = useState<'ALL' | RecognitionLocation>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | RecognitionStatus>('ALL');

  // Manual snapshot test upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const [testResult, setTestResult] = useState<any | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: 'ENTRY' | 'EXIT' }) => {
      if (type === 'ENTRY') {
        return await recognitionService.submitEntryImage(file);
      } else {
        return await recognitionService.submitExitImage(file);
      }
    },
    onSuccess: (data) => {
      setTestResult(data);
      refetch();
      success(
        'OCR Completed',
        `Plate: ${data.recognizedPlate || 'Detected'} — Decision: ${data.decision || 'PROCESSED'}`
      );
    },
    onError: (err: any) => {
      error('OCR Recognition Failed', err.message);
    },
  });

  const handleTestUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      error('Missing File', 'Please select a camera capture image to upload.');
      return;
    }
    uploadMutation.mutate({ file: selectedFile, type: uploadType });
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
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                ESP32-CAM Test Bench
              </h3>
              <p className="text-xs text-slate-500">
                Upload snapshot to test FastAPI Plate Recognizer pipeline
              </p>
            </div>
          </div>

          <form onSubmit={handleTestUpload} className="space-y-3.5">
            {/* Barrier location selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUploadType('ENTRY')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  uploadType === 'ENTRY'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Entry Barrier</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadType('EXIT')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  uploadType === 'EXIT'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Exit Barrier</span>
              </button>
            </div>

            {/* File dropzone / input */}
            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50">
              <input
                type="file"
                accept="image/*"
                id="camera-file"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label htmlFor="camera-file" className="cursor-pointer block space-y-2">
                <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                <div className="text-xs text-slate-600">
                  {selectedFile ? (
                    <span className="font-bold text-indigo-600">{selectedFile.name}</span>
                  ) : (
                    <>
                      <span className="font-semibold text-indigo-600">Click to choose</span> car capture photo
                    </>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">Supports JPG, PNG up to 10MB</p>
              </label>
            </div>

            <button
              type="submit"
              disabled={uploadMutation.isPending || !selectedFile}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {uploadMutation.isPending ? (
                <>Processing OCR...</>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Send to FastAPI OCR</span>
                </>
              )}
            </button>
          </form>

          {/* Test Result Display */}
          {testResult && (
            <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 text-xs space-y-2 font-mono">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>FastAPI Response</span>
                <span className="text-emerald-400 font-bold">200 OK</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Plate:</span>
                <span className="font-bold text-cyan-300">{testResult.recognizedPlate || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Confidence:</span>
                <span className="text-emerald-400">
                  {testResult.confidence ? `${Math.round(testResult.confidence * 100)}%` : '—'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Decision:</span>
                <span
                  className={
                    testResult.decision === 'AUTHORIZED' ? 'text-emerald-400' : 'text-amber-400'
                  }
                >
                  {testResult.decision}
                </span>
              </div>
              {testResult.slotCode && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Allocated Slot:</span>
                  <span className="text-white font-bold">{testResult.slotCode}</span>
                </div>
              )}
              {testResult.message && (
                <p className="text-[11px] text-slate-400 font-sans pt-1">{testResult.message}</p>
              )}
            </div>
          )}
        </div>

        {/* Right: Plate Recognizer & OCR Pipeline Metrics */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              Recognition Pipeline Status
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Plate Recognizer Cloud OCR integrated via FastAPI service layer. Barrier commands published over MQTT.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
            <div className="p-3 rounded-xl bg-slate-50 border">
              <p className="text-[11px] text-slate-400 uppercase font-mono">Total Scans</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{events.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <p className="text-[11px] text-emerald-700 uppercase font-mono">Recognized</p>
              <p className="text-xl font-bold text-emerald-700 mt-0.5">
                {events.filter(e => e.resultStatus === 'SUCCESS').length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100">
              <p className="text-[11px] text-indigo-700 uppercase font-mono">Avg Confidence</p>
              <p className="text-xl font-bold text-indigo-700 mt-0.5">
                {events.length > 0
                  ? `${Math.round(
                      (events.reduce((acc, e) => acc + (e.confidence || 0), 0) / events.length) * 100
                    )}%`
                  : '—'}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100/80 text-xs text-indigo-900 flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Images are processed purely in-memory on FastAPI without storing private captures permanently.
            </span>
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
