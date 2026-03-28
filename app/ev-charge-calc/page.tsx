
'use client';

import { useState } from 'react';

export default function EVChargeCalc() {
  const [batterySize, setBatterySize] = useState(0);
  const [powerVoltage, setPowerVoltage] = useState(240);
  const [chargeTime, setChargeTime] = useState(0);
  const [remainingBattery, setRemainingBattery] = useState(0);
  const [targetBattery, setTargetBattery] = useState(100);
  const [requiredCurrent, setRequiredCurrent] = useState(0);

  const calculateCurrent = () => {
    const energyNeeded = (batterySize * (targetBattery - remainingBattery)) / 100;
    const powerNeeded = (energyNeeded / chargeTime) * 1000;
    const current = powerNeeded / powerVoltage;
    setRequiredCurrent(current);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold mb-5">EV Charge Calculator</h1>
        <div className="flex flex-col w-1/2">
          <div className="flex justify-between items-center mb-3">
            <label>Car Battery Size (kWh)</label>
            <input
              type="number"
              value={batterySize}
              onChange={(e) => setBatterySize(Number(e.target.value))}
              className="border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="flex justify-between items-center mb-3">
            <label>Power Voltage (V)</label>
            <input
              type="number"
              value={powerVoltage}
              onChange={(e) => setPowerVoltage(Number(e.target.value))}
              className="border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="flex justify-between items-center mb-3">
            <label>Charge Time (hours)</label>
            <input
              type="number"
              value={chargeTime}
              onChange={(e) => setChargeTime(Number(e.target.value))}
              className="border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="flex justify-between items-center mb-3">
            <label>Remaining Battery Level (%)</label>
            <input
              type="number"
              value={remainingBattery}
              onChange={(e) => setRemainingBattery(Number(e.target.value))}
              className="border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="flex justify-between items-center mb-3">
            <label>Target Battery Level (%)</label>
            <input
              type="number"
              value={targetBattery}
              onChange={(e) => setTargetBattery(Number(e.target.value))}
              className="border border-gray-300 rounded-md p-2"
            />
          </div>
          <button
            onClick={calculateCurrent}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Calculate
          </button>
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
