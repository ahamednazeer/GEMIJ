import React, { useState } from 'react';
import { SketchPicker, ColorResult } from 'react-color';

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
    label?: string;
    presetColors?: string[];
}

const ColorPicker: React.FC<ColorPickerProps> = ({
    value,
    onChange,
    label = 'Color',
    presetColors = [
        '#1e40af', '#3b82f6', '#60a5fa', // Blues
        '#059669', '#10b981', '#34d399', // Greens
        '#dc2626', '#ef4444', '#f87171', // Reds
        '#7c3aed', '#8b5cf6', '#a78bfa', // Purples
        '#ea580c', '#f97316', '#fb923c', // Oranges
        '#64748b', '#94a3b8', '#cbd5e1', // Grays
    ]
}) => {
    const [showPicker, setShowPicker] = useState(false);

    const handleChange = (color: ColorResult) => {
        onChange(color.hex);
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">{label}</label>

            <div className="flex items-center gap-3">
                {/* Color Preview Button */}
                <button
                    type="button"
                    onClick={() => setShowPicker(!showPicker)}
                    className="relative w-12 h-12 rounded-lg border-2 border-slate-300 shadow-sm hover:border-blue-400 transition-colors overflow-hidden"
                    style={{ backgroundColor: value }}
                >
                    {!value && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
                            Pick
                        </div>
                    )}
                </button>

                {/* Hex Input */}
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    maxLength={7}
                />
            </div>

            {/* Color Picker Popover */}
            {showPicker && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowPicker(false)}
                    />
                    <div className="absolute z-20 mt-2">
                        <SketchPicker
                            color={value}
                            onChange={handleChange}
                            presetColors={presetColors}
                            disableAlpha
                        />
                    </div>
                </>
            )}

            {/* Preset Colors */}
            <div className="flex flex-wrap gap-2">
                {presetColors.map((color) => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => onChange(color)}
                        className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${value === color ? 'border-blue-600 ring-2 ring-blue-200' : 'border-slate-200'
                            }`}
                        style={{ backgroundColor: color }}
                        title={color}
                    />
                ))}
            </div>
        </div>
    );
};

export default ColorPicker;
