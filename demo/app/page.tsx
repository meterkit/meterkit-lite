import { LiteDashboard, sampleLiteData } from 'meterkit-lite';
import 'meterkit-lite/ui/lite-dashboard.css';

export default function Page() {
  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1>meterkit-lite</h1>
      <LiteDashboard data={sampleLiteData} />
    </main>
  );
}
