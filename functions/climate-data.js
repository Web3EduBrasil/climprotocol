// Chainlink Functions JavaScript source code for climate data retrieval
// This function queries Open-Meteo API for historical precipitation data

// Arguments expected:
// args[0]: latitude (string, decimal degrees)
// args[1]: longitude (string, decimal degrees)  
// args[2]: start date (string, YYYY-MM-DD format)
// args[3]: end date (string, YYYY-MM-DD format)

if (args.length !== 4) {
  throw Error("Exactly 4 arguments required: lat, lon, startDate, endDate");
}

const lat = args[0];
const lon = args[1];
const startDate = args[2];
const endDate = args[3];

// Validate input parameters
if (!lat || !lon || !startDate || !endDate) {
  throw Error("All parameters must be provided");
}

// Validate date format (basic check)
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
  throw Error("Dates must be in YYYY-MM-DD format");
}

// Build API request to Open-Meteo Historical Weather API
const apiResponse = await Functions.makeHttpRequest({
  url: "https://archive-api.open-meteo.com/v1/archive",
  method: "GET",
  params: {
    latitude: lat,
    longitude: lon,
    start_date: startDate,
    end_date: endDate,
    daily: "precipitation_sum",
    timezone: "UTC"
  },
  timeout: 9000
});

// Check for API errors
if (apiResponse.error) {
  console.error("API Error:", apiResponse.error);
  throw Error(`Request failed: ${apiResponse.error}`);
}

const data = apiResponse.data;

// Validate response structure
if (!data || !data.daily || !data.daily.precipitation_sum) {
  console.error("Invalid response structure:", data);
  throw Error("Invalid API response structure");
}

// Extract precipitation data
const precipitationArray = data.daily.precipitation_sum;

// Handle null values and calculate total precipitation
let totalPrecipitation = 0;
let validDays = 0;

for (let i = 0; i < precipitationArray.length; i++) {
  const precipitation = precipitationArray[i];
  
  // Open-Meteo returns null for missing data
  if (precipitation !== null && precipitation !== undefined) {
    totalPrecipitation += precipitation;
    validDays++;
  }
}

// Ensure we have some valid data
if (validDays === 0) {
  throw Error("No valid precipitation data available for the specified period");
}

// Convert to millimeters scaled by 1000 (to handle decimal precision on-chain)
// Open-Meteo returns precipitation in mm, so we multiply by 1000
const precipitationMmScaled = Math.floor(totalPrecipitation * 1000);

// Validate result
if (precipitationMmScaled < 0) {
  throw Error("Invalid precipitation value calculated");
}

// Return the scaled precipitation value as uint256
return Functions.encodeUint256(precipitationMmScaled);