# JustaSwap - MEV-Resistant DEX on Internet Computer

<p align="center">
  <img src="src/JustaSwap_frontend/public/logo2.svg" alt="JustaSwap Logo" width="200"/>
</p>

<p align="center">
  <strong>A next-generation decentralized exchange that eliminates front-running and MEV through cryptographic innovation</strong>
</p>

<p align="center">
  <a href="#introduction">Introduction</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#testing">Testing</a> •
  <a href="#roadmap">Roadmap</a>
</p>

---

## 🎯 Introduction

JustaSwap is a revolutionary decentralized exchange (DEX) protocol built on the Internet Computer that completely eliminates Maximal Extractable Value (MEV) and front-running attacks. By leveraging ICP's unique cryptographic capabilities, particularly Verifiably Encrypted Threshold Keys (vetKeys), JustaSwap introduces a novel Sealed-Batch Auction mechanism where all trade orders remain encrypted until execution.

### The Problem We Solve

In traditional DEXs, MEV bots monitor pending transactions and insert their own orders to profit from price movements, creating an "invisible tax" on regular traders:
- 💸 **Financial Losses**: Traders consistently receive worse execution prices
- 🏃 **Unfair Competition**: Sophisticated bots always win the race
- 🚫 **Barrier to Entry**: New users are deterred by the "rigged" system

### Our Solution

JustaSwap makes front-running **mathematically impossible** through:
- 🔐 **Sealed Orders**: All orders are encrypted client-side
- ⏱️ **Batch Auctions**: Orders collected in 5-second intervals
- ⚡ **Atomic Execution**: All orders in a batch execute simultaneously
- 💰 **Fair Pricing**: Single clearing price for the entire batch

## 🏗️ Architecture

JustaSwap employs a three-canister architecture for modularity and security:

```
┌─────────────────────┐
│  JustaSwap Frontend │ ← React-based UI with client-side encryption
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Orderbook Canister │ ← Receives encrypted orders, manages batches
└──────────┬──────────┘
           │ Timer (5s)
           ▼
┌─────────────────────┐
│ Execution Canister  │ ← Decrypts orders, executes swaps
└─────────────────────┘
```

### Key Components

1. **JustaSwap_frontend**: 
   - React-based user interface
   - Handles client-side order encryption
   - Integrates with Internet Identity for authentication

2. **Orderbook Canister** (Motoko):
   - Receives and stores encrypted orders
   - Manages batch timers (5-second intervals)
   - Enforces order collection rules

3. **Execution Canister** (Motoko):
   - Interfaces with vetKeys API for decryption
   - Calculates uniform clearing prices
   - Executes all swaps atomically

## ✨ Features

### ICP-Specific Features Used

- **🔑 vetKeys (Verifiably Encrypted Threshold Keys)**
  - Enables timelock encryption for sealed-batch auctions
  - Orders remain encrypted until batch execution time
  - Decryption keys derived collaboratively by ICP subnet

- **⏰ Canister Timers**
  - Autonomous batch execution every 5 seconds
  - No external triggers required
  - Guaranteed execution timing

- **💳 Reverse Gas Model**
  - Users don't need ICP tokens for gas
  - Canisters pay for their own computation
  - Superior user experience

- **🔄 Asynchronous Actor Model**
  - Efficient inter-canister communication
  - Scalable architecture
  - Fault-tolerant design

### Security Features

- ✅ **Authorization Checks**: Only authorized canisters can interact
- ✅ **One-time Initialization**: Prevents configuration tampering
- ✅ **State Persistence**: Survives canister upgrades
- ✅ **Input Validation**: Protects against malformed data

## 🚀 Installation

### Prerequisites

- [dfx](https://internetcomputer.org/docs/current/developer-docs/setup/install) (Internet Computer SDK)
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Git](https://git-scm.com/)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/jcorrales0620/JustaSwap.git
   cd JustaSwap
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start local Internet Computer replica**
   ```bash
   dfx start --clean
   ```

4. **Deploy with security features**
   ```bash
   ./deploy-secure.sh
   ```

The deployment script will:
- Deploy all canisters
- Initialize security configurations
- Set up mutual authentication
- Provide the frontend URL

## 📖 Usage

### For Traders

1. **Connect Wallet**: Login with Internet Identity
2. **Submit Order**: Enter swap details (encrypted automatically)
3. **Wait for Batch**: Orders execute every 5 seconds
4. **Receive Tokens**: Fair price execution guaranteed

### For Developers

```javascript
// Example: Submitting an order
const order = {
  owner: Principal.fromText("user-principal"),
  order_data: encryptOrderData(swapDetails),
  transport_public_key: generateTransportKey()
};

await orderbook.submitOrder(order);
```

## 🧪 Testing

JustaSwap includes comprehensive testing suites:

### Security & Unit Tests
```bash
./test-comprehensive.sh
```

### Load Testing
```bash
./test-load.sh
```

### Test Coverage
- ✅ Security authorization checks
- ✅ Normal operation flows
- ✅ Edge cases and error handling
- ✅ State persistence
- ✅ High-volume performance
- ✅ Cycle consumption analysis

## 🛠️ Development

### Project Structure
```
JustaSwap/
├── src/
│   ├── Orderbook/         # Order collection canister
│   ├── Execution/         # Batch execution canister
│   └── JustaSwap_frontend/ # React frontend
├── deploy-secure.sh       # Deployment script
├── test-comprehensive.sh  # Test suite
└── test-load.sh          # Load testing
```

### Building from Source
```bash
# Backend canisters
dfx build Orderbook
dfx build Execution

# Frontend
cd src/JustaSwap_frontend
npm run build
```

## 🎯 Mainnet Deployment

### Canister IDs
- **Orderbook**: `[TO BE DEPLOYED]`
- **Execution**: `[TO BE DEPLOYED]`
- **Frontend**: `[TO BE DEPLOYED]`

### Live Demo
🌐 Coming soon at: `https://[frontend-id].ic0.app`

## 🚧 Challenges Faced

1. **vetKeys Integration**
   - Challenge: Limited documentation for timelock encryption
   - Solution: Deep dive into ICP system APIs and community resources

2. **Timer Synchronization**
   - Challenge: Ensuring consistent 5-second batch intervals
   - Solution: Leveraging ICP's deterministic timer system

3. **State Management**
   - Challenge: Efficient storage of pending orders
   - Solution: Optimized HashMap with upgrade persistence

## 🗺️ Roadmap

### Phase 1 ✅ - Core Protocol
- Encrypted order submission
- Timer-based batch execution
- Basic inter-canister communication

### Phase 2 ✅ - MVP & Frontend
- React-based user interface
- Internet Identity integration
- End-to-end order flow

### Phase 3 🚧 - Testing & Polish
- Comprehensive security audits
- Performance optimization
- UI/UX enhancements

### Phase 4 📅 - Launch & Beyond
- Mainnet deployment
- Liquidity bootstrapping
- Governance token ($JUSTA)
- Multi-chain integration

## 👥 Team

Built with ❤️ for the WCHL25 Hackathon

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Internet Computer team for vetKeys innovation
- DFINITY Foundation for developer resources
- WCHL25 Hackathon organizers

---

<p align="center">
  <strong>Building the future of fair DeFi, one batch at a time 🚀</strong>
</p>
