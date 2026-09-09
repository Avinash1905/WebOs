import { Volume2, VolumeX, Sun } from 'lucide-react';
import { useQuickSettingsStore } from '../../stores/quickSettingsStore';
import { Slider } from '../../ui/Slider/Slider';

export const QuickSettingsSliders = () => {
  const volume = useQuickSettingsStore((state) => state.volume);
  const brightness = useQuickSettingsStore((state) => state.brightness);
  const isMuted = useQuickSettingsStore((state) => state.isMuted);
  const setVolume = useQuickSettingsStore((state) => state.setVolume);
  const setBrightness = useQuickSettingsStore((state) => state.setBrightness);
  const toggleMute = useQuickSettingsStore((state) => state.toggleMute);

  return (
    <div className="os-qs-sliders">
      {/* Brightness Slider */}
      <div className="os-qs-slider-row">
        <button
          className="os-qs-slider-btn"
          onClick={() => setBrightness(brightness > 50 ? 20 : 100)}
          title="Adjust display brightness"
        >
          <Sun size={18} />
        </button>
        <div className="os-qs-slider-track">
          <Slider
            min={10}
            max={100}
            step={1}
            value={brightness}
            onChange={setBrightness}
            aria-label="Display Brightness"
          />
        </div>
      </div>

      {/* Volume Slider */}
      <div className="os-qs-slider-row">
        <button
          className="os-qs-slider-btn"
          onClick={toggleMute}
          title={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <div className="os-qs-slider-track">
          <Slider
            min={0}
            max={100}
            step={1}
            value={isMuted ? 0 : volume}
            onChange={(val) => {
              if (isMuted) toggleMute();
              setVolume(val);
            }}
            aria-label="System Volume"
          />
        </div>
      </div>
    </div>
  );
};
