
'use client';

import { useState, useEffect } from 'react';

const calculateChargeTime = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) {
    return 0;
  }
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  let diff = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);

  if (diff < 0) {
    diff += 24 * 60;
  }

  return diff / 60;
};

const getCurrentTimeValue = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
};

export default function EVChargeCalc() {
  const [batterySize, setBatterySize] = useState('0');
  const [powerVoltage, setPowerVoltage] = useState('230');
  const [chargeStartTime, setChargeStartTime] = useState('');
  const [chargeEndTime, setChargeEndTime] = useState('');
  const [remainingBattery, setRemainingBattery] = useState('0');
  const [targetBattery, setTargetBattery] = useState('100');
  const [chargerCurrentLoss, setChargerCurrentLoss] = useState('1');
  const [chargerCurrentLossEnabled, setChargerCurrentLossEnabled] = useState(true);
  const [fullChargeBatteryLevel, setFullChargeBatteryLevel] = useState('80');
  const [fullChargeExtraTime, setFullChargeExtraTime] = useState('1');
  const [fullChargeExtraTimeEnabled, setFullChargeExtraTimeEnabled] = useState(true);
  const [requiredCurrent, setRequiredCurrent] = useState(0);
  const [showMore, setShowMore] = useState(false);

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
  };

  const handleInputBlur = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.FocusEvent<HTMLInputElement>) => {
    let value = e.target.value;
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      setter('0');
    } else {
      setter(String(numericValue));
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  useEffect(() => {
    try {
      const savedData = localStorage.getItem('evChargeCalcData');
      if (savedData) {
        const { batterySize, powerVoltage, chargeStartTime, chargeEndTime, remainingBattery, targetBattery, chargerCurrentLoss, chargerCurrentLossEnabled, fullChargeBatteryLevel, fullChargeExtraTime, fullChargeExtraTimeEnabled } = JSON.parse(savedData);
        setBatterySize(String(batterySize || '0'));
        setPowerVoltage(String(powerVoltage || '230'));
        setChargeStartTime(chargeStartTime || '');
        setChargeEndTime(chargeEndTime || '');
        setRemainingBattery(String(remainingBattery || '0'));
        setTargetBattery(String(targetBattery || '100'));
        setChargerCurrentLoss(String(chargerCurrentLoss || '1'));
        setChargerCurrentLossEnabled(chargerCurrentLossEnabled ?? true);
        setFullChargeBatteryLevel(String(fullChargeBatteryLevel || '80'));
        setFullChargeExtraTime(String(fullChargeExtraTime || '1'));
        setFullChargeExtraTimeEnabled(fullChargeExtraTimeEnabled ?? true);
      }
    } catch (error) {
      console.error("Failed to parse localStorage data", error);
    }
  }, []);

  useEffect(() => {
    const dataToSave = JSON.stringify({ batterySize, powerVoltage, chargeStartTime, chargeEndTime, remainingBattery, targetBattery, chargerCurrentLoss, chargerCurrentLossEnabled, fullChargeBatteryLevel, fullChargeExtraTime, fullChargeExtraTimeEnabled });
    localStorage.setItem('evChargeCalcData', dataToSave);
  }, [batterySize, powerVoltage, chargeStartTime, chargeEndTime, remainingBattery, targetBattery, chargerCurrentLoss, chargerCurrentLossEnabled, fullChargeBatteryLevel, fullChargeExtraTime, fullChargeExtraTimeEnabled]);

  useEffect(() => {
    const calculateCurrent = () => {
      const chargeTime = calculateChargeTime(chargeStartTime, chargeEndTime);
      const numPowerVoltage = parseFloat(powerVoltage);
      const numBatterySize = parseFloat(batterySize);
      const numTargetBattery = parseFloat(targetBattery);
      const numRemainingBattery = parseFloat(remainingBattery);
      const numFullChargeBatteryLevel = parseFloat(fullChargeBatteryLevel);
      const numFullChargeExtraTime = parseFloat(fullChargeExtraTime);
      const numChargerCurrentLoss = parseFloat(chargerCurrentLoss);

      let effectiveChargeTime = chargeTime;
      if (fullChargeExtraTimeEnabled && numTargetBattery > numFullChargeBatteryLevel && numFullChargeBatteryLevel > numRemainingBattery) {
        const effectiveExtraTime = numFullChargeExtraTime * (numTargetBattery - numFullChargeBatteryLevel) / (100 - numFullChargeBatteryLevel);
        effectiveChargeTime -= effectiveExtraTime;
      }

      if (effectiveChargeTime > 0 && numPowerVoltage > 0) {
        const energyNeeded = (numBatterySize * (numTargetBattery - numRemainingBattery)) / 100;
        const powerNeeded = (energyNeeded / effectiveChargeTime) * 1000;
        let current = powerNeeded / numPowerVoltage;
        if (chargerCurrentLossEnabled && numChargerCurrentLoss > 0) {
          current = current + numChargerCurrentLoss;
        }
        setRequiredCurrent(current);
      } else {
        setRequiredCurrent(0);
      }
    };
    calculateCurrent();
  }, [batterySize, powerVoltage, chargeStartTime, chargeEndTime, remainingBattery, targetBattery, chargerCurrentLoss, chargerCurrentLossEnabled, fullChargeBatteryLevel, fullChargeExtraTime, fullChargeExtraTimeEnabled]);

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
                value={batterySize}
                onChange={handleInputChange(setBatterySize)}
                onBlur={handleInputBlur(setBatterySize)}
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
                value={chargeStartTime}
                onChange={(e) => setChargeStartTime(e.target.value)}
                className="border border-gray-300 rounded-md p-2 w-full"
              />
              <button
                type="button"
                onClick={() => setChargeStartTime(getCurrentTimeValue())}
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
                value={chargeEndTime}
                onChange={(e) => setChargeEndTime(e.target.value)}
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
                value={remainingBattery}
                onChange={handleInputChange(setRemainingBattery)}
                onBlur={handleInputBlur(setRemainingBattery)}
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
                value={targetBattery}
                onChange={handleInputChange(setTargetBattery)}
                onBlur={handleInputBlur(setTargetBattery)}
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
                      value={powerVoltage}
                      onChange={handleInputChange(setPowerVoltage)}
                      onBlur={handleInputBlur(setPowerVoltage)}
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
                      checked={chargerCurrentLossEnabled}
                      onChange={(e) => setChargerCurrentLossEnabled(e.target.checked)}
                    />
                    <label>Charger Loss</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={chargerCurrentLoss}
                      onChange={handleInputChange(setChargerCurrentLoss)}
                      onBlur={handleInputBlur(setChargerCurrentLoss)}
                      onFocus={handleFocus}
                      disabled={!chargerCurrentLossEnabled}
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
                      value={fullChargeBatteryLevel}
                      onChange={handleInputChange(setFullChargeBatteryLevel)}
                      onBlur={handleInputBlur(setFullChargeBatteryLevel)}
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
                      checked={fullChargeExtraTimeEnabled}
                      onChange={(e) => setFullChargeExtraTimeEnabled(e.target.checked)}
                    />
                    <label>Full Charge Extra Time</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={fullChargeExtraTime}
                      onChange={handleInputChange(setFullChargeExtraTime)}
                      onBlur={handleInputBlur(setFullChargeExtraTime)}
                      onFocus={handleFocus}
                      disabled={!fullChargeExtraTimeEnabled}
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
