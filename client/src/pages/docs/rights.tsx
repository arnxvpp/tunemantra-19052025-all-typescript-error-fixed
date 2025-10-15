
import { DocsLayout } from "./layout";

export default function RightsDocs() {
  return (
    <DocsLayout>
      <h2>Rights Management</h2>
      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-semibold mb-3">Copyright Protection</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Automatic content ID matching</li>
            <li>Territory-based rights management</li>
            <li>Revenue collection and distribution</li>
            <li>Dispute resolution support</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Required Documentation</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Proof of rights ownership</li>
            <li>Split sheets for collaborations</li>
            <li>Publisher information</li>
            <li>Mechanical licenses (for covers)</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold mb-3">Royalty Management</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Monthly royalty processing</li>
            <li>Detailed earnings reports</li>
            <li>Multiple payment methods</li>
            <li>Tax documentation handling</li>
          </ul>
        </section>
      </div>
    </DocsLayout>
  );
}
