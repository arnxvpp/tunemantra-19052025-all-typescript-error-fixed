import ExcelJS from 'exceljs';

// Export format types
export type ExportFormat = "csv" | "json" | "xml" | "ddex" | "excel";

// Interface for complete release information
export interface CompleteRelease {
  metadata: ReleaseMetadata;
  tracks: TrackMetadata[];
}

export interface ReleaseMetadata {
  releaseTitle: string;
  releaseType: "Album" | "Single" | "EP" | "Compilation" | "Remix";
  primaryArtist: string;
  label: string;
  productionYear: string;
  pLine: string;
  cLine: string;
  genre: string;
  originalReleaseDate: Date;
  digitalReleaseDate: Date;
  parentalAdvisory: boolean;
  clearanceConfirmation: boolean;
  licensingConfirmation: boolean;
  agreementConfirmation: boolean;
  upc?: string;
  [key: string]: any; // Allow additional fields
}

export interface TrackMetadata {
  trackNumber: string;
  trackTitle: string;
  primaryArtist: string;
  isrc?: string;
  duration: string;
  composer?: string;
  lyricist?: string;
  publisher?: string;
  explicitLyrics?: boolean;
  [key: string]: any; // Allow additional fields
}

/**
 * Export metadata for a specific format
 * @param release The complete release data
 * @param format The export format
 * @param distributorId Optional distributor ID to customize export for specific distributor requirements
 */
export function exportMetadata(
  release: CompleteRelease, 
  format: ExportFormat = "csv", 
  distributorId?: string,
  useTemplate: boolean = false
) {
  // We could use distributorId to customize the export data based on distributor requirements
  // For example, certain distributors might require specific metadata fields
  
  switch (format) {
    case "excel":
      return exportToExcel(release, distributorId, useTemplate);
    case "csv":
      return exportToCsv(release, distributorId);
    case "json":
      return exportToJson(release, distributorId);
    case "xml":
      return exportToXml(release, distributorId);
    case "ddex":
      return exportToDdex(release, distributorId);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Export release data to Excel format
 * @param release The complete release data
 * @param distributorId Optional distributor ID to customize export format
 */
function exportToExcel(release: CompleteRelease, distributorId?: string, useTemplate: boolean = false) {
  // If using template, call the template-based export function
  if (useTemplate) {
    return exportUsingTemplate(release, distributorId);
  }
  
  // Create workbook with two sheets
  const workbook = new ExcelJS.Workbook();
  
  // Customize export based on distributor if specified
  let customizedFields: [string, string][] = [];
  
  if (distributorId) {
    // Add distributor-specific fields or modify existing ones
    switch (distributorId) {
      case 'spotify':
        customizedFields = [
          ["Spotify Artist URL", ""],
          ["Spotify Canvas", "Not provided"]
        ];
        break;
      case 'apple_music':
        customizedFields = [
          ["iTunes Plus", "Yes"],
          ["Apple Digital Master", "No"]
        ];
        break;
      case 'gaana':
      case 'jiosaavn':
      case 'wynk':
        // Indian streaming services - could add specific metadata fields
        customizedFields = [
          ["Primary Language", "Hindi"],
          ["Indian Category", "Bollywood"]
        ];
        break;
    }
  }
  
  // Create release metadata sheet
  const releaseSheet = workbook.addWorksheet('Release Info');
  
  // Add metadata
  const releaseData = [
    ["Release Title", release.metadata.releaseTitle],
    ["Artist", release.metadata.primaryArtist],
    ["Type", release.metadata.releaseType],
    ["UPC", release.metadata.upc || "Pending"],
    ["Label", release.metadata.label],
    ["Genre", release.metadata.genre],
    ["Original Release Date", formatDate(release.metadata.originalReleaseDate)],
    ["Digital Release Date", formatDate(release.metadata.digitalReleaseDate)],
    ["Production Year", release.metadata.productionYear],
    ["P-Line", release.metadata.pLine],
    ["C-Line", release.metadata.cLine],
    ["Parental Advisory", release.metadata.parentalAdvisory ? "Yes" : "No"],
    ...customizedFields
  ];
  
  releaseData.forEach((row, rowIndex) => {
    releaseSheet.addRow(row);
    // Add some basic formatting
    const dataRow = releaseSheet.getRow(rowIndex + 1);
    dataRow.getCell(1).font = { bold: true };
  });
  
  // Create tracks sheet
  const tracksSheet = workbook.addWorksheet('Tracks');
  
  // Add header row with styling
  const trackHeaders = ["Track Number", "Title", "Artist", "ISRC", "Duration", "Explicit"];
  const headerRow = tracksSheet.addRow(trackHeaders);
  headerRow.font = { bold: true };
  
  // Add track data
  release.tracks.forEach(track => {
    tracksSheet.addRow([
      track.trackNumber,
      track.trackTitle,
      track.primaryArtist,
      track.isrc || "Pending",
      track.duration,
      track.explicitLyrics ? "Yes" : "No"
    ]);
  });
  
  // Auto-size columns for better readability
  try {
    if (tracksSheet.columns) {
      tracksSheet.columns.forEach(column => {
        if (column && typeof column.eachCell === 'function') {
          let maxLength = 0;
          try {
            column.eachCell({ includeEmpty: true }, cell => {
              if (cell && cell.value) {
                const length = cell.value.toString().length;
                if (length > maxLength) {
                  maxLength = length;
                }
              }
            });
            column.width = maxLength < 10 ? 10 : maxLength + 2;
          } catch (err) {
            console.error('Error auto-sizing column:', err);
            // Set a default width if auto-sizing fails
            column.width = 12;
          }
        }
      });
    }
  } catch (err) {
    console.error('Error during column auto-sizing:', err);
  }
  
  // Generate filename
  let filename = `${release.metadata.releaseTitle.replace(/[^\w]+/g, "_")}.xlsx`;
  
  // Add distributor prefix to filename if provided
  if (distributorId && distributorId !== 'none') {
    const baseName = filename.substring(0, filename.lastIndexOf('.'));
    const extension = filename.substring(filename.lastIndexOf('.'));
    filename = `${baseName}_${distributorId}${extension}`;
  }
  
  // Write and download
  workbook.xlsx.writeBuffer()
    .then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    })
    .catch(err => {
      console.error('Error creating Excel file:', err);
    });
}

/**
 * Export release data to CSV format
 * @param release The complete release data
 * @param distributorId Optional distributor ID to customize export format
 */
function exportToCsv(release: CompleteRelease, distributorId?: string) {
  // Create CSV content for release
  let csv = "Release Information\n";
  csv += "Field,Value\n";
  csv += `"Release Title","${escapeCSV(release.metadata.releaseTitle)}"\n`;
  csv += `"Artist","${escapeCSV(release.metadata.primaryArtist)}"\n`;
  csv += `"Type","${release.metadata.releaseType}"\n`;
  csv += `"UPC","${release.metadata.upc || "Pending"}"\n`;
  csv += `"Label","${escapeCSV(release.metadata.label)}"\n`;
  csv += `"Genre","${escapeCSV(release.metadata.genre)}"\n`;
  csv += `"Original Release Date","${formatDate(release.metadata.originalReleaseDate)}"\n`;
  csv += `"Digital Release Date","${formatDate(release.metadata.digitalReleaseDate)}"\n`;
  csv += `"Production Year","${release.metadata.productionYear}"\n`;
  csv += `"P-Line","${escapeCSV(release.metadata.pLine)}"\n`;
  csv += `"C-Line","${escapeCSV(release.metadata.cLine)}"\n`;
  csv += `"Parental Advisory","${release.metadata.parentalAdvisory ? "Yes" : "No"}"\n`;
  
  // Add distributor-specific fields
  if (distributorId) {
    switch (distributorId) {
      case 'spotify':
        csv += `"Spotify Artist URL",""\n`;
        csv += `"Spotify Canvas","Not provided"\n`;
        break;
      case 'apple_music':
        csv += `"iTunes Plus","Yes"\n`;
        csv += `"Apple Digital Master","No"\n`;
        break;
      case 'gaana':
      case 'jiosaavn':
      case 'wynk':
        // Indian streaming services - add specific metadata
        csv += `"Primary Language","Hindi"\n`;
        csv += `"Indian Category","Bollywood"\n`;
        break;
      case 'amazon_music':
        csv += `"HD Audio","Yes"\n`;
        csv += `"Spatial Audio","No"\n`;
        break;
      case 'youtube_music':
        csv += `"Video ID",""\n`;
        csv += `"Content ID",""\n`;
        break;
    }
  }
  
  // Add tracks section
  csv += "\n\nTracks\n";
  csv += "Track Number,Title,Artist,ISRC,Duration,Explicit\n";
  
  release.tracks.forEach(track => {
    csv += `"${track.trackNumber}","${escapeCSV(track.trackTitle)}","${escapeCSV(track.primaryArtist)}",`;
    csv += `"${track.isrc || "Pending"}","${track.duration}","${track.explicitLyrics ? "Yes" : "No"}"\n`;
  });
  
  // Create and download file
  downloadFile(csv, `${release.metadata.releaseTitle.replace(/[^\w]+/g, "_")}.csv`, 'text/csv', distributorId);
}

/**
 * Export release data to JSON format
 * @param release The complete release data
 * @param distributorId Optional distributor ID to customize export format
 */
function exportToJson(release: CompleteRelease, distributorId?: string) {
  // Create a deep copy of the release to modify
  const releaseCopy = JSON.parse(JSON.stringify(release));
  
  // Add distributor-specific fields if needed
  if (distributorId) {
    if (!releaseCopy.metadata.distributorMetadata) {
      releaseCopy.metadata.distributorMetadata = {};
    }
    
    switch (distributorId) {
      case 'spotify':
        releaseCopy.metadata.distributorMetadata.spotify = {
          artistUrl: '',
          canvas: 'Not provided',
          premiumOnly: false
        };
        break;
      case 'apple_music':
        releaseCopy.metadata.distributorMetadata.apple = {
          itunesPlus: true,
          digitalMaster: false,
          dolbyAtmos: false
        };
        break;
      case 'gaana':
      case 'jiosaavn':
      case 'wynk':
        releaseCopy.metadata.distributorMetadata.indian = {
          primaryLanguage: 'Hindi',
          category: 'Bollywood',
          regionalFlag: true
        };
        break;
      case 'amazon_music':
        releaseCopy.metadata.distributorMetadata.amazon = {
          hdAudio: true,
          spatialAudio: false,
          ultraHD: false
        };
        break;
      case 'youtube_music':
        releaseCopy.metadata.distributorMetadata.youtube = {
          videoId: '',
          contentId: '',
          artTrackGenerated: true
        };
        break;
    }
  }
  
  const jsonStr = JSON.stringify(releaseCopy, null, 2);
  downloadFile(jsonStr, `${release.metadata.releaseTitle.replace(/[^\w]+/g, "_")}.json`, 'application/json', distributorId);
}

/**
 * Export release data to XML format
 * @param release The complete release data
 * @param distributorId Optional distributor ID to customize export format
 */
function exportToXml(release: CompleteRelease, distributorId?: string) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<MusicRelease>\n';
  
  // Add release metadata
  xml += '  <ReleaseInfo>\n';
  xml += `    <Title>${escapeXml(release.metadata.releaseTitle)}</Title>\n`;
  xml += `    <Artist>${escapeXml(release.metadata.primaryArtist)}</Artist>\n`;
  xml += `    <Type>${release.metadata.releaseType}</Type>\n`;
  xml += `    <UPC>${release.metadata.upc || "Pending"}</UPC>\n`;
  xml += `    <Label>${escapeXml(release.metadata.label)}</Label>\n`;
  xml += `    <Genre>${escapeXml(release.metadata.genre)}</Genre>\n`;
  xml += `    <OriginalReleaseDate>${formatDate(release.metadata.originalReleaseDate)}</OriginalReleaseDate>\n`;
  xml += `    <DigitalReleaseDate>${formatDate(release.metadata.digitalReleaseDate)}</DigitalReleaseDate>\n`;
  xml += `    <ProductionYear>${release.metadata.productionYear}</ProductionYear>\n`;
  xml += `    <PLine>${escapeXml(release.metadata.pLine)}</PLine>\n`;
  xml += `    <CLine>${escapeXml(release.metadata.cLine)}</CLine>\n`;
  xml += `    <ParentalAdvisory>${release.metadata.parentalAdvisory ? "Yes" : "No"}</ParentalAdvisory>\n`;
  
  // Add distributor-specific metadata
  if (distributorId) {
    xml += '    <DistributorSpecificMetadata>\n';
    
    switch (distributorId) {
      case 'spotify':
        xml += '      <SpotifyMetadata>\n';
        xml += '        <ArtistUrl></ArtistUrl>\n';
        xml += '        <Canvas>Not provided</Canvas>\n';
        xml += '        <PremiumOnly>false</PremiumOnly>\n';
        xml += '      </SpotifyMetadata>\n';
        break;
      case 'apple_music':
        xml += '      <AppleMetadata>\n';
        xml += '        <ItunesPlus>true</ItunesPlus>\n';
        xml += '        <DigitalMaster>false</DigitalMaster>\n';
        xml += '        <DolbyAtmos>false</DolbyAtmos>\n';
        xml += '      </AppleMetadata>\n';
        break;
      case 'gaana':
      case 'jiosaavn':
      case 'wynk':
        xml += '      <IndianMetadata>\n';
        xml += '        <PrimaryLanguage>Hindi</PrimaryLanguage>\n';
        xml += '        <Category>Bollywood</Category>\n';
        xml += '        <RegionalFlag>true</RegionalFlag>\n';
        xml += '      </IndianMetadata>\n';
        break;
      case 'amazon_music':
        xml += '      <AmazonMetadata>\n';
        xml += '        <HDAudio>true</HDAudio>\n';
        xml += '        <SpatialAudio>false</SpatialAudio>\n';
        xml += '        <UltraHD>false</UltraHD>\n';
        xml += '      </AmazonMetadata>\n';
        break;
      case 'youtube_music':
        xml += '      <YouTubeMetadata>\n';
        xml += '        <VideoID></VideoID>\n';
        xml += '        <ContentID></ContentID>\n';
        xml += '        <ArtTrackGenerated>true</ArtTrackGenerated>\n';
        xml += '      </YouTubeMetadata>\n';
        break;
    }
    
    xml += '    </DistributorSpecificMetadata>\n';
  }
  
  xml += '  </ReleaseInfo>\n';
  
  // Add tracks
  xml += '  <Tracks>\n';
  release.tracks.forEach(track => {
    xml += '    <Track>\n';
    xml += `      <TrackNumber>${track.trackNumber}</TrackNumber>\n`;
    xml += `      <Title>${escapeXml(track.trackTitle)}</Title>\n`;
    xml += `      <Artist>${escapeXml(track.primaryArtist)}</Artist>\n`;
    xml += `      <ISRC>${track.isrc || "Pending"}</ISRC>\n`;
    xml += `      <Duration>${track.duration}</Duration>\n`;
    xml += `      <Explicit>${track.explicitLyrics ? "Yes" : "No"}</Explicit>\n`;
    xml += '    </Track>\n';
  });
  xml += '  </Tracks>\n';
  
  xml += '</MusicRelease>';
  
  downloadFile(xml, `${release.metadata.releaseTitle.replace(/[^\w]+/g, "_")}.xml`, 'application/xml', distributorId);
}

/**
 * Export release data to DDEX format (simplified)
 * @param release The complete release data
 * @param distributorId Optional distributor ID to customize export format
 */
function exportToDdex(release: CompleteRelease, distributorId?: string) {
  // This is a highly simplified DDEX format for demo purposes
  // Actual DDEX format is much more complex and standardized
  let ddex = '<?xml version="1.0" encoding="UTF-8"?>\n';
  ddex += '<ern:NewReleaseMessage xmlns:ern="http://ddex.net/xml/ern/382" xmlns:xs="http://www.w3.org/2001/XMLSchema-instance">\n';
  ddex += '  <MessageHeader>\n';
  ddex += `    <MessageId>${generateUUID()}</MessageId>\n`;
  
  // Add distributor-specific sender information if known
  if (distributorId) {
    switch (distributorId) {
      case 'spotify':
        ddex += '    <MessageSender>MusicDistributionPlatform-Spotify</MessageSender>\n';
        ddex += '    <MessageRecipient>Spotify</MessageRecipient>\n';
        break;
      case 'apple_music':
        ddex += '    <MessageSender>MusicDistributionPlatform-Apple</MessageSender>\n';
        ddex += '    <MessageRecipient>AppleMusic</MessageRecipient>\n';
        break;
      case 'amazon_music':
        ddex += '    <MessageSender>MusicDistributionPlatform-Amazon</MessageSender>\n';
        ddex += '    <MessageRecipient>AmazonMusic</MessageRecipient>\n';
        break;
      default:
        ddex += '    <MessageSender>MusicDistributionPlatform</MessageSender>\n';
    }
  } else {
    ddex += '    <MessageSender>MusicDistributionPlatform</MessageSender>\n';
  }
  
  ddex += `    <MessageCreatedDateTime>${new Date().toISOString()}</MessageCreatedDateTime>\n`;
  
  // Add distributor-specific DDEX version or other metadata
  if (distributorId) {
    switch (distributorId) {
      case 'spotify':
        ddex += '    <MessageControlType>SpotifySpecificFeed</MessageControlType>\n';
        break;
      case 'apple_music':
        ddex += '    <MessageControlType>AppleITunesSpecificFeed</MessageControlType>\n';
        break;
      case 'amazon_music':
        ddex += '    <MessageControlType>AmazonMusicSpecificFeed</MessageControlType>\n';
        break;
    }
  }
  
  ddex += '  </MessageHeader>\n';
  
  ddex += '  <ResourceList>\n';
  // SoundRecordings
  release.tracks.forEach((track, index) => {
    ddex += '    <SoundRecording>\n';
    ddex += `      <SoundRecordingId>${track.isrc || `TEMP${index+1}`}</SoundRecordingId>\n`;
    ddex += `      <ResourceReference>A${index+1}</ResourceReference>\n`;
    ddex += `      <Title>${escapeXml(track.trackTitle)}</Title>\n`;
    ddex += `      <Duration>${track.duration}</Duration>\n`;
    ddex += `      <ParentalWarningType>${track.explicitLyrics ? "Explicit" : "None"}</ParentalWarningType>\n`;
    ddex += '    </SoundRecording>\n';
  });
  ddex += '  </ResourceList>\n';
  
  ddex += '  <ReleaseList>\n';
  ddex += '    <Release>\n';
  ddex += `      <ReleaseId>${release.metadata.upc || generateUUID()}</ReleaseId>\n`;
  ddex += `      <ReleaseType>${getDdexReleaseType(release.metadata.releaseType)}</ReleaseType>\n`;
  ddex += `      <Title>${escapeXml(release.metadata.releaseTitle)}</Title>\n`;
  ddex += `      <ReleaseDate>${formatDate(release.metadata.digitalReleaseDate)}</ReleaseDate>\n`;
  ddex += `      <ParentalWarningType>${release.metadata.parentalAdvisory ? "Explicit" : "None"}</ParentalWarningType>\n`;
  
  // Add tracks to release
  ddex += '      <ReleaseResourceReferenceList>\n';
  release.tracks.forEach((track, index) => {
    ddex += `        <ReleaseResourceReference>A${index+1}</ReleaseResourceReference>\n`;
  });
  ddex += '      </ReleaseResourceReferenceList>\n';
  
  ddex += '    </Release>\n';
  ddex += '  </ReleaseList>\n';
  
  ddex += '</ern:NewReleaseMessage>';
  
  downloadFile(ddex, `${release.metadata.releaseTitle.replace(/[^\w]+/g, "_")}_ddex.xml`, 'application/xml', distributorId);
}

// Helper functions

/**
 * Export using a predefined Excel template
 * @param release The complete release data
 * @param distributorId Optional distributor ID to customize export format
 */
function exportUsingTemplate(release: CompleteRelease, distributorId?: string) {
  // The path to the template - in a real production environment, this would be fetched from storage
  // For this implementation, we'll use the standard template
  
  // Load template via fetch API
  fetch('/attached_assets/METADATA-NEW-TEMPLATE-EN.xlsx')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Template file not found: ${response.status}`);
      }
      return response.arrayBuffer();
    })
    .then(async (arrayBuffer) => {
      // Load the template with ExcelJS
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      
      // Get the metadata sheet (assuming it's the first one)
      const metadataSheet = workbook.getWorksheet(1);
      const tracksSheet = workbook.getWorksheet(2) || workbook.getWorksheet(1);
      
      // Map our data to the template - this is a simplified example
      
      // Update metadata sheet with release info
      if (metadataSheet) {
        // Common fields in our template using cell references
        metadataSheet.getCell('B2').value = release.metadata.releaseTitle; // Release Title
        metadataSheet.getCell('B3').value = release.metadata.primaryArtist; // Artist
        metadataSheet.getCell('B4').value = release.metadata.releaseType; // Release Type
        metadataSheet.getCell('B5').value = release.metadata.upc || 'Pending'; // UPC
        metadataSheet.getCell('B6').value = release.metadata.label; // Label
        metadataSheet.getCell('B7').value = release.metadata.genre; // Genre
        metadataSheet.getCell('B8').value = formatDate(release.metadata.originalReleaseDate); // Original Release Date
        metadataSheet.getCell('B9').value = formatDate(release.metadata.digitalReleaseDate); // Digital Release Date
        metadataSheet.getCell('B10').value = release.metadata.productionYear; // Production Year
        metadataSheet.getCell('B11').value = release.metadata.pLine; // P-Line
        metadataSheet.getCell('B12').value = release.metadata.cLine; // C-Line
        metadataSheet.getCell('B13').value = release.metadata.parentalAdvisory ? 'Yes' : 'No'; // Parental Advisory
        
        // Add distributor-specific fields if needed
        if (distributorId) {
          switch (distributorId) {
            case 'spotify':
              metadataSheet.getCell('B14').value = 'Not specified'; // Spotify Artist URL
              metadataSheet.getCell('B15').value = 'Not provided'; // Spotify Canvas
              break;
            case 'apple_music':
              metadataSheet.getCell('B14').value = 'Yes'; // iTunes Plus
              metadataSheet.getCell('B15').value = 'No'; // Apple Digital Master
              break;
            // Add more distributor-specific mappings as needed
          }
        }
      }
      
      // Update tracks sheet with track info
      if (tracksSheet) {
        // Starting row for tracks (skip header)
        let rowIndex = 2;
        
        release.tracks.forEach(track => {
          // Set cell values for each track
          tracksSheet.getCell(`A${rowIndex}`).value = track.trackNumber; // Track Number
          tracksSheet.getCell(`B${rowIndex}`).value = track.trackTitle; // Title
          tracksSheet.getCell(`C${rowIndex}`).value = track.primaryArtist; // Artist
          tracksSheet.getCell(`D${rowIndex}`).value = track.isrc || 'Pending'; // ISRC
          tracksSheet.getCell(`E${rowIndex}`).value = track.duration; // Duration
          tracksSheet.getCell(`F${rowIndex}`).value = track.explicitLyrics ? 'Yes' : 'No'; // Explicit
          
          rowIndex++;
        });
      }
      
      // Generate filename
      let filename = `${release.metadata.releaseTitle.replace(/[^\w]+/g, "_")}_template.xlsx`;
      
      // Add distributor prefix to filename if provided
      if (distributorId && distributorId !== 'none') {
        const baseName = filename.substring(0, filename.lastIndexOf('.'));
        const extension = filename.substring(filename.lastIndexOf('.'));
        filename = `${baseName}_${distributorId}${extension}`;
      }
      
      // Write and download the file
      workbook.xlsx.writeBuffer()
        .then(buffer => {
          const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          window.URL.revokeObjectURL(url);
        });
    })
    .catch(error => {
      console.error('Error loading Excel template:', error);
      // Fallback to standard export if template fails to load
      exportToExcel(release, distributorId, false);
    });
}

/**
 * Format date to YYYY-MM-DD
 * @param date The date to format
 * @returns Formatted date string in YYYY-MM-DD format
 */
function formatDate(date: Date): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Escape CSV special characters
 */
function escapeCSV(str: string): string {
  if (!str) return '';
  return str.replace(/"/g, '""');
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate a UUID for DDEX MessageId
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Map our release types to DDEX release types
 */
function getDdexReleaseType(type: string): string {
  switch (type) {
    case 'Album': return 'Album';
    case 'Single': return 'Single';
    case 'EP': return 'EP';
    case 'Compilation': return 'Compilation';
    default: return 'Album';
  }
}

/**
 * Download a file with given content, filename and type
 * @param content The file content
 * @param filename Base filename without extension
 * @param type MIME type of the file
 * @param distributorId Optional distributor ID to include in the filename
 */
function downloadFile(content: string, filename: string, type: string, distributorId?: string) {
  // Add distributor prefix to filename if provided
  let finalFilename = filename;
  if (distributorId && distributorId !== 'none') {
    // Extract the filename without extension
    const dotIndex = filename.lastIndexOf('.');
    const baseName = dotIndex !== -1 ? filename.substring(0, dotIndex) : filename;
    const extension = dotIndex !== -1 ? filename.substring(dotIndex) : '';
    
    // Add distributor prefix
    finalFilename = `${baseName}_${distributorId}${extension}`;
  }
  
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', finalFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}