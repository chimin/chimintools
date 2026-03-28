
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

export default function EVChargeCalc() {
  const [batterySize, setBatterySize] = useState(0);
  const [powerVoltage, setPowerVoltage] = useState(240);
  const [chargeStartTime, setChargeStartTime] = useState('');
  const [chargeEndTime, setChargeEndTime] = useState('');
  const [remainingBattery, setRemainingBattery] = useState(0);
  const [targetBattery, setTargetBattery] = useState(100);
  const [requiredCurrent, setRequiredCurrent] = useState(0);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem('evChargeCalcData');
      if (savedData) {
        const { batterySize, powerVoltage, chargeStartTime, chargeEndTime, remainingBattery, targetBattery } = JSON.parse(savedData);
        setBatterySize(batterySize);
        setPowerVoltage(powerVoltage);
        setChargeStartTime(chargeStartTime);
        setChargeEndTime(chargeEndTime);
        setRemainingBattery(remainingBattery);
        setTargetBattery(targetBattery);
      }
    } catch (error) {
      console.error("Failed to parse localStorage data", error);
    }
  }, []);

  useEffect(() => {
    const dataToSave = JSON.stringify({ batterySize, powerVoltage, chargeStartTime, chargeEndTime, remainingBattery, targetBattery });
    localStorage.setItem('evChargeCalcData', dataToSave);
  }, [batterySize, powerVoltage, chargeStartTime, chargeEndTime, remainingBattery, targetBattery]);

  useEffect(() => {
    const calculateCurrent = () => {
      const chargeTime = calculateChargeTime(chargeStartTime, chargeEndTime);
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
  }, [batterySize, powerVoltage, chargeStartTime, chargeEndTime, remainingBattery, targetBattery]);

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
            <label className="text-left">Charge Start Time</label>
            <div className="flex items-center">
              <input
                type="time"
                value={chargeStartTime}
                onChange={(e) => setChargeStartTime(e.target.value)}
                className="border border-gray-300 rounded-md p-2 w-full"
              />
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
