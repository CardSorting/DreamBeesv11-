
import os
import re
import json

SOURCE_DIR = "/Users/bozoegg/Downloads/mockup-studio-ai/services/items"
OUTPUT_FILE = "/Users/bozoegg/Desktop/DreamBeesv11/scripts/mockup_data.json"

all_items = []

# Regex to match the object structure
# This is a bit brittle but should work for the consistent formatting seen in print.tsx
# We look for: { ... id: '...', label: '...', ... icon: <Icons.Name />, category: '...' }
# We'll regex specific fields.

def parse_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Simple state machine or chunking to find objects inside the array
    # Looking for objects between { and } inside the export const ... = [ ... ]
    
    # 1. Find the array body
    match = re.search(r'export const \w+: MockupItem\[\] = \[(.*?)\];', content, re.DOTALL)
    if not match:
        return
    
    array_body = match.group(1)
    
    # 2. Split into object chunks roughly
    # This regex looks for { ... } blocks. 
    # It assumes no nested braces inside the object, which holds true for the viewed file.
    object_strings = re.findall(r'\{([^{}]+)\}', array_body, re.DOTALL)
    
    for obj_str in object_strings:
        item = {}
        
        # Extract ID
        id_match = re.search(r"id:\s*['\"]([^'\"]+)['\"]", obj_str)
        if id_match:
            item['id'] = id_match.group(1)
            
        # Extract Label
        label_match = re.search(r"label:\s*['\"]([^'\"]+)['\"]", obj_str)
        if label_match:
            item['label'] = label_match.group(1)
            
        # Extract Description
        desc_match = re.search(r"description:\s*['\"]([^'\"]+)['\"]", obj_str)
        if desc_match:
            item['description'] = desc_match.group(1)
            
        # Extract Category
        cat_match = re.search(r"category:\s*['\"]([^'\"]+)['\"]", obj_str)
        if cat_match:
            item['category'] = cat_match.group(1)

        # Extract Icon Name
        # Looking for icon: <Icons.Name /> or similar
        icon_match = re.search(r"icon:\s*<Icons\.(\w+)\s*/>", obj_str)
        if icon_match:
            item['iconName'] = icon_match.group(1)
        else:
            # Fallback for weird icon formats or defaults
            item['iconName'] = "Box" 

        if 'id' in item and 'label' in item:
            all_items.append(item)

# Walk through directory recursively to include subfolders (e.g. beauty/)
for root, dirs, files in os.walk(SOURCE_DIR):
    for filename in files:
        if filename.endswith(".tsx"):
            filepath = os.path.join(root, filename)
            parse_file(filepath)

# Validating
print(f"Extracted {len(all_items)} items.")

with open(OUTPUT_FILE, 'w') as f:
    json.dump(all_items, f, indent=2)

print(f"Saved to {OUTPUT_FILE}")
