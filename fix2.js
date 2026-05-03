import fs from 'fs';

const file = 'src/app/c-app/c-map/pages/editor/EditorPropertiesPanel.jsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  // SLOT - IoT Sensor
  {
    target: `<Select\r\n                                showSearch\r\n                                value={selectedData.sensorCode || ''}`,
    replacement: `<Select\r\n                                showSearch\r\n                                disabled={selectedData.status !== 'inactive'}\r\n                                value={selectedData.sensorCode || ''}`
  },
  // SLOT - X Position
  {
    target: `<InputNumber\r\n                                        style={{ width: '100%' }}\r\n                                        value={selectedData.x}\r\n                                        onChange={(val) => handleChange('x', val)}\r\n                                    />`,
    replacement: `<InputNumber\r\n                                        style={{ width: '100%' }}\r\n                                        value={selectedData.x}\r\n                                        onChange={(val) => handleChange('x', val)}\r\n                                        disabled={selectedData.status !== 'inactive'}\r\n                                    />`
  },
  // SLOT - Y Position
  {
    target: `<InputNumber\r\n                                        style={{ width: '100%' }}\r\n                                        value={selectedData.y}\r\n                                        onChange={(val) => handleChange('y', val)}\r\n                                    />`,
    replacement: `<InputNumber\r\n                                        style={{ width: '100%' }}\r\n                                        value={selectedData.y}\r\n                                        onChange={(val) => handleChange('y', val)}\r\n                                        disabled={selectedData.status !== 'inactive'}\r\n                                    />`
  },
  // PARKING - Parking Name
  {
    target: `<Input\r\n                                value={selectedData.parkingName}\r\n                                onChange={(e) => handleChange('parkingName', e)}\r\n                            />`,
    replacement: `<Input\r\n                                value={selectedData.parkingName}\r\n                                onChange={(e) => handleChange('parkingName', e)}\r\n                                disabled={selectedData.status !== 0}\r\n                            />`
  },
  // PARKING - Parking Code
  {
    target: `<Input\r\n                                value={selectedData.parkingCode}\r\n                                onChange={(e) => handleChange('parkingCode', e)}\r\n                                placeholder="e.g. PK001"\r\n                            />`,
    replacement: `<Input\r\n                                value={selectedData.parkingCode}\r\n                                onChange={(e) => handleChange('parkingCode', e)}\r\n                                placeholder="e.g. PK001"\r\n                                disabled={selectedData.status !== 0}\r\n                            />`
  },
  // PARKING - Location
  {
    target: `<Input\r\n                                value={selectedData.parkingLocation}\r\n                                onChange={(e) => handleChange('parkingLocation', e)}\r\n                                placeholder="e.g. Phường 8, TP HCM"\r\n                            />`,
    replacement: `<Input\r\n                                value={selectedData.parkingLocation}\r\n                                onChange={(e) => handleChange('parkingLocation', e)}\r\n                                placeholder="e.g. Phường 8, TP HCM"\r\n                                disabled={selectedData.status !== 0}\r\n                            />`
  },
  // PARKING - Floor Level
  {
    target: `<InputNumber\r\n                                style={{ width: '100%' }}\r\n                                value={selectedData.activeFloorLevel}\r\n                                onChange={(val) => handleChange('activeFloorLevel', val)}\r\n                                placeholder="e.g. -1 for B1, 1 for ground"\r\n                            />`,
    replacement: `<InputNumber\r\n                                style={{ width: '100%' }}\r\n                                value={selectedData.activeFloorLevel}\r\n                                onChange={(val) => handleChange('activeFloorLevel', val)}\r\n                                placeholder="e.g. -1 for B1, 1 for ground"\r\n                                disabled={selectedData.floorStatus !== 0}\r\n                            />`
  },
  // PARKING - Measurement Unit
  {
    target: `<Select\r\n                                value={selectedData.parkingUnit}\r\n                                onChange={(val) => handleChange('parkingUnit', val)}\r\n                            >`,
    replacement: `<Select\r\n                                value={selectedData.parkingUnit}\r\n                                onChange={(val) => handleChange('parkingUnit', val)}\r\n                                disabled={selectedData.status !== 0}\r\n                            >`
  },
  // PARKING - Grid Size
  {
    target: `<InputNumber\r\n                                style={{ width: '100%' }}\r\n                                value={selectedData.gridRealSize}\r\n                                onChange={(val) => handleChange('gridRealSize', val)}\r\n                                placeholder="e.g. 2.5"\r\n                                step={0.1}\r\n                                min={0.1}\r\n                            />`,
    replacement: `<InputNumber\r\n                                style={{ width: '100%' }}\r\n                                value={selectedData.gridRealSize}\r\n                                onChange={(val) => handleChange('gridRealSize', val)}\r\n                                placeholder="e.g. 2.5"\r\n                                step={0.1}\r\n                                min={0.1}\r\n                                disabled={selectedData.status !== 0}\r\n                            />`
  },
  // ZONE - Zone Name
  {
    target: `<Input\r\n                                        value={selectedData.name}\r\n                                        onChange={(e) => handleChange('name', e)}\r\n                                    />`,
    replacement: `<Input\r\n                                        value={selectedData.name}\r\n                                        onChange={(e) => handleChange('name', e)}\r\n                                        disabled={selectedData.status !== 0}\r\n                                    />`
  },
  // ZONE - Color
  {
    target: `<ColorPicker\r\n                                        value={selectedData.color || '#3b82f6'}\r\n                                        onChange={(color) => {\r\n                                            const hexString = typeof color === 'string' ? color : color.toHexString();\r\n                                            handleChange('color', hexString);\r\n                                        }}\r\n                                        showText\r\n                                    />`,
    replacement: `<ColorPicker\r\n                                        value={selectedData.color || '#3b82f6'}\r\n                                        onChange={(color) => {\r\n                                            const hexString = typeof color === 'string' ? color : color.toHexString();\r\n                                            handleChange('color', hexString);\r\n                                        }}\r\n                                        showText\r\n                                        disabled={selectedData.status !== 0}\r\n                                    />`
  }
];

let successCount = 0;
for (const {target, replacement} of replacements) {
    if (content.includes(target)) {
        content = content.replace(target, replacement);
        successCount++;
    } else {
        const targetLF = target.replace(/\\r\\n/g, '\\n');
        const replacementLF = replacement.replace(/\\r\\n/g, '\\n');
        if (content.includes(targetLF)) {
            content = content.replace(targetLF, replacementLF);
            successCount++;
        } else {
            console.log("Target not found: ", target.substring(0, 50));
        }
    }
}

fs.writeFileSync(file, content);
console.log('Replacements done: ' + successCount);
