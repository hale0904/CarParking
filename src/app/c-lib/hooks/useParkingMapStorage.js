import { useState, useEffect } from 'react';

const STORAGE_KEY = 'smartparking_map_data';

export const useParkingMapStorage = () => {
    const [mapData, setMapData] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    });

    const saveMap = (data) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setMapData(data);
        window.dispatchEvent(new Event('parkingMapUpdated'));
    };

    const loadMap = () => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    };

    return { mapData, saveMap, loadMap };
};
