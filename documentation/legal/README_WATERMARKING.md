# TuneMantra Source Code Watermarking System

This document provides guidance on implementing and using the source code watermarking system for TuneMantra's blockchain-powered music distribution platform.

## Overview

The watermarking system consists of two main components:
1. A watermarking tool that applies subtle, developer-specific markers to source code
2. A detection tool that can analyze potentially leaked code to identify its source

These tools work together to help protect TuneMantra's valuable intellectual property when sharing code with outsourced developers.

## Getting Started

### Setup Requirements

1. Node.js and npm/yarn installed
2. TypeScript installed (`npm install -g typescript ts-node`)
3. Commander.js for CLI functionality (`npm install commander`)

### Installation

The watermarking system is already integrated into the TuneMantra project structure:

```
scripts/
  └── utils/
      ├── watermark_code.ts       # Tool for applying watermarks
      └── detect_watermarks.ts    # Tool for detecting watermarks
documentation/
  └── legal/
      ├── CODE_WATERMARKING_GUIDE.md    # Detailed guide to watermarking techniques
      └── README_WATERMARKING.md        # This file
```

## Usage

### Step 1: Initialize Developer Database

Before using the watermarking system, you need to create a database of developers who will receive code:

```json
// developer-watermarks.json
[
  {
    "id": "dev-001",
    "name": "John Smith",
    "email": "john.smith@example.com",
    "hash": "ac83f72e"
  },
  {
    "id": "dev-002",
    "name": "Alice Johnson",
    "email": "alice.johnson@example.com",
    "hash": "b47d19c3"
  }
]
```

You can generate the hash values using:

```typescript
const crypto = require('crypto');
const hash = crypto.createHash('sha256').update('dev-001').digest('hex').substring(0, 8);
```

### Step 2: Apply Watermarks Before Sharing Code

When you're ready to share code with a specific developer, create a watermarked copy:

```bash
# Create a watermarked version for a specific developer
npx ts-node scripts/utils/watermark_code.ts \
  --developer-id dev-001 \
  --output-dir ./watermarked-code-dev001 \
  --source-dir ./src \
  --patterns comments,whitespace,variables,strings
```

### Step 3: Share Only the Watermarked Version

- Always provide developers with their specific watermarked version
- Never share the original, unwatermarked code
- Ensure each developer receives a uniquely watermarked version

### Step 4: If a Leak Occurs, Run Detection

If you discover code that may have been leaked, use the detection tool:

```bash
# Analyze suspected leaked code
npx ts-node scripts/utils/detect_watermarks.ts \
  --source-dir ./suspected-leaked-code \
  --developer-db ./developer-watermarks.json \
  --threshold 60
```

The tool will analyze the code and determine which developer's watermarked version it most closely matches.

## Key Watermarking Techniques

The watermarking system uses multiple complementary techniques:

1. **Developer-specific comments**: Hidden identifier comments
2. **Whitespace patterns**: Unique indentation patterns
3. **Variable naming variations**: Subtle differences in variable names
4. **Error message markers**: Embedded identifiers in strings
5. **Algorithm implementations**: Functionally identical but structurally different code

For a detailed explanation of each technique, see `CODE_WATERMARKING_GUIDE.md`.

## Maintenance and Management

For ongoing management of the watermarking system:

1. **Regularly update watermarking techniques** to stay ahead of detection attempts
2. **Keep the developer database secure** as it contains the mapping between watermarks and developers
3. **Document which version was shared** with each developer for future reference
4. **Consider rotating watermarks** for long-term engagements
5. **Test watermark detection** periodically to ensure effectiveness

## Legal Integration

The watermarking system should be referenced in legal agreements with developers:

1. Mention in the NDA that code contains traceable identifiers
2. Include language prohibiting any attempt to remove or alter watermarks
3. Specify that the presence of TuneMantra watermarks in unauthorized code constitutes evidence of a breach

See the sample clause in `CODE_WATERMARKING_GUIDE.md` for suggested legal language.

## Security Considerations

1. **Keep watermarking tools confidential** - do not share with developers
2. **Apply watermarks just before sharing** code to minimize exposure
3. **Use multiple watermarking techniques** in combination for redundancy
4. **Test watermarked code** to ensure it functions identically to the original
5. **Store watermark-to-developer mappings** securely

## Limitations

Be aware of these limitations:

1. Determined developers might detect and remove obvious watermarks
2. False positives are possible in detection
3. Watermarking may slightly complicate code maintenance
4. Watermarks may be diluted if developers make substantial modifications

Using multiple watermarking techniques in combination helps mitigate these limitations.

## Support and Further Information

For additional information about the watermarking system, refer to:

- `CODE_WATERMARKING_GUIDE.md` - Detailed explanation of techniques
- `OUTSOURCED_DEVELOPER_GUIDELINES.md` - General guidelines for outsourced developers
- `DEVELOPER_NDA.md` - Non-disclosure agreement template

For assistance with the watermarking system, contact the TuneMantra security team.