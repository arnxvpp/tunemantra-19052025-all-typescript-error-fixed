import { Router, Request, Response } from 'express';
import { Storage } from '../storage'; // Import class
import * as ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { CompleteRelease, TrackMetadata } from '../../client/src/lib/metadata-export'; // Assuming this type exists and TrackMetadata too
import { validateRequest } from '../utils/validation';
import { 
  exportFilterSchema, 
  bulkExportSchema, 
  releaseIdParamSchema 
} from '../schemas/admin-export-schemas';
import { ensureAdmin } from '../auth'; // Import ensureAdmin
import { users, releases, tracks, analytics, DistributionPlatform, Track } from '@shared/schema'; // Import necessary tables/types & Track

const router = Router();
// Instantiate storage
const storage = new Storage(); // Create instance

// Admin middleware (ensureAdmin is imported, so this local one can be removed if ensureAdmin does the same)
// const requireAdmin = (req: any, res: Response, next: Function) => {
//   if (!req.user || !req.session.isAdmin) { // Check req.user and potentially req.session.isAdmin
//     return res.status(401).json({ error: 'Unauthorized access' });
//   }
//   next();
// };

// Get all releases for admin export
router.get('/releases', ensureAdmin, validateRequest(exportFilterSchema, 'query'), async (req: Request, res: Response) => {
  try {
    // Get all releases from all users for admin
    const allReleases = await storage.getAllReleases(); // Use the added method
    res.json(allReleases);
  } catch (error) {
    console.error('Error fetching all releases:', error);
    res.status(500).json({ error: 'Failed to fetch releases' });
  }
});

// Get complete release with all details
router.get('/releases/:id/complete', ensureAdmin, validateRequest(releaseIdParamSchema, 'params'), async (req: Request, res: Response) => {
  try {
    const releaseId = parseInt(req.params.id);
    const release = await storage.getReleaseById(releaseId);
    
    if (!release) {
      return res.status(404).json({ error: 'Release not found' });
    }
    
    // Get tracks for this release
    const tracksData = await storage.getTracksByReleaseId(releaseId); // Use the added method
    
    // Format data in the required structure (adjust based on actual schema)
    const completeRelease: CompleteRelease = { // Use the imported type
      metadata: {
        releaseTitle: release.title,
        releaseType: release.type as any || 'Unknown', // Cast type for now
        primaryArtist: release.artistName, // Use artistName
        label: release.labelName, // Use labelName
        // Convert productionYear to string
        productionYear: (new Date(release.releaseDate).getFullYear()).toString(), 
        pLine: `${new Date(release.releaseDate).getFullYear()} ${release.labelName}`, // Derive from releaseDate and labelName
        cLine: `${new Date(release.releaseDate).getFullYear()} ${release.labelName}`, // Derive from releaseDate and labelName
        genre: release.genre,
        originalReleaseDate: new Date(release.releaseDate), // Assuming releaseDate is original
        digitalReleaseDate: new Date(release.releaseDate), // Assuming releaseDate is digital
        parentalAdvisory: false, // Placeholder - remove access to non-existent release.metadata
        clearanceConfirmation: true, // Assuming default
        licensingConfirmation: true, // Assuming default
        agreementConfirmation: true, // Assuming default
        upc: release.upc, // Add UPC
      },
      tracks: tracksData.map((track: Track, index: number): TrackMetadata => ({ // Add Track type and index, return TrackMetadata
        // Access trackNumber from metadata, default to index + 1
        trackNumber: (track.metadata as any)?.trackNumber ?? (index + 1).toString(), 
        trackTitle: track.title,
        primaryArtist: track.artistName || track.artist, // Use artistName or artist
        duration: track.duration?.toString() ?? '0', // Convert number to string, handle null
        isrc: track.isrc || 'Pending', // Provide default
        composer: (track.metadata as any)?.composer || '', // Access metadata safely
        lyricist: (track.metadata as any)?.lyricist || '', // Access metadata safely
        publisher: (track.metadata as any)?.publisher || '', // Access metadata safely
        explicitLyrics: (track.metadata as any)?.explicitLyrics || false, // Access metadata safely
        // ...(track.metadata || {}) // Removed - properties accessed directly if needed
      }))
    };
    
    res.json(completeRelease);
  } catch (error) {
    console.error('Error fetching complete release:', error);
    res.status(500).json({ error: 'Failed to fetch release details' });
  }
});

// Bulk export functionality
router.post('/export/bulk', ensureAdmin, validateRequest(bulkExportSchema), async (req: Request, res: Response) => {
  try {
    const { releases: releaseIds, format: exportFormat, distributorId } = req.body; // Rename format to avoid conflict
    
    // Fetch complete release data for the given IDs
    const completeReleasesData: CompleteRelease[] = [];
    for (const id of releaseIds) {
        const release = await storage.getReleaseById(id);
        if (release) {
            const tracksData = await storage.getTracksByReleaseId(id); // Use the added method
             const completeRelease: CompleteRelease = { // Use the imported type
               metadata: {
                 releaseTitle: release.title,
                 releaseType: release.type as any || 'Unknown', // Cast type for now
                 primaryArtist: release.artistName, // Use artistName
                 label: release.labelName, // Use labelName
                 // Convert productionYear to string
                 productionYear: (new Date(release.releaseDate).getFullYear()).toString(), 
                 pLine: `${new Date(release.releaseDate).getFullYear()} ${release.labelName}`, // Derive from releaseDate and labelName
                 cLine: `${new Date(release.releaseDate).getFullYear()} ${release.labelName}`, // Derive from releaseDate and labelName
                 genre: release.genre,
                 originalReleaseDate: new Date(release.releaseDate), // Assuming releaseDate is original
                 digitalReleaseDate: new Date(release.releaseDate), // Assuming releaseDate is digital
                 parentalAdvisory: false, // Placeholder - remove access to non-existent release.metadata
                 clearanceConfirmation: true, // Assuming default
                 licensingConfirmation: true, // Assuming default
                 agreementConfirmation: true, // Assuming default
                 upc: release.upc, // Add UPC
               },
               tracks: tracksData.map((track: Track, index: number): TrackMetadata => ({ // Add Track type and index, return TrackMetadata
                 // Access trackNumber from metadata, default to index + 1
                 trackNumber: (track.metadata as any)?.trackNumber ?? (index + 1).toString(), 
                 trackTitle: track.title,
                 primaryArtist: track.artistName || track.artist, // Use artistName or artist
                 duration: track.duration?.toString() ?? '0', // Convert number to string, handle null
                 isrc: track.isrc || 'Pending', // Provide default
                 composer: (track.metadata as any)?.composer || '', // Access metadata safely
                 lyricist: (track.metadata as any)?.lyricist || '', // Access metadata safely
                 publisher: (track.metadata as any)?.publisher || '', // Access metadata safely
                 explicitLyrics: (track.metadata as any)?.explicitLyrics || false, // Access metadata safely
                 // ...(track.metadata || {}) // Removed
               }))
             };
            completeReleasesData.push(completeRelease);
        }
    }

    if (completeReleasesData.length === 0) {
        return res.status(404).json({ error: 'No valid releases found for export.' });
    }

    // Get distributor to adapt format if needed
    let distributor: DistributionPlatform | undefined | null = null; // Use correct type
    if (distributorId) {
      try {
        distributor = await storage.getDistributionPlatformById(distributorId);
      } catch (err) {
        console.warn('Distributor not found, using default export format');
      }
    }
    
    // Process based on format
    switch (exportFormat) { // Use renamed variable
      case 'excel':
        return generateExcelExport(completeReleasesData, distributor, res);
      case 'csv':
        return generateCsvExport(completeReleasesData, distributor, res);
      case 'json':
        return generateJsonExport(completeReleasesData, distributor, res);
      case 'xml':
        return generateXmlExport(completeReleasesData, distributor, res);
      case 'ddex':
        return generateDdexExport(completeReleasesData, distributor, res);
      default:
        return res.status(400).json({ error: 'Unsupported export format' });
    }
  } catch (error) {
    console.error('Error processing bulk export:', error);
    res.status(500).json({ error: 'Failed to process export' });
  }
});

// Generate Excel export for releases
async function generateExcelExport(releasesData: CompleteRelease[], distributor: DistributionPlatform | undefined | null, res: Response) { // Use correct type
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Music Distribution Platform';
  workbook.created = new Date();
  
  // Create releases summary sheet
  const releasesSheet = workbook.addWorksheet('Releases');
  releasesSheet.columns = [
    { header: 'Release Title', key: 'title', width: 30 },
    { header: 'Artist', key: 'artist', width: 25 },
    { header: 'UPC', key: 'upc', width: 15 },
    { header: 'Label', key: 'label', width: 20 },
    { header: 'Release Type', key: 'type', width: 15 },
    { header: 'Genre', key: 'genre', width: 15 },
    { header: 'Release Date', key: 'releaseDate', width: 15 },
    { header: 'Tracks', key: 'tracks', width: 10 },
    { header: 'Parental Advisory', key: 'explicit', width: 17 },
    { header: 'Production Year', key: 'productionYear', width: 15 }, // Added back
    { header: 'P-Line', key: 'pLine', width: 30 }, // Added back
    { header: 'C-Line', key: 'cLine', width: 30 } // Added back
  ];
  
  // Add release data
  releasesData.forEach(release => {
    releasesSheet.addRow({
      title: release.metadata.releaseTitle,
      artist: release.metadata.primaryArtist,
      upc: release.metadata.upc || 'Pending',
      label: release.metadata.label,
      type: release.metadata.releaseType,
      genre: release.metadata.genre,
      releaseDate: formatDate(release.metadata.digitalReleaseDate),
      tracks: release.tracks.length,
      explicit: release.metadata.parentalAdvisory ? 'Yes' : 'No',
      productionYear: release.metadata.productionYear, // Added back
      pLine: release.metadata.pLine, // Added back
      cLine: release.metadata.cLine // Added back
    });
  });
  
  // Create tracks sheet
  const tracksSheet = workbook.addWorksheet('Tracks');
  tracksSheet.columns = [
    { header: 'Release Title', key: 'releaseTitle', width: 30 },
    { header: 'Track Number', key: 'trackNumber', width: 13 },
    { header: 'Track Title', key: 'trackTitle', width: 30 },
    { header: 'Artist', key: 'artist', width: 25 },
    { header: 'ISRC', key: 'isrc', width: 15 },
    { header: 'Duration', key: 'duration', width: 10 },
    { header: 'Composer', key: 'composer', width: 25 },
    { header: 'Lyricist', key: 'lyricist', width: 25 },
    { header: 'Publisher', key: 'publisher', width: 25 },
    { header: 'Explicit', key: 'explicit', width: 10 }
  ];
  
  // Add track data
  releasesData.forEach(release => {
    release.tracks.forEach(track => {
      tracksSheet.addRow({
        releaseTitle: release.metadata.releaseTitle,
        trackNumber: track.trackNumber,
        trackTitle: track.trackTitle,
        artist: track.primaryArtist,
        isrc: track.isrc || 'Pending',
        duration: track.duration,
        composer: track.composer || '',
        lyricist: track.lyricist || '',
        publisher: track.publisher || '',
        explicit: track.explicitLyrics ? 'Yes' : 'No'
      });
    });
  });
  
  // Style the headers
  [releasesSheet, tracksSheet].forEach(sheet => {
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  });
  
  // Write to buffer and send
  const buffer = await workbook.xlsx.writeBuffer();
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=music_distribution_export.xlsx');
  res.send(buffer);
}

// Generate CSV export
async function generateCsvExport(releasesData: CompleteRelease[], distributor: DistributionPlatform | undefined | null, res: Response) { // Use correct type
  // Create CSV content
  let csv = "Release Title,Artist,UPC,Label,Release Type,Genre,Release Date,Parental Advisory\n";
  
  // Add release data
  releasesData.forEach(release => {
    csv += `"${escapeCSV(release.metadata.releaseTitle)}","${escapeCSV(release.metadata.primaryArtist)}",`;
    csv += `"${release.metadata.upc || 'Pending'}","${escapeCSV(release.metadata.label)}",`;
    csv += `"${release.metadata.releaseType}","${release.metadata.genre}",`;
    csv += `"${formatDate(release.metadata.digitalReleaseDate)}","${release.metadata.parentalAdvisory ? 'Yes' : 'No'}"\n`;
  });
  
  // Add separator for tracks section
  csv += "\n\nTrack Details\n";
  csv += "Release Title,Track Number,Track Title,Artist,ISRC,Duration,Composer,Lyricist,Explicit\n";
  
  // Add track data
  releasesData.forEach(release => {
    release.tracks.forEach(track => {
      csv += `"${escapeCSV(release.metadata.releaseTitle)}","${track.trackNumber}","${escapeCSV(track.trackTitle)}",`;
      csv += `"${escapeCSV(track.primaryArtist)}","${track.isrc || 'Pending'}","${track.duration}",`;
      csv += `"${escapeCSV(track.composer || '')}","${escapeCSV(track.lyricist || '')}","${track.explicitLyrics ? 'Yes' : 'No'}"\n`;
    });
  });
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=music_distribution_export.csv');
  res.send(csv);
}

// Generate JSON export
function generateJsonExport(releasesData: CompleteRelease[], distributor: DistributionPlatform | undefined | null, res: Response) { // Use correct type
  const exportData = {
    exportDate: new Date().toISOString(),
    releases: releasesData
  };
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=music_distribution_export.json');
  res.json(exportData);
}

// Generate XML export
function generateXmlExport(releasesData: CompleteRelease[], distributor: DistributionPlatform | undefined | null, res: Response) { // Use correct type
  // Simple XML generation
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<MusicDistributionExport>\n';
  xml += `  <ExportDate>${new Date().toISOString()}</ExportDate>\n`;
  xml += '  <Releases>\n';
  
  releasesData.forEach(release => {
    xml += '    <Release>\n';
    xml += `      <ReleaseTitle>${escapeXml(release.metadata.releaseTitle)}</ReleaseTitle>\n`;
    xml += `      <Artist>${escapeXml(release.metadata.primaryArtist)}</Artist>\n`;
    xml += `      <UPC>${release.metadata.upc || 'Pending'}</UPC>\n`;
    xml += `      <Label>${escapeXml(release.metadata.label)}</Label>\n`;
    xml += `      <ReleaseType>${release.metadata.releaseType}</ReleaseType>\n`;
    xml += `      <Genre>${escapeXml(release.metadata.genre)}</Genre>\n`;
    xml += `      <ReleaseDate>${formatDate(release.metadata.digitalReleaseDate)}</ReleaseDate>\n`;
    xml += `      <ParentalAdvisory>${release.metadata.parentalAdvisory ? 'Yes' : 'No'}</ParentalAdvisory>\n`;
    
    xml += '      <Tracks>\n';
    release.tracks.forEach(track => {
      xml += '        <Track>\n';
      xml += `          <TrackNumber>${track.trackNumber}</TrackNumber>\n`;
      xml += `          <TrackTitle>${escapeXml(track.trackTitle)}</TrackTitle>\n`;
      xml += `          <Artist>${escapeXml(track.primaryArtist)}</Artist>\n`;
      xml += `          <ISRC>${track.isrc || 'Pending'}</ISRC>\n`;
      xml += `          <Duration>${track.duration}</Duration>\n`;
      xml += `          <Explicit>${track.explicitLyrics ? 'Yes' : 'No'}</Explicit>\n`;
      xml += '        </Track>\n';
    });
    xml += '      </Tracks>\n';
    xml += '    </Release>\n';
  });
  
  xml += '  </Releases>\n';
  xml += '</MusicDistributionExport>';
  
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Content-Disposition', 'attachment; filename=music_distribution_export.xml');
  res.send(xml);
}

// Generate DDEX export (simplified version)
function generateDdexExport(releasesData: CompleteRelease[], distributor: DistributionPlatform | undefined | null, res: Response) { // Use correct type
  // DDEX is complex, this is a very simplified version
  let ddex = '<?xml version="1.0" encoding="UTF-8"?>\n';
  ddex += '<ern:NewReleaseMessage xmlns:ern="http://ddex.net/xml/ern/382" xmlns:xs="http://www.w3.org/2001/XMLSchema-instance">\n';
  ddex += '  <MessageHeader>\n';
  ddex += `    <MessageId>${uuidv4()}</MessageId>\n`;
  ddex += `    <MessageSender>MusicDistributionPlatform</MessageSender>\n`;
  ddex += `    <MessageCreatedDateTime>${new Date().toISOString()}</MessageCreatedDateTime>\n`;
  ddex += '  </MessageHeader>\n';
  
  ddex += '  <ResourceList>\n';
  // Resources would go here (sound recordings, images, etc.)
  ddex += '  </ResourceList>\n';
  
  ddex += '  <ReleaseList>\n';
  releasesData.forEach(release => {
    ddex += '    <Release>\n';
    ddex += `      <ReleaseId>${release.metadata.upc || uuidv4()}</ReleaseId>\n`;
    ddex += `      <ReleaseType>${ddexReleaseType(release.metadata.releaseType)}</ReleaseType>\n`;
    ddex += `      <ReleaseTitle>${escapeXml(release.metadata.releaseTitle)}</ReleaseTitle>\n`;
    ddex += '    </Release>\n';
  });
  ddex += '  </ReleaseList>\n';
  
  ddex += '</ern:NewReleaseMessage>';
  
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Content-Disposition', 'attachment; filename=music_distribution_export.xml');
  res.send(ddex);
}

// Helper functions for formatting
function formatDate(date: Date): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

function escapeCSV(str: string | undefined | null): string { // Allow undefined/null
  if (!str) return '';
  return str.replace(/"/g, '""');
}

function escapeXml(unsafe: string | undefined | null): string { // Allow undefined/null
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&apos;');
}

function ddexReleaseType(type: string | undefined | null): string { // Allow undefined/null
  // Map our release types to DDEX release types
  switch (type) {
    case 'Album': return 'Album';
    case 'Single': return 'Single';
    case 'EP': return 'EP';
    case 'Compilation': return 'Compilation';
    default: return 'Album';
  }
}

export default router;