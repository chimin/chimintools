
'use client';

import { useState, useEffect } from 'react';

export default function EVChargeCalc() {
  const [batterySize, setBatterySize] = useState(0);
  const [powerVoltage, setPowerVoltage] = useState(240);
  const [chargeTime, setChargeTime] = useState(0);
  const [remainingBattery, setRemainingBattery] = useState(0);
  const [targetBattery, setTargetBattery] = useState(100);
  const [requiredCurrent, setRequiredCurrent] = useState(0);

  useEffect(() => {
    const calculateCurrent = () => {
      if (chargeTime > 0 && powerVoltage > 0) {
        const energyNeeded = (batterySize * (targetBattery - remainingBattery)) / 100;
        const powerNeeded = (energyNeeded / chargeTime) * 1000;
        const current = powerNeeded / powerVoltage;
        setRequiredCurrent(current);
      } else {
        setRequiredCurrent(0);
      }
    };
    calculateCurrent();
  }, [batterySize, powerVoltage, chargeTime, remainingBattery, targetBattery]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold mb-5">EV Charge Calculator</h1>
        <div className="flex flex-col w-full md:w-1/2">
          <div className="flex flex-col mb-3">
            <label className="text-left">Car Battery Size</label>
            <div className="flex items-center">
              <input
                type="number"
                value={batterySize}
                onChange={(e) => setBatterySize(Number(e.target.value))}
                className="border border-gray-300 rounded-md p-2 w-full"
              />
              <span className="ml-2">kWh</span>
            </div>
          </div>
          <div className="flex flex-col mb-3">
            <label className="text-left">Power Voltage</label>
            <div className="flex items-center">
              <input
                type="number"
                value={powerVoltage}
                onChange={(e) => setPowerVoltage(Number(e.target.value))}
                className="border border-gray-300 rounded-md p-2 w-full"
              />
              <span className="ml-2">V</span>
            </div>
          </div>
          <div className="flex flex-col mb-3">
            <label className="text-left">Charge Time</label>
            <div className="flex items-center">
              <input
                type="number"
                value={chargeTime}
                onChange={(e) => setChargeTime(Number(e.target.value))}
                className="border border-gray-300 rounded-md p-2 w-full"
              />
              <span className="ml-2">hours</span>
            </div>
          </div>
          <div className="flex flex-col mb-3">
            <label className="text-left">Remaining Battery Level</label>
            <div className="flex items-center">
              <input
                type="number"
                value={remainingBattery}
                onChange={(e) => setRemainingBattery(Number(e.target.value))}
                className="border border-gray-300 rounded-md p-2 w-full"
              />
              <span className="ml-2">%</span>
            </div>
          </div>
          <div className="flex flex-col mb-3">
            <label className="text-left">Target Battery Level</label>
            <div className="flex items-center">
              <input
                type="number"
                value={targetBattery}
                onChange={(e) => setTargetBattery(Number(e.target.value))}
                className="border border-gray-300 rounded-md p-2 w-full"
              />
              <span className="ml-2">%</span>
            </div>
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
