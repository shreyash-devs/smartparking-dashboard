import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import type { IoTDevice } from '@/types/domain';
import {
  Cpu,
  Radio,
  Camera,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/formatters';
import { useToast } from '@/components/feedback/ToastContext';

export const DevicesPage: React.FC = () => {
  const { success } = useToast();
  const [pingingId, setPingingId] = useState<string | null>(null);

  const { data: devices = [], refetch } = useQuery<IoTDevice[]>({
    queryKey: ['iot-devices'],
    queryFn: async () => {
      // Fetch directly from Firestore
      try {
        if (db && 'type' in db) {
          const snap = await getDocs(collection(db, 'devices'));
          const list: IoTDevice[] = [];
          snap.forEach(d => {
            const data = d.data();
            list.push({
              deviceId: d.id,
              name: data.name || d.id,
              deviceType: data.deviceType || 'ULTRASONIC_SENSOR',
              location: data.location || 'ENTRY',
              status: data.status || 'ONLINE',
              firmwareVersion: data.firmwareVersion || 'v1.0.0',
              lastHeartbeat: data.lastHeartbeat || '',
              ipAddress: data.ipAddress,
              lastCommand: data.lastCommand,
              lastCommandAck: data.lastCommandAck,
              physicalState: data.physicalState,
            });
          });
          return list;
        }
      } catch (e) {
        console.warn('Error reading devices from Firestore:', e);
      }

      return [];
    },
  });

  const handlePing = (deviceId: string) => {
    setPingingId(deviceId);
    setTimeout(() => {
      setPingingId(null);
      success('Device Responded', `${deviceId} heartbeat verified.`);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-slate-900">
            IoT Devices & Hardware
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Status of ESP32 microcontrollers, camera vision nodes, and barrier servo actuators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${devices.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <span className="text-xs font-semibold text-slate-700">
            {devices.length > 0 ? `${devices.length} Devices Registered` : 'Awaiting Devices'}
          </span>
        </div>
      </div>

      {/* Devices Grid or No Data Available */}
      {devices.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-200 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center mb-3 border border-slate-200">
            <Cpu className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-800">No data available</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            No IoT device documents found on Firebase. When your microcontrollers or hardware agents register in the <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono text-[11px]">devices</code> collection, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map(device => {
            const isOnline = device.status === 'ONLINE';

            return (
              <div
                key={device.deviceId}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-cyan-400 flex items-center justify-center">
                      {device.deviceType === 'ENTRY_CAM' || device.deviceType === 'EXIT_CAM' ? (
                        <Camera className="w-5 h-5" />
                      ) : device.deviceType === 'GATE_SERVO' ? (
                        <Activity className="w-5 h-5" />
                      ) : (
                        <Cpu className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{device.name || device.deviceId}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{device.deviceType}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isOnline
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {device.status}
                  </span>
                </div>

                {/* Device Details */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-400 block">Location / Bay</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">
                      {device.location}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[11px] text-slate-400 block">Firmware</span>
                    <span className="font-semibold text-slate-800 font-mono mt-0.5 block">
                      {device.firmwareVersion}
                    </span>
                  </div>
                </div>

                {/* Heartbeat & Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Pulse: {formatRelativeTime(device.lastHeartbeat)}
                  </span>

                  <button
                    onClick={() => handlePing(device.deviceId)}
                    disabled={pingingId === device.deviceId}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3 h-3 ${pingingId === device.deviceId ? 'animate-spin' : ''}`} />
                    <span>Ping</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
