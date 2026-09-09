/**
 * @file applications/calculator/engine/UnitConverter.ts
 * @description Local unit conversion engine for 12 categories (zero external API).
 */

import type { UnitCategory } from '../types.js';

export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: 'length',
    name: 'Length',
    units: [
      { id: 'm', name: 'Meters (m)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'km', name: 'Kilometers (km)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'cm', name: 'Centimeters (cm)', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      { id: 'mm', name: 'Millimeters (mm)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'mi', name: 'Miles (mi)', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
      { id: 'yd', name: 'Yards (yd)', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      { id: 'ft', name: 'Feet (ft)', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { id: 'in', name: 'Inches (in)', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
    ],
  },
  {
    id: 'weight',
    name: 'Weight & Mass',
    units: [
      { id: 'kg', name: 'Kilograms (kg)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'g', name: 'Grams (g)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'mg', name: 'Milligrams (mg)', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      { id: 'lb', name: 'Pounds (lb)', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
      { id: 'oz', name: 'Ounces (oz)', toBase: (v) => v * 0.028349523, fromBase: (v) => v / 0.028349523 },
    ],
  },
  {
    id: 'temperature',
    name: 'Temperature',
    units: [
      { id: 'c', name: 'Celsius (°C)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'f', name: 'Fahrenheit (°F)', toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
      { id: 'k', name: 'Kelvin (K)', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
  {
    id: 'area',
    name: 'Area',
    units: [
      { id: 'sq_m', name: 'Square Meters (m²)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'sq_km', name: 'Square Kilometers (km²)', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
      { id: 'sq_ft', name: 'Square Feet (ft²)', toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
      { id: 'acre', name: 'Acres', toBase: (v) => v * 4046.856, fromBase: (v) => v / 4046.856 },
      { id: 'ha', name: 'Hectares', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
    ],
  },
  {
    id: 'volume',
    name: 'Volume',
    units: [
      { id: 'l', name: 'Liters (L)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'ml', name: 'Milliliters (mL)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'cu_m', name: 'Cubic Meters (m³)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'gal', name: 'Gallons (US)', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
    ],
  },
  {
    id: 'time',
    name: 'Time',
    units: [
      { id: 's', name: 'Seconds (s)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'min', name: 'Minutes (min)', toBase: (v) => v * 60, fromBase: (v) => v / 60 },
      { id: 'h', name: 'Hours (h)', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      { id: 'd', name: 'Days (d)', toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
      { id: 'wk', name: 'Weeks (wk)', toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
    ],
  },
  {
    id: 'speed',
    name: 'Speed',
    units: [
      { id: 'mps', name: 'Meters/sec (m/s)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kph', name: 'Kilometers/h (km/h)', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
      { id: 'mph', name: 'Miles/h (mph)', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
      { id: 'knot', name: 'Knots', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
    ],
  },
  {
    id: 'data',
    name: 'Data Storage',
    units: [
      { id: 'b', name: 'Bytes (B)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kb', name: 'Kilobytes (KB)', toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
      { id: 'mb', name: 'Megabytes (MB)', toBase: (v) => v * 1048576, fromBase: (v) => v / 1048576 },
      { id: 'gb', name: 'Gigabytes (GB)', toBase: (v) => v * 1073741824, fromBase: (v) => v / 1073741824 },
      { id: 'tb', name: 'Terabytes (TB)', toBase: (v) => v * 1099511627776, fromBase: (v) => v / 1099511627776 },
    ],
  },
  {
    id: 'pressure',
    name: 'Pressure',
    units: [
      { id: 'pa', name: 'Pascals (Pa)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'bar', name: 'Bar', toBase: (v) => v * 100000, fromBase: (v) => v / 100000 },
      { id: 'psi', name: 'PSI', toBase: (v) => v * 6894.757, fromBase: (v) => v / 6894.757 },
      { id: 'atm', name: 'Atmosphere (atm)', toBase: (v) => v * 101325, fromBase: (v) => v / 101325 },
    ],
  },
  {
    id: 'energy',
    name: 'Energy',
    units: [
      { id: 'j', name: 'Joules (J)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kj', name: 'Kilojoules (kJ)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'cal', name: 'Calories (cal)', toBase: (v) => v * 4.184, fromBase: (v) => v / 4.184 },
      { id: 'kcal', name: 'Kilocalories (kcal)', toBase: (v) => v * 4184, fromBase: (v) => v / 4184 },
      { id: 'wh', name: 'Watt-hours (Wh)', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
    ],
  },
  {
    id: 'power',
    name: 'Power',
    units: [
      { id: 'w', name: 'Watts (W)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kw', name: 'Kilowatts (kW)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'hp', name: 'Horsepower (hp)', toBase: (v) => v * 745.69987, fromBase: (v) => v / 745.69987 },
    ],
  },
  {
    id: 'angle',
    name: 'Angle',
    units: [
      { id: 'deg', name: 'Degrees (°)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'rad', name: 'Radians (rad)', toBase: (v) => (v * 180) / Math.PI, fromBase: (v) => (v * Math.PI) / 180 },
      { id: 'grad', name: 'Gradians (grad)', toBase: (v) => v * 0.9, fromBase: (v) => v / 0.9 },
    ],
  },
];

export class UnitConverter {
  public static convert(
    val: number,
    categoryName: string,
    fromUnitId: string,
    toUnitId: string
  ): number {
    const category = UNIT_CATEGORIES.find((c) => c.id === categoryName || c.name === categoryName);
    if (!category) return val;

    const fromObj = category.units.find((u) => u.id === fromUnitId);
    const toObj = category.units.find((u) => u.id === toUnitId);

    if (!fromObj || !toObj) return val;

    const baseVal = fromObj.toBase(val);
    return toObj.fromBase(baseVal);
  }

  public static getCategories(): string[] {
    return UNIT_CATEGORIES.map((c) => c.name);
  }
}
