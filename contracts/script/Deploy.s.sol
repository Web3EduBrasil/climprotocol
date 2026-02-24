// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import "../src/ClimProtocol.sol";
import "../src/core/ClimateEventToken.sol";
import "../src/core/ClimateEventFactory.sol";
import "../src/core/LiquidityPool.sol";
import "../src/core/SettlementEngine.sol";
import "../src/oracle/ClimateOracle.sol";

/**
 * @title Deploy
 * @dev Deployment script for Clim Protocol contracts
 */
contract Deploy is Script {
    // Sepolia Chainlink Functions addresses
    address constant FUNCTIONS_ROUTER =
        0xb83E47C2bC239B3bf370bc41e1459A34b41238D0;
    bytes32 constant DON_ID =
        0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;

    // Default subscription ID (you need to create this first)
    uint64 constant SUBSCRIPTION_ID = 1; // Replace with your actual subscription ID

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying Clim Protocol contracts...");
        console.log("Deployer:", vm.addr(deployerPrivateKey));

        // 1. Deploy ClimateEventToken
        console.log("Deploying ClimateEventToken...");
        ClimateEventToken climateToken = new ClimateEventToken();
        console.log("ClimateEventToken deployed at:", address(climateToken));

        // 2. Deploy LiquidityPool
        console.log("Deploying LiquidityPool...");
        LiquidityPool liquidityPool = new LiquidityPool();
        console.log("LiquidityPool deployed at:", address(liquidityPool));

        // 3. Deploy ClimateOracle
        console.log("Deploying ClimateOracle...");
        ClimateOracle oracle = new ClimateOracle(
            FUNCTIONS_ROUTER,
            SUBSCRIPTION_ID,
            DON_ID
        );
        console.log("ClimateOracle deployed at:", address(oracle));

        // 4. Deploy SettlementEngine
        console.log("Deploying SettlementEngine...");
        SettlementEngine settlementEngine = new SettlementEngine(
            address(climateToken),
            address(liquidityPool),
            address(oracle)
        );
        console.log("SettlementEngine deployed at:", address(settlementEngine));

        // 5. Deploy ClimateEventFactory
        console.log("Deploying ClimateEventFactory...");
        ClimateEventFactory factory = new ClimateEventFactory(
            address(climateToken),
            address(liquidityPool),
            address(settlementEngine)
        );
        console.log("ClimateEventFactory deployed at:", address(factory));

        // 6. Deploy main ClimProtocol contract
        console.log("Deploying ClimProtocol...");
        ClimProtocol protocol = new ClimProtocol(
            address(climateToken),
            address(factory),
            address(liquidityPool),
            address(settlementEngine),
            address(oracle)
        );
        console.log("ClimProtocol deployed at:", address(protocol));

        // 7. Setup roles and permissions
        console.log("Setting up roles and permissions...");

        // Grant roles to contracts
        climateToken.grantRole(climateToken.MINTER_ROLE(), address(factory));
        climateToken.grantRole(
            climateToken.SETTLER_ROLE(),
            address(settlementEngine)
        );

        liquidityPool.grantRole(
            liquidityPool.POOL_MANAGER_ROLE(),
            address(factory)
        );
        liquidityPool.grantRole(
            liquidityPool.POOL_MANAGER_ROLE(),
            address(settlementEngine)
        );

        oracle.grantRole(
            oracle.ORACLE_REQUESTER_ROLE(),
            address(settlementEngine)
        );

        settlementEngine.grantRole(
            settlementEngine.AUTOMATION_ROLE(),
            vm.addr(deployerPrivateKey)
        );
        settlementEngine.grantRole(
            settlementEngine.AUTOMATION_ROLE(),
            address(factory)
        );

        factory.grantRole(
            factory.EVENT_CREATOR_ROLE(),
            vm.addr(deployerPrivateKey)
        );

        console.log("Setup completed!");

        vm.stopBroadcast();

        // Log all deployed addresses for frontend configuration
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Network: Sepolia");
        console.log("ClimProtocol:", address(protocol));
        console.log("ClimateEventToken:", address(climateToken));
        console.log("ClimateEventFactory:", address(factory));
        console.log("LiquidityPool:", address(liquidityPool));
        console.log("SettlementEngine:", address(settlementEngine));
        console.log("ClimateOracle:", address(oracle));

        console.log("\n=== NEXT STEPS ===");
        console.log(
            "1. Add ClimateOracle as consumer to your Chainlink Functions subscription"
        );
        console.log(
            "2. Fund the subscription with LINK tokens (minimum 2 LINK)"
        );
        console.log("3. Register SettlementEngine for Chainlink Automation");
        console.log("4. Fund the automation upkeep with LINK tokens");
        console.log("5. Provide initial liquidity to the pool");
        console.log("6. Update frontend configuration with these addresses");

        // Write addresses to file for frontend
        string memory addresses = string(
            abi.encodePacked(
                "NEXT_PUBLIC_PROTOCOL_ADDRESS=",
                vm.toString(address(protocol)),
                "\n",
                "NEXT_PUBLIC_TOKEN_ADDRESS=",
                vm.toString(address(climateToken)),
                "\n",
                "NEXT_PUBLIC_FACTORY_ADDRESS=",
                vm.toString(address(factory)),
                "\n",
                "NEXT_PUBLIC_POOL_ADDRESS=",
                vm.toString(address(liquidityPool)),
                "\n",
                "NEXT_PUBLIC_SETTLEMENT_ADDRESS=",
                vm.toString(address(settlementEngine)),
                "\n",
                "NEXT_PUBLIC_ORACLE_ADDRESS=",
                vm.toString(address(oracle))
            )
        );

        vm.writeFile("deployed-addresses.env", addresses);
        console.log("Addresses saved to deployed-addresses.env");
    }
}
