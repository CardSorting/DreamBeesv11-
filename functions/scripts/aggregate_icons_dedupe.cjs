
const fs = require('fs');
const path = require('path');

const SOURCE_DIR = '/Users/bozoegg/Downloads/mockup-studio-ai 2/components/icons';
const TARGET_FILE = '/Users/bozoegg/Desktop/DreamBeesv11/src/pages/MockupStudio/components/MockupIcons.jsx';

// Base component for icons to ensure consistent styling
const ICON_BASE_COMPONENT = `import React from 'react';

const IconBase = ({ d, children, viewBox = "0 0 24 24", className = "w-6 h-6", ...props }) => (
    <svg 
        className={className} 
        viewBox={viewBox} 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        {...props}
    >
        {d && <path d={d} />}
        {children}
    </svg>
);
`;

async function aggregateIcons() {
    try {
        if (!fs.existsSync(SOURCE_DIR)) {
            console.error(`Directory not found: ${SOURCE_DIR}`);
            return;
        }

        const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.tsx'));

        // Map to store key -> content. 
        // If a key exists, we skip it (or overwrite it, doesn't matter much if they are identical).
        // If they are different, we might lose one, but for "Mouse" icon it probably doesn't matter which one picks.
        const iconMap = new Map();

        console.log(`Found ${files.length} icon files in ${SOURCE_DIR}`);

        for (const file of files) {
            const content = fs.readFileSync(path.join(SOURCE_DIR, file), 'utf8');
            const match = content.match(/export const \w+Icons\s*=\s*({[\s\S]*?});/);

            if (match && match[1]) {
                let objectBody = match[1];
                // Remove outer braces
                let innerContent = objectBody.trim().substring(1, objectBody.trim().length - 1);

                // We need to split by comma, but be careful about commas inside the JSX.
                // This is hard to regex perfectly.
                // Alternative: Split by `\n` and try to find lines that look like `Key: ...`

                // Let's iterate line by line?
                const lines = innerContent.split('\n');
                let currentKey = null;
                let buffer = '';

                for (let line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;

                    // Match start of a key:  Key: () => (
                    const keyMatch = trimmed.match(/^(\w+):\s*\(\)\s*=>\s*\(/);

                    if (keyMatch) {
                        // If we were parsing a previous key, save it
                        if (currentKey) {
                            // finish previous
                            iconMap.set(currentKey, buffer);
                        }
                        currentKey = keyMatch[1];
                        buffer = line + '\n';
                    } else {
                        if (currentKey) {
                            buffer += line + '\n';
                            // If line ends with ), or ), we might be done?
                            // But better to just append until next key or end of string.
                        }
                    }
                }

                // Save last one
                if (currentKey) {
                    iconMap.set(currentKey, buffer);
                }
            }
        }

        let finalFileContent = `import React from 'react';\n\n`;
        finalFileContent += `export const Icons = {\n`;

        for (const [key, content] of iconMap.entries()) {
            let cleanContent = content.trim();
            // Ensure trailing comma for array/object safety
            if (!cleanContent.endsWith(',')) cleanContent += ',';

            finalFileContent += `  // ${key}\n`;
            finalFileContent += `  ${cleanContent}\n`;
        }

        finalFileContent += `};\n`;

        fs.writeFileSync(TARGET_FILE, finalFileContent);
        console.log(`Successfully wrote ${TARGET_FILE} with ${iconMap.size} unique icons.`);

    } catch (error) {
        console.error("Error aggregating icons:", error);
    }
}

aggregateIcons();
