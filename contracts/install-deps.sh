# Foundry Dependencies Installation Script
# Run these commands after installing Foundry

# Install OpenZeppelin contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit

# Install Chainlink contracts  
forge install smartcontractkit/chainlink --no-commit

# Update dependencies
forge update

# Build contracts
forge build

# Run tests
forge test -vvv