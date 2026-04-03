import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Toggle } from '../components/ui/Toggle';
import { Slider } from '../components/ui/Slider';
import { Badge } from '../components/ui/Badge';
import { useState } from 'react';

export function SettingsPage() {
  const [gpuAccel, setGpuAccel] = useState(true);
  const [maxMemory, setMaxMemory] = useState(4096);
  const [exportFormat, setExportFormat] = useState('tiff');

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div className="mb-2">
          <h1 className="text-xl font-bold text-sp-text">Settings</h1>
          <p className="text-sm text-sp-text-muted mt-1">Application preferences and configuration.</p>
        </div>

        {/* Appearance */}
        <Card title="Appearance">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-sp-text">Color scheme</p>
                <p className="text-xs text-sp-text-muted mt-0.5">UI color theme</p>
              </div>
              <Badge variant="info">Dark only</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-sp-text">Accent color</p>
                <p className="text-xs text-sp-text-muted mt-0.5">Highlight color for UI elements</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-sp-accent border-2 border-sp-border" />
            </div>
          </div>
        </Card>

        {/* Performance */}
        <Card title="Performance">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-sp-text">GPU Acceleration</p>
                <p className="text-xs text-sp-text-muted mt-0.5">Use WebGL for faster rendering</p>
              </div>
              <Toggle checked={gpuAccel} onChange={setGpuAccel} />
            </div>
            <Slider
              label="Max memory"
              value={maxMemory}
              min={512}
              max={16384}
              step={512}
              unit=" MB"
              onChange={setMaxMemory}
            />
          </div>
        </Card>

        {/* File handling */}
        <Card title="File Handling">
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-sp-text">Default export format</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="bg-sp-surface-2 border border-sp-border text-sp-text text-sm rounded-lg px-3 py-2 outline-none"
              >
                <option value="tiff">GeoTIFF (.tif)</option>
                <option value="hdf5">HDF5 (.h5)</option>
                <option value="png">PNG (per band)</option>
                <option value="envi">ENVI (.hdr)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card title="About">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-sp-text-muted">Version</span>
              <span className="font-mono text-sp-text">0.1.0-skeleton</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sp-text-muted">Build</span>
              <span className="font-mono text-sp-text-dim">dev</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sp-text-muted">Company</span>
              <span className="text-sp-text">Spektralion</span>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
