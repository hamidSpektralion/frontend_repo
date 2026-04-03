import { AppShell } from '../components/layout/AppShell';
import { SpectralViewer } from '../components/viewer/SpectralViewer';
import { PipelineSidebar } from '../components/pipeline/PipelineSidebar';

export function ViewerPage() {
  return (
    <AppShell>
      <div className="flex h-[calc(100vh-56px)] overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <SpectralViewer />
        </div>
        <PipelineSidebar />
      </div>
    </AppShell>
  );
}
