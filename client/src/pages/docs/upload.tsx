
import { DocsLayout } from "./layout";

export default function UploadDocs() {
  return (
    <DocsLayout>
      <h2>Upload Guidelines</h2>
      <ul>
        <li>WAV format only</li>
        <li>Sample rate: 44.1kHz or 48kHz</li>
        <li>Bit depth: 16-bit or 24-bit</li>
        <li>Maximum file size: 100MB</li>
        <li>No silence longer than 5 seconds</li>
        <li>Complete and accurate metadata</li>
        <li>Rights verification required</li>
      </ul>
      
      <h3>Metadata Requirements</h3>
      <ul>
        <li>Track title</li>
        <li>Artist name(s)</li>
        <li>Release date</li>
        <li>Genre</li>
        <li>ISRC (if available)</li>
        <li>Publishing information</li>
      </ul>
    </DocsLayout>
  );
}
