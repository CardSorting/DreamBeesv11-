
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
        let allIcons = {};

        console.log(`Found ${files.length} icon files in ${SOURCE_DIR}`);

        for (const file of files) {
            const content = fs.readFileSync(path.join(SOURCE_DIR, file), 'utf8');

            // Regex to extract the object body: export const SomeIcons = { ... };
            // We want the content inside { }.
            const match = content.match(/export const \w+Icons\s*=\s*({[\s\S]*?});/);

            if (match && match[1]) {
                let objectBody = match[1];

                // We need to parse this object body which contains functions returning JSX.
                // Since we can't easily eval JSX, we will just Extract the Keys and the Function Bodies as strings.
                // Regex to match: Key: () => ( <svg ...> ... </svg> ),

                // This is getting complicated to parse perfectly with regex.
                // Simpler approach: copying the *inner content* of the object and stripping the wrapping object.
                // But we need to merge them.

                // Remove the start "{" and end "};"
                let innerContent = objectBody.trim().substring(1, objectBody.trim().length - 1);

                // Remove existing imports or React usage if accidentally captured? No, we just matched the object.

                // We need to clean up the SVG tags to use IconBase if we want, OR just keep them as is.
                // Keeping them as is is safer.
                // However, they use `className="w-6 h-6"` which might be hardcoded.

                // Let's just append the inner content to our master list string.
                allIcons[file] = innerContent;
            }
        }

        let finalFileContent = `import React from 'react';\n\n`;
        finalFileContent += `export const Icons = {\n`;

        for (const [filename, content] of Object.entries(allIcons)) {
            finalFileContent += `  // From ${filename}\n`;
            // Ensure trailing comma
            finalFileContent += content.trim();
            if (!content.trim().endsWith(',')) finalFileContent += ',';
            finalFileContent += `\n\n`;
        }

        finalFileContent += `};\n`;

        fs.writeFileSync(TARGET_FILE, finalFileContent);
        console.log(`Successfully wrote ${TARGET_FILE}`);

    } catch (error) {
        console.error("Error aggregating icons:", error);
    }
}

aggregateIcons();
