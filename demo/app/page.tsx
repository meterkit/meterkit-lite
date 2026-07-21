import { LiteDashboard, sampleLiteData } from 'meterkit-lite';
import 'meterkit-lite/ui/lite-dashboard.css';
import { DemoShell } from './DemoShell';

export default function Page() {
  return (
    <DemoShell>
      <LiteDashboard data={sampleLiteData} />
    </DemoShell>
  );
}
