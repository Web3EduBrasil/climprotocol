// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IClimProtocol.sol";

/**
 * @title ClimateOracle
 * @dev Chainlink Functions client for fetching climate data from Open-Meteo API
 */
contract ClimateOracle is FunctionsClient, AccessControl, IClimateOracle {
    using FunctionsRequest for FunctionsRequest.Request;
    
    bytes32 public constant ORACLE_REQUESTER_ROLE = keccak256("ORACLE_REQUESTER_ROLE");
    
    // Chainlink Functions parameters
    uint64 public subscriptionId;
    uint32 public gasLimit = 300000;
    bytes32 public donID;
    
    // Request mapping
    mapping(bytes32 => uint256) public requestToEventId;
    mapping(uint256 => bytes32) public eventToRequest;
    mapping(bytes32 => bool) public pendingRequests;
    
    // Response storage
    mapping(uint256 => uint256) public eventPrecipitationData;
    
    // JavaScript source code for Chainlink Functions
    string public constant SOURCE = 
        "const lat = args[0];"
        "const lon = args[1];"
        "const startDate = args[2];"
        "const endDate = args[3];"
        ""
        "const apiResponse = await Functions.makeHttpRequest({"
        "  url: `https://archive-api.open-meteo.com/v1/archive`,"
        "  params: {"
        "    latitude: lat,"
        "    longitude: lon,"
        "    start_date: startDate,"
        "    end_date: endDate,"
        "    daily: 'precipitation_sum',"
        "    timezone: 'UTC'"
        "  }"
        "});"
        ""
        "if (apiResponse.error) {"
        "  throw Error('API request failed');"
        "}"
        ""
        "const data = apiResponse.data;"
        "if (!data.daily || !data.daily.precipitation_sum) {"
        "  throw Error('Invalid response format');"
        "}"
        ""
        "const totalPrecipitation = data.daily.precipitation_sum"
        "  .filter(val => val !== null)"
        "  .reduce((sum, val) => sum + val, 0);"
        ""
        "const precipitationMmScaled = Math.floor(totalPrecipitation * 1000);"
        "return Functions.encodeUint256(precipitationMmScaled);";
    
    event RequestSent(bytes32 indexed requestId, uint256 indexed eventId);
    event RequestFulfilled(bytes32 indexed requestId, uint256 indexed eventId, uint256 precipitationMm);
    event RequestFailed(bytes32 indexed requestId, bytes error);
    
    constructor(
        address router,
        uint64 _subscriptionId,
        bytes32 _donID
    ) FunctionsClient(router) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_REQUESTER_ROLE, msg.sender);
        
        subscriptionId = _subscriptionId;
        donID = _donID;
    }
    
    /**
     * @dev Requests climate data for a specific event
     * @param eventId The climate event ID
     * @param latitude Latitude in degrees (scaled by 1e6)
     * @param longitude Longitude in degrees (scaled by 1e6)  
     * @param startTime Start timestamp
     * @param endTime End timestamp
     */
    function requestClimateData(
        uint256 eventId,
        int256 latitude,
        int256 longitude,
        uint256 startTime,
        uint256 endTime
    ) external override onlyRole(ORACLE_REQUESTER_ROLE) returns (bytes32) {
        require(eventToRequest[eventId] == bytes32(0), "Request already pending for event");
        
        // Convert parameters to strings for API call
        string[] memory args = new string[](4);
        args[0] = _int256ToString(latitude, 6); // Convert to decimal degrees
        args[1] = _int256ToString(longitude, 6); // Convert to decimal degrees
        args[2] = _timestampToDateString(startTime);
        args[3] = _timestampToDateString(endTime);
        
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(SOURCE);
        req.setArgs(args);
        
        bytes32 requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donID
        );
        
        requestToEventId[requestId] = eventId;
        eventToRequest[eventId] = requestId;
        pendingRequests[requestId] = true;
        
        emit RequestSent(requestId, eventId);
        emit ClimateDataRequested(requestId, eventId);
        
        return requestId;
    }
    
    /**
     * @dev Callback function for Chainlink Functions responses
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        require(pendingRequests[requestId], "Request not pending");
        
        pendingRequests[requestId] = false;
        uint256 eventId = requestToEventId[requestId];
        
        if (err.length > 0) {
            emit RequestFailed(requestId, err);
            return;
        }
        
        uint256 precipitationMm = abi.decode(response, (uint256));
        eventPrecipitationData[eventId] = precipitationMm;
        
        emit RequestFulfilled(requestId, eventId, precipitationMm);
        emit ClimateDataReceived(requestId, eventId, precipitationMm);
    }
    
    /**
     * @dev Updates subscription ID (admin only)
     */
    function updateSubscriptionId(uint64 _subscriptionId) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        subscriptionId = _subscriptionId;
    }
    
    /**
     * @dev Updates DON ID (admin only)
     */
    function updateDonId(bytes32 _donID) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        donID = _donID;
    }
    
    /**
     * @dev Updates gas limit (admin only)
     */
    function updateGasLimit(uint32 _gasLimit) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(_gasLimit <= 300000, "Gas limit too high");
        gasLimit = _gasLimit;
    }
    
    /**
     * @dev Converts int256 to string with decimal places
     */
    function _int256ToString(int256 value, uint8 decimals) 
        internal 
        pure 
        returns (string memory) 
    {
        if (value == 0) return "0";
        
        bool negative = value < 0;
        uint256 absValue = negative ? uint256(-value) : uint256(value);
        
        uint256 divisor = 10 ** decimals;
        uint256 integerPart = absValue / divisor;
        uint256 fractionalPart = absValue % divisor;
        
        string memory intStr = _uint256ToString(integerPart);
        string memory fracStr = _uint256ToString(fractionalPart);
        
        // Pad fractional part with leading zeros
        while (bytes(fracStr).length < decimals) {
            fracStr = string(abi.encodePacked("0", fracStr));
        }
        
        string memory result = string(abi.encodePacked(intStr, ".", fracStr));
        return negative ? string(abi.encodePacked("-", result)) : result;
    }
    
    /**
     * @dev Converts uint256 to string
     */
    function _uint256ToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
    
    /**
     * @dev Converts timestamp to YYYY-MM-DD format
     */
    function _timestampToDateString(uint256 timestamp) 
        internal 
        pure 
        returns (string memory) 
    {
        // Simplified implementation - in production, use a proper date library  
        // For now, assume format is handled by the calling contract
        return _uint256ToString(timestamp);
    }
    
    /**
     * @dev Returns precipitation data for an event
     */
    function getPrecipitationData(uint256 eventId) 
        external 
        view 
        returns (uint256) 
    {
        return eventPrecipitationData[eventId];
    }
}