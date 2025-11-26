import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';

export interface Bridge {
    id: string;
    lat: number;
    long: number;
    name: string;
    condition: string;
    yearBuilt?: string;
    facilityCarried?: string;
    featuresDesc?: string;
    location?: string;
    averageDailyTraffic?: string;
    structureLength?: string;
    deckWidth?: string;
    lastInspectionDate?: string;
    owner?: string;
}

const DATA_PATH = path.join(__dirname, '../data/AL23.txt');

// Helper to convert NBI coordinate string to decimal degrees
// Format: DDDMMSSXX (Lat) or DDDMMSSXX (Long)
// NBI 2023:
// Item 16 (Lat): 8 digits. DDMMSSXX.
// Item 17 (Long): 9 digits. DDDMMSSXX.
function parseCoordinate(coord: string, isLong: boolean): number {
    if (!coord) return 0;
    const cleanCoord = coord.trim();
    if (cleanCoord.length < 8) return 0;

    // Parse from right to left to handle variable lengths if any, 
    // but NBI is fixed width usually.
    // XX: last 2 digits (centi-seconds)
    // SS: next 2 digits
    // MM: next 2 digits
    // DDD/DD: remaining digits

    const len = cleanCoord.length;
    const xx = parseInt(cleanCoord.substring(len - 2), 10);
    const ss = parseInt(cleanCoord.substring(len - 4, len - 2), 10);
    const mm = parseInt(cleanCoord.substring(len - 6, len - 4), 10);
    const dd = parseInt(cleanCoord.substring(0, len - 6), 10);

    if (isNaN(dd) || isNaN(mm) || isNaN(ss) || isNaN(xx)) return 0;

    const seconds = ss + (xx / 100);
    let decimal = dd + (mm / 60) + (seconds / 3600);

    // Longitude in US is West, so negative.
    if (isLong) {
        decimal = -decimal;
    }

    return decimal;
}

function getCondition(record: any): string {
    // Items 58, 59, 60, 62.
    // Codes: 9-0 (N for Not Applicable).
    // 7-9: Good
    // 5-6: Fair
    // 0-4: Poor
    // We take the minimum of the applicable ratings.

    const ratings = [
        record.DECK_COND_058,
        record.SUPERSTRUCTURE_COND_059,
        record.SUBSTRUCTURE_COND_060,
        record.CULVERT_COND_062
    ];

    let minRating = 99;
    let hasRating = false;

    for (const r of ratings) {
        const val = r ? r.trim() : 'N';
        if (val === 'N' || val === '') continue;
        const num = parseInt(val, 10);
        if (!isNaN(num)) {
            if (num < minRating) minRating = num;
            hasRating = true;
        }
    }

    if (!hasRating) return 'Unknown';
    if (minRating >= 7) return 'Good';
    if (minRating >= 5) return 'Fair';
    return 'Poor';
}

export const loadBridges = async (): Promise<Bridge[]> => {
    const bridges: Bridge[] = [];

    const parser = fs.createReadStream(DATA_PATH).pipe(parse({
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true // NBI files sometimes have loose quotes
    }));

    for await (const record of parser) {
        const id = record.STRUCTURE_NUMBER_008;
        const latStr = record.LAT_016;
        const longStr = record.LONG_017;
        const name = record.FEATURES_DESC_006A || record.FACILITY_CARRIED_007;

        const lat = parseCoordinate(latStr, false);
        const long = parseCoordinate(longStr, true);

        if (lat === 0 && long === 0) continue;

        bridges.push({
            id,
            lat,
            long,
            name,
            condition: getCondition(record),
            yearBuilt: record.YEAR_BUILT_027 || undefined,
            facilityCarried: record.FACILITY_CARRIED_007 || undefined,
            featuresDesc: record.FEATURES_DESC_006A || undefined,
            location: record.LOCATION_009 || undefined,
            averageDailyTraffic: record.ADT_029 || undefined,
            structureLength: record.STRUCTURE_LEN_MT_049 || undefined,
            deckWidth: record.DECK_WIDTH_MT_052 || undefined,
            lastInspectionDate: record.DATE_OF_INSPECT_090 || undefined,
            owner: record.OWNER_022 || undefined
        });
    }

    return bridges;
};
