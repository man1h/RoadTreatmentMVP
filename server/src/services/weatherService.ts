import axios from 'axios';

// NOAA API endpoint for alerts
const NOAA_ALERTS_API = 'https://api.weather.gov/alerts/active?area=AL';

export const getWeatherAlerts = async () => {
    try {
        const response = await axios.get(NOAA_ALERTS_API, {
            headers: {
                'User-Agent': '(roadtreatmentmvp.com, contact@roadtreatmentmvp.com)'
            }
        });

        return response.data.features.map((feature: any) => ({
            id: feature.properties.id,
            areaDesc: feature.properties.areaDesc,
            event: feature.properties.event,
            severity: feature.properties.severity,
            description: feature.properties.description,
            instruction: feature.properties.instruction,
            effective: feature.properties.effective,
            expires: feature.properties.expires
        }));
    } catch (error) {
        console.error('Error fetching weather alerts:', error);
        return [];
    }
};

// Mock function for road surface temp (since sensors aren't available yet)
export const getRoadConditions = async (lat: number, long: number) => {
    // In a real app, this would query a specific API or sensor network
    // For MVP, we'll return mock data based on air temp from a weather API
    return {
        surfaceTemp: 34, // Mock value
        condition: 'Wet', // Dry, Wet, Icy, Snowy
        riskLevel: 'Low'
    };
};
