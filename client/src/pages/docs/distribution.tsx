
import { DocsLayout } from "./layout";

export default function DistributionDocs() {
  return (
    <DocsLayout>
      <h2>Distribution Guidelines</h2>
      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-semibold mb-3">Platform Requirements</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Spotify: 320kbps MP3 or WAV files</li>
            <li>Apple Music: WAV or AIFF files, 16-bit or higher</li>
            <li>Amazon Music: MP3 (320kbps) or WAV</li>
            <li>YouTube Music: WAV preferred</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Distribution Timeline</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Standard distribution: 2-5 business days</li>
            <li>Priority distribution: 24-48 hours</li>
            <li>Takedown requests: 1-3 business days</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Content Guidelines</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Original content only</li>
            <li>High-quality audio masters</li>
            <li>Complete and accurate metadata</li>
            <li>Appropriate artwork (3000x3000px minimum)</li>
          </ul>
        </section>
      </div>
    </DocsLayout>
  );
}
