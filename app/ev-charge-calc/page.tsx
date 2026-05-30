
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

type Breakdown = {
  chargeTime: number;
  effectiveExtraTime: number;
  effectiveChargeTime: number;
  energyNeeded: number;
  powerNeeded: number;
  baseCurrent: number;
  lossApplied: number;
  requiredCurrent: number;
  percentGainPerHour: number;
};

const computeBreakdown = (s: CalcState): Breakdown | null => {
  const chargeTime = calculateChargeTime(s.chargeStartTime, s.chargeEndTime);
  const numPowerVoltage = parseFloat(s.powerVoltage);
  const numBatterySize = parseFloat(s.batterySize);
  const numTargetBattery = parseFloat(s.targetBattery);
  const numRemainingBattery = parseFloat(s.remainingBattery);
  const numFullChargeBatteryLevel = parseFloat(s.fullChargeBatteryLevel);
  const numFullChargeExtraTime = parseFloat(s.fullChargeExtraTime);
  const numChargerCurrentLoss = parseFloat(s.chargerCurrentLoss);

  let effectiveExtraTime = 0;
  if (s.fullChargeExtraTimeEnabled && numTargetBattery > numFullChargeBatteryLevel && numFullChargeBatteryLevel > numRemainingBattery) {
    effectiveExtraTime = numFullChargeExtraTime * (numTargetBattery - numFullChargeBatteryLevel) / (100 - numFullChargeBatteryLevel);
  }

  const effectiveChargeTime = chargeTime - effectiveExtraTime;
  if (effectiveChargeTime <= 0 || numPowerVoltage <= 0) return null;

  const energyNeeded = (numBatterySize * (numTargetBattery - numRemainingBattery)) / 100;
  const powerNeeded = (energyNeeded / effectiveChargeTime) * 1000;
  const baseCurrent = powerNeeded / numPowerVoltage;
  const lossApplied = s.chargerCurrentLossEnabled && numChargerCurrentLoss > 0 ? numChargerCurrentLoss : 0;

  const percentGainPerHour = (numTargetBattery - numRemainingBattery) / effectiveChargeTime;

  return { chargeTime, effectiveExtraTime, effectiveChargeTime, energyNeeded, powerNeeded, baseCurrent, lossApplied, requiredCurrent: baseCurrent + lossApplied, percentGainPerHour };
};

function Tooltip({ text }: { text: string }) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const visible = hovered || pinned;

  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setPinned(v => !v)}
        className="w-4 h-4 rounded-full border border-gray-400 text-gray-400 hover:text-gray-600 hover:border-gray-600 inline-flex items-center justify-center text-xs leading-none select-none"
        aria-label="More information"
      >
        i
      </button>
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 w-56 rounded-md bg-gray-800 text-white text-xs px-2.5 py-1.5 shadow-lg pointer-events-none text-left whitespace-normal">
          {text}
        </span>
      )}
    </span>
  );
}

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

  const breakdown = computeBreakdown(state);
  const requiredCurrent = breakdown?.requiredCurrent ?? 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold mb-5">EV Charge Calculator</h1>
        <div className="flex flex-col w-full md:w-1/2">
          <div className="flex flex-col mb-3">
            <label className="text-left flex items-center">
              Car Battery Size
              <Tooltip text="Total usable capacity of your EV's battery pack." />
            </label>
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
            <label className="text-left flex items-center">
              Charge Start Time
              <Tooltip text="The time when charging begins." />
            </label>
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
            <label className="text-left flex items-center">
              Charge End Time
              <Tooltip text="The time by which charging must be complete." />
            </label>
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
            <label className="text-left flex items-center">
              Remaining Battery Level
              <Tooltip text="Current battery charge level before charging starts." />
            </label>
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
            <label className="text-left flex items-center">
              Target Battery Level
              <Tooltip text="Desired battery level to reach by the end of charging." />
            </label>
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
                  <label className="text-left flex items-center">
                    Power Voltage
                    <Tooltip text="AC supply voltage at your charging outlet. Typically 230 V in AU/EU or 120/240 V in the US." />
                  </label>
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
                    <label className="flex items-center">
                      Charger Loss
                      <Tooltip text="Fixed current drawn by the charger hardware itself (heat, control circuits) that is not delivered to the battery." />
                    </label>
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
                  <label className="text-left flex items-center">
                    Full Charge Battery Level
                    <Tooltip text="The battery level above which the car throttles charging speed. Typically 80%. Used together with Full Charge Extra Time." />
                  </label>
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
                    <label className="flex items-center">
                      Full Charge Extra Time
                      <Tooltip text="Extra time needed to charge from the full charge level all the way to 100% due to reduced charging speed. Prorated when the target is below 100%." />
                    </label>
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
          {breakdown && (
            <div className="mt-5 flex flex-col gap-4">
              <h2 className="text-2xl font-bold">
                Required Charger Current: {breakdown.requiredCurrent.toFixed(2)} A
              </h2>
              <div className="text-left text-sm border border-gray-200 rounded-md p-4 bg-gray-50 flex flex-col gap-2">
                <p className="font-semibold text-gray-700">How it&apos;s calculated</p>
                <div className="flex flex-col gap-1 text-gray-600">
                  <p>
                    <span className="font-medium">Charge window: </span>
                    {state.chargeStartTime} → {state.chargeEndTime} = {breakdown.chargeTime.toFixed(2)} hrs
                  </p>
                  {breakdown.effectiveExtraTime > 0 && (
                    <p className="pl-4">
                      − {breakdown.effectiveExtraTime.toFixed(2)} hrs for full charge phase
                      ({state.fullChargeBatteryLevel}% → {state.targetBattery}%)
                      <br />
                      <span className="font-medium">Effective charge time: </span>
                      {breakdown.effectiveChargeTime.toFixed(2)} hrs
                    </p>
                  )}
                </div>
                <div className="text-gray-600">
                  <p>
                    <span className="font-medium">Energy needed: </span>
                    {state.batterySize} kWh × ({state.targetBattery}% − {state.remainingBattery}%) ÷ 100
                    = {breakdown.energyNeeded.toFixed(2)} kWh
                  </p>
                </div>
                <div className="text-gray-600">
                  <p>
                    <span className="font-medium">Battery percentage gain: </span>
                    ({state.targetBattery}% − {state.remainingBattery}%) ÷ {breakdown.effectiveChargeTime.toFixed(2)} hrs
                    = {breakdown.percentGainPerHour.toFixed(2)}% / hr
                  </p>
                </div>
                <div className="text-gray-600">
                  <p>
                    <span className="font-medium">Charge power: </span>
                    {breakdown.energyNeeded.toFixed(2)} kWh ÷ {breakdown.effectiveChargeTime.toFixed(2)} hrs
                    = {(breakdown.powerNeeded / 1000).toFixed(2)} kW
                  </p>
                </div>
                <div className="text-gray-600">
                  <p>
                    <span className="font-medium">Base current: </span>
                    {(breakdown.powerNeeded / 1000).toFixed(2)} kW × 1000 ÷ {state.powerVoltage} V
                    = {breakdown.baseCurrent.toFixed(2)} A
                  </p>
                </div>
                {breakdown.lossApplied > 0 && (
                  <div className="text-gray-600">
                    <p>
                      <span className="font-medium">Charger loss: </span>
                      {breakdown.baseCurrent.toFixed(2)} A + {breakdown.lossApplied.toFixed(2)} A
                      = {breakdown.requiredCurrent.toFixed(2)} A
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
