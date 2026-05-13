export const getPrefixFromZoneName = (zoneName = '') => {
  const name = zoneName.trim();
  if (!name) return 'Z';

  // Rule 1: If name is 1–2 chars, use directly
  if (name.length <= 2) return name.toUpperCase();

  const words = name.split(/\s+/);
  const lastWord = words[words.length - 1];

  // Rule 2: If the last word is a single letter → it IS the identifier
  // "Zone A" → "A", "Khu B" → "B", "Area C" → "C"
  if (/^[A-Za-z]$/.test(lastWord)) {
    return lastWord.toUpperCase();
  }

  // Rule 3: If the last word is a pure number → prefix = initials of preceding words + number
  // "Area 1" → "A1", "Khu Vực 2" → "KV2"
  if (/^\d+$/.test(lastWord)) {
    const initials = words
      .slice(0, -1)
      .map(w => w[0]?.toUpperCase())
      .filter(Boolean)
      .join('')
      .slice(0, 2);
    return initials + lastWord;
  }

  // Rule 4: Fallback — first letter of each word, max 3 chars
  return words
    .map(w => w[0]?.toUpperCase())
    .filter(Boolean)
    .join('')
    .slice(0, 3);
};

export function buildZonePrefixMap(zones) {
  const map = {};
  const rawPrefixMap = {};

  for (const zone of zones) {
    const rawPrefix = getPrefixFromZoneName(zone.name);
    if (!rawPrefixMap[rawPrefix]) {
      rawPrefixMap[rawPrefix] = [];
    }
    rawPrefixMap[rawPrefix].push(zone.id);
  }

  for (const rawPrefix in rawPrefixMap) {
    const zoneIds = rawPrefixMap[rawPrefix];
    if (zoneIds.length === 1) {
      map[zoneIds[0]] = rawPrefix;
    } else {
      zoneIds.forEach((id, index) => {
        map[id] = `${rawPrefix}${index + 1}`;
      });
    }
  }

  return map;
}

export function getNextSlotIndexInZone(zone, prefix) {
  let maxUsed = 0;

  if (zone && zone.slotGroups) {
    for (const group of zone.slotGroups) {
      if (!group.slots) continue;
      for (const slot of group.slots) {
        if (!slot.code) continue;

        if (slot.code.startsWith(prefix)) {
          const remaining = slot.code.substring(prefix.length);
          const match = remaining.match(/^(\d+)/);
          if (match) {
            maxUsed = Math.max(maxUsed, parseInt(match[1], 10));
          }
        }
      }
    }
  }

  return maxUsed + 1;
}

export function generateSlotsWithZonePrefix(count, zonePrefix, startIndex) {
  return Array.from({ length: count }).map((_, i) => ({
    id: `slot-${Date.now()}-${startIndex + i}`,
    code: `${zonePrefix}${startIndex + i}`,
    status: 'unassigned',
    sensorId: null,
    sensorCode: null,
    sensorStatus: null,
  }));
}
