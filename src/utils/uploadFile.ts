import type { SpectralDataset } from '../types/spectral';
import { API_BASE } from '../store/viewerStore';

export async function uploadToBackend(
  file: File,
  colormap: string,
  onLoaded: (ds: SpectralDataset) => void,
  onError: (msg: string) => void,
) {
  const form = new FormData();
  form.append('file', file);

  let ingestJson: {
    session_id: string; bands: number; wavelengths: number[];
    width: number; height: number;
  };
  try {
    const res = await fetch(`${API_BASE}/api/ingest`, { method: 'POST', body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      onError(err.detail ?? 'Upload failed');
      return;
    }
    ingestJson = await res.json();
  } catch {
    onError('Cannot reach backend — make sure the server is running.');
    return;
  }

  try {
    const bandRes = await fetch(
      `${API_BASE}/api/band/${ingestJson.session_id}/0?colormap=${colormap}`,
    );
    if (!bandRes.ok) {
      onError('Could not fetch band preview from backend.');
      return;
    }
    const blob = await bandRes.blob();
    const dataUrl = URL.createObjectURL(blob);

    onLoaded({
      id:          ingestJson.session_id,
      name:        file.name.replace(/\.[^.]+$/, ''),
      sessionId:   ingestJson.session_id,
      bands:       ingestJson.bands,
      wavelengths: ingestJson.wavelengths,
      width:       ingestJson.width,
      height:      ingestJson.height,
      dataUrl,
    });
  } catch {
    onError('Failed to fetch band preview.');
  }
}
