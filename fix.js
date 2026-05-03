const fs = require('fs');
const file = 'src/app/c-app/c-map/pages/editor/EditorPropertiesPanel.jsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  {
    target: `<Form.Item label="Parking Name">\r\n                            <Input\r\n                                value={selectedData.parkingName}\r\n                                onChange={(e) => handleChange('parkingName', e)}\r\n                            />\r\n                        </Form.Item>`,
    replacement: `<Form.Item label="Parking Name">\r\n                            <Input\r\n                                value={selectedData.parkingName}\r\n                                onChange={(e) => handleChange('parkingName', e)}\r\n                                disabled={selectedData.status === 1}\r\n                            />\r\n                        </Form.Item>`
  },
  {
    target: `<Form.Item label="Parking Code">\r\n                            <Input\r\n                                value={selectedData.parkingCode}\r\n                                onChange={(e) => handleChange('parkingCode', e)}\r\n                                placeholder="e.g. PK001"\r\n                            />\r\n                        </Form.Item>`,
    replacement: `<Form.Item label="Parking Code">\r\n                            <Input\r\n                                value={selectedData.parkingCode}\r\n                                onChange={(e) => handleChange('parkingCode', e)}\r\n                                placeholder="e.g. PK001"\r\n                                disabled={selectedData.status === 1}\r\n                            />\r\n                        </Form.Item>`
  },
  {
    target: `<Form.Item label="Location">\r\n                            <Input\r\n                                value={selectedData.parkingLocation}\r\n                                onChange={(e) => handleChange('parkingLocation', e)}\r\n                                placeholder="e.g. Phường 8, TP HCM"\r\n                            />\r\n                        </Form.Item>`,
    replacement: `<Form.Item label="Location">\r\n                            <Input\r\n                                value={selectedData.parkingLocation}\r\n                                onChange={(e) => handleChange('parkingLocation', e)}\r\n                                placeholder="e.g. Phường 8, TP HCM"\r\n                                disabled={selectedData.status === 1}\r\n                            />\r\n                        </Form.Item>`
  },
  {
    target: `<Form.Item label="Floor Level">\r\n                            <InputNumber\r\n                                style={{ width: '100%' }}\r\n                                value={selectedData.activeFloorLevel}\r\n                                onChange={(val) => handleChange('activeFloorLevel', val)}\r\n                                placeholder="e.g. -1 for B1, 1 for ground"\r\n                            />\r\n                        </Form.Item>`,
    replacement: `<Form.Item label="Floor Level">\r\n                            <InputNumber\r\n                                style={{ width: '100%' }}\r\n                                value={selectedData.activeFloorLevel}\r\n                                onChange={(val) => handleChange('activeFloorLevel', val)}\r\n                                placeholder="e.g. -1 for B1, 1 for ground"\r\n                                disabled={selectedData.floorStatus === 1}\r\n                            />\r\n                        </Form.Item>`
  },
  {
    target: `<Form.Item label="Measurement Unit">\r\n                            <Select\r\n                                value={selectedData.parkingUnit}\r\n                                onChange={(val) => handleChange('parkingUnit', val)}\r\n                            >`,
    replacement: `<Form.Item label="Measurement Unit">\r\n                            <Select\r\n                                value={selectedData.parkingUnit}\r\n                                onChange={(val) => handleChange('parkingUnit', val)}\r\n                                disabled={selectedData.status === 1}\r\n                            >`
  },
  {
    target: `<Form.Item label={\`1 grid cell = [ \${selectedData.gridRealSize || 2.5} ] \${selectedData.parkingUnit}\`}>\r\n                            <InputNumber\r\n                                style={{ width: '100%' }}\r\n                                value={selectedData.gridRealSize}\r\n                                onChange={(val) => handleChange('gridRealSize', val)}\r\n                                placeholder="e.g. 2.5"\r\n                                step={0.1}\r\n                                min={0.1}\r\n                            />\r\n                        </Form.Item>`,
    replacement: `<Form.Item label={\`1 grid cell = [ \${selectedData.gridRealSize || 2.5} ] \${selectedData.parkingUnit}\`}>\r\n                            <InputNumber\r\n                                style={{ width: '100%' }}\r\n                                value={selectedData.gridRealSize}\r\n                                onChange={(val) => handleChange('gridRealSize', val)}\r\n                                placeholder="e.g. 2.5"\r\n                                step={0.1}\r\n                                min={0.1}\r\n                                disabled={selectedData.status === 1}\r\n                            />\r\n                        </Form.Item>`
  },
  {
    target: `<Form.Item label="Zone Name">\r\n                                    <Input\r\n                                        value={selectedData.name}\r\n                                        onChange={(e) => handleChange('name', e)}\r\n                                    />\r\n                                </Form.Item>`,
    replacement: `<Form.Item label="Zone Name">\r\n                                    <Input\r\n                                        value={selectedData.name}\r\n                                        onChange={(e) => handleChange('name', e)}\r\n                                        disabled={selectedData.status === 1}\r\n                                    />\r\n                                </Form.Item>`
  },
  {
    target: `<Form.Item label="Color">\r\n                                    <ColorPicker\r\n                                        value={selectedData.color || '#3b82f6'}\r\n                                        onChange={(color) => {\r\n                                            const hexString = typeof color === 'string' ? color : color.toHexString();\r\n                                            handleChange('color', hexString);\r\n                                        }}\r\n                                        showText\r\n                                    />\r\n                                </Form.Item>`,
    replacement: `<Form.Item label="Color">\r\n                                    <ColorPicker\r\n                                        value={selectedData.color || '#3b82f6'}\r\n                                        onChange={(color) => {\r\n                                            const hexString = typeof color === 'string' ? color : color.toHexString();\r\n                                            handleChange('color', hexString);\r\n                                        }}\r\n                                        showText\r\n                                        disabled={selectedData.status === 1}\r\n                                    />\r\n                                </Form.Item>`
  }
];

let successCount = 0;
for (const {target, replacement} of replacements) {
    if (content.includes(target)) {
        content = content.replace(target, replacement);
        successCount++;
    } else {
        // Try with \n instead of \r\n
        const targetLF = target.replace(/\r\n/g, '\n');
        const replacementLF = replacement.replace(/\r\n/g, '\n');
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
