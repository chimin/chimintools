
'use client';

import { useState, useEffect } from 'react';

const calculateChargeTime = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return 0;
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  let diff = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
  if (diff < 0) diff += 24 * 60;
  return diff / 60;
};

const getCurrentTimeValue = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

type CalcState = {
  batterySize: string;
  powerVoltage: string;
  chargeStartTime: string;
  chargeEndTime: string;
  remainingBattery: string;
  targetBattery: string;
  chargerCurrentLoss: string;
  chargerCurrentLossEnabled: boolean;
  fullChargeBatteryLevel: string;
  fullChargeExtraTime: string;
  fullChargeExtraTimeEnabled: boolean;
};

const defaultState: CalcState = {
  batterySize: '0',
  powerVoltage: '230',
  chargeStartTime: '',
  chargeEndTime: '',
  remainingBattery: '0',
  targetBattery: '100',
  chargerCurrentLoss: '1',
  chargerCurrentLossEnabled: true,
  fullChargeBatteryLevel: '80',
  fullChargeExtraTime: '1',
  fullChargeExtraTimeEnabled: true,
};

const computeRequiredCurrent = (s: CalcState): number => {
  const chargeTime = calculateChargeTime(s.chargeStartTime, s.chargeEndTime);
  const numPowerVoltage = parseFloat(s.powerVoltage);
  const numBatterySize = parseFloat(s.batterySize);
  const numTargetBattery = parseFloat(s.targetBattery);
  const numRemainingBattery = parseFloat(s.remainingBattery);
  const numFullChargeBatteryLevel = parseFloat(s.fullChargeBatteryLevel);
  const numFullChargeExtraTime = parseFloat(s.fullChargeExtraTime);
  const numChargerCurrentLoss = parseFloat(s.chargerCurrentLoss);

  let effectiveChargeTime = chargeTime;
  if (s.fullChargeExtraTimeEnabled && numTargetBattery > numFullChargeBatteryLevel && numFullChargeBatteryLevel > numRemainingBattery) {
    effectiveChargeTime -= numFullChargeExtraTime * (numTargetBattery - numFullChargeBatteryLevel) / (100 - numFullChargeBatteryLevel);
  }

  if (effectiveChargeTime <= 0 || numPowerVoltage <= 0) return 0;

  const energyNeeded = (numBatterySize * (numTargetBattery - numRemainingBattery)) / 100;
  const current = (energyNeeded / effectiveChargeTime * 1000) / numPowerVoltage;
  return s.chargerCurrentLossEnabled && numChargerCurrentLoss > 0 ? current + numChargerCurrentLoss : current;
};

export default function EVChargeCalc() {
  const [state, setState] = useState<CalcState>(defaultState);
  const [showMore, setShowMore] = useState(false);

  const patch = (updates: Partial<CalcState>) => setState(prev => ({ ...prev, ...updates }));

  const handleInputChange = (key: keyof CalcState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    patch({ [key]: e.target.value });

  const handleInputBlur = (key: keyof CalcState) => (e: React.FocusEvent<HTMLInputElement>) => {
    const n = parseFloat(e.target.value);
    patch({ [key]: isNaN(n) ? '0' : String(n) });
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

  useEffect(() => {
    try {
      const savedData = localStorage.getItem('evChargeCalcData');
      if (savedData) {
        const p = JSON.parse(savedData);
        setState({
          batterySize: String(p.batterySize || defaultState.batterySize),
          powerVoltage: String(p.powerVoltage || defaultState.powerVoltage),
          chargeStartTime: p.chargeStartTime || '',
          chargeEndTime: p.chargeEndTime || '',
          remainingBattery: String(p.remainingBattery || defaultState.remainingBattery),
          targetBattery: String(p.targetBattery || defaultState.targetBattery),
          chargerCurrentLoss: String(p.chargerCurrentLoss || defaultState.chargerCurrentLoss),
          chargerCurrentLossEnabled: p.chargerCurrentLossEnabled ?? true,
          fullChargeBatteryLevel: String(p.fullChargeBatteryLevel || defaultState.fullChargeBatteryLevel),
          fullChargeExtraTime: String(p.fullChargeExtraTime || defaultState.fullChargeExtraTime),
          fullChargeExtraTimeEnabled: p.fullChargeExtraTimeEnabled ?? true,
        });
      }
    } catch (error) {
      console.error("Failed to parse localStorage data", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('evChargeCalcData', JSON.stringify(state));
  }, [state]);

  const requiredCurrent = computeRequiredCurrent(state);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold mb-5">EV Charge Calculator</h1>
        <div className="flex flex-col w-full md:w-1/2">
          <div className="flex flex-col mb-3">
            <label className="text-left">Car Battery Size</label>
            <div className="flex items-center">
              <input
                type="text"
                inputMode="decimal"
                value={state.batterySize}
                onChange={handleInputChange('batterySize')}
                onBlur={handleInputBlur('batterySize')}
                onFocus={handleFocus}
                className="border border-gray-300 rounded-md p-2 w-full"
              />
              <span className="ml-2">kWh</span>
            </div>
          </div>
          <div className="flex flex-col mb-3">
            <label className="text-left">Charge Start Time</label>
            <div className="flex items-center">
              <input
                type="time"
                value={state.chargeStartTime}
                onChange={(e) => patch({ chargeStartTime: e.target.value })}
                className="border border-gray-300 rounded-md p-2 w-full"
              />
              <button
                type="button"
                onClick={() => patch({ chargeStartTime: getCurrentTimeValue() })}
                className="ml-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium"
              >
                Now
              </button>
            </div>
          </div>
          <div className="flex flex-col mb-3">
            <label className="text-left">Charge End Time</label>
            <div className="flex items-center">
              <input
                type="time"
                value={state.chargeEndTime}
                onChange={(e) => patch({ chargeEndTime: e.target.value })}
                className="border border-gray-300 rounded-md p-2 w-full"
              />
            </div>
          </div>
          <div className="flex flex-col mb-3">
            <label className="text-left">Remaining Battery Level</label>
            <div className="flex items-center">
              <input
                type="text"
                inputMode="decimal"
                value={state.remainingBattery}
                onChange={handleInputChange('remainingBattery')}
                onBlur={handleInputBlur('remainingBattery')}
                onFocus={handleFocus}
                className="border border-gray-300 rounded-md p-2 w-full"
              />
              <span className="ml-2">%</span>
            </div>
          </div>
          <div className="flex flex-col mb-3">
            <label className="text-left">Target Battery Level</label>
            <div className="flex items-center">
              <input
                type="text"
                inputMode="decimal"
                value={state.targetBattery}
                onChange={handleInputChange('targetBattery')}
                onBlur={handleInputBlur('targetBattery')}
                onFocus={handleFocus}
                className="border border-gray-300 rounded-md p-2 w-full"
              />
              <span className="ml-2">%</span>
            </div>
          </div>
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setShowMore(!showMore)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <span>{showMore ? '▾' : '▸'}</span>
              <span>More</span>
            </button>
            {showMore && (
              <div className="mt-3 flex flex-col gap-3">
                <div className="flex flex-col">
                  <label className="text-left">Power Voltage</label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={state.powerVoltage}
                      onChange={handleInputChange('powerVoltage')}
                      onBlur={handleInputBlur('powerVoltage')}
                      onFocus={handleFocus}
                      className="border border-gray-300 rounded-md p-2 w-full"
                    />
                    <span className="ml-2">V</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 text-left">
                    <input
                      type="checkbox"
                      checked={state.chargerCurrentLossEnabled}
                      onChange={(e) => patch({ chargerCurrentLossEnabled: e.target.checked })}
                    />
                    <label>Charger Loss</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={state.chargerCurrentLoss}
                      onChange={handleInputChange('chargerCurrentLoss')}
                      onBlur={handleInputBlur('chargerCurrentLoss')}
                      onFocus={handleFocus}
                      disabled={!state.chargerCurrentLossEnabled}
                      className="border border-gray-300 rounded-md p-2 w-full disabled:opacity-40"
                    />
                    <span className="ml-2">A</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-left">Full Charge Battery Level</label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={state.fullChargeBatteryLevel}
                      onChange={handleInputChange('fullChargeBatteryLevel')}
                      onBlur={handleInputBlur('fullChargeBatteryLevel')}
                      onFocus={handleFocus}
                      className="border border-gray-300 rounded-md p-2 w-full"
                    />
                    <span className="ml-2">%</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 text-left">
                    <input
                      type="checkbox"
                      checked={state.fullChargeExtraTimeEnabled}
                      onChange={(e) => patch({ fullChargeExtraTimeEnabled: e.target.checked })}
                    />
                    <label>Full Charge Extra Time</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={state.fullChargeExtraTime}
                      onChange={handleInputChange('fullChargeExtraTime')}
                      onBlur={handleInputBlur('fullChargeExtraTime')}
                      onFocus={handleFocus}
                      disabled={!state.fullChargeExtraTimeEnabled}
                      className="border border-gray-300 rounded-md p-2 w-full disabled:opacity-40"
                    />
                    <span className="ml-2">hrs</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          {requiredCurrent > 0 && (
            <div className="mt-5">
              <h2 className="text-2xl font-bold">
                Required Charger Current: {requiredCurrent.toFixed(2)} A
              </h2>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
