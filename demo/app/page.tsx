import { LiteDashboard, sampleLiteData } from 'meterkit-lite';
import 'meterkit-lite/ui/lite-dashboard.css';

export default function Page() {
  return (
    <main style={{ maxWidth: 1360, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <LiteDashboard data={sampleLiteData} />
    </main>
  );
}
