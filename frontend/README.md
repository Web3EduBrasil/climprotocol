# 🌾 Clim Protocol — Frontend

> **Seguro paramétrico descentralizado contra seca** para agricultores familiares do Semiárido brasileiro.

Aplicação **PWA** construída com **Next.js 16**, **RainbowKit** e **Web3Auth** — permitindo login social (Google, GitHub, Email) com criação automática de carteira.

---

## 🎯 Sobre

O Clim Protocol é um sistema de seguro climático paramétrico baseado em blockchain. Utiliza **Chainlink Functions** para obter dados de precipitação e **Chainlink Automation** para liquidação automática de eventos.

### Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| **Dashboard** | Visão geral do protocolo, estatísticas, gráfico de precipitação e portfolio |
| **Proteção** | Compra de tokens CET (ERC-1155) para proteção contra seca |
| **Liquidez** | Depósito/saque de ETH para garantir payouts |
| **Eventos** | Visualização de eventos climáticos ativos, liquidados e expirados |
| **Liquidação** | Resgate de payouts para eventos com seca confirmada |

---

## 🛠️ Stack Técnica

- **Framework:** Next.js 16 (App Router)
- **Estilização:** Tailwind CSS 4 + CSS Custom Properties (tema claro/escuro)
- **Blockchain:** wagmi v2 + viem
- **Wallets:** RainbowKit v2 + Web3Auth (login social)
- **Gráficos:** Recharts
- **Ícones:** React Icons (Heroicons)
- **i18n:** Contexto customizado (PT 🇧🇷 / EN 🇺🇸 / ES 🇪🇸)
- **PWA:** Service Worker + Web App Manifest

---

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- npm

### Instalação

```bash
cd frontend
npm install
```

### Variáveis de Ambiente

Copie `.env.example` para `.env.local` e configure:

```bash
cp .env.example .env.local
```

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_PROTOCOL_ADDRESS` | Endereço do contrato principal (Sepolia) |
| `NEXT_PUBLIC_TOKEN_ADDRESS` | Endereço do ClimateEventToken (ERC-1155) |
| `NEXT_PUBLIC_POOL_ADDRESS` | Endereço do LiquidityPool |
| `NEXT_PUBLIC_ORACLE_ADDRESS` | Endereço do ClimateOracle |
| `NEXT_PUBLIC_SETTLEMENT_ADDRESS` | Endereço do SettlementEngine |
| `NEXT_PUBLIC_FACTORY_ADDRESS` | Endereço do ClimateEventFactory |
| `NEXT_PUBLIC_CHAIN_ID` | `11155111` (Sepolia) |
| `NEXT_PUBLIC_RPC_URL` | RPC da rede (ex: `https://rpc.sepolia.org`) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | ID do projeto WalletConnect |
| `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID` | Client ID do Web3Auth (Sapphire Devnet) |

### Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

### Build de Produção

```bash
npm run build
npm start
```

---

## 🎨 Tema

O app suporta **modo claro** e **modo escuro** via CSS Custom Properties. O toggle está na Navbar (ícone ☀/🌙).

As variáveis de tema estão em `src/app/globals.css` — seção `:root` (dark) e `[data-theme="light"]`.

---

## 🔐 Autenticação

O usuário pode conectar de duas formas:

1. **Login Social** (Web3Auth) — Google, GitHub, Twitter ou email. A carteira é criada automaticamente.
2. **Wallet Direta** — MetaMask, WalletConnect, Coinbase Wallet ou Rainbow.

---

## 📱 PWA

O app é instalável como PWA (Progressive Web App). No navegador mobile, toque em "Adicionar à tela inicial".

---

## 📁 Estrutura

```
src/
├── app/                # Páginas (App Router)
│   ├── page.tsx        # Dashboard
│   ├── protection/     # Comprar proteção
│   ├── liquidity/      # Pool de liquidez
│   ├── events/         # Eventos climáticos
│   └── settlement/     # Liquidação
├── components/
│   ├── layout/         # Navbar, Footer
│   └── ui/             # StatsCard, PrecipitationChart, EventCard, BuyModal
├── config/
│   ├── wagmi.ts        # Configuração wagmi + RainbowKit wallets
│   ├── web3auth.ts     # Configuração Web3Auth
│   └── mockData.ts     # Dados de demonstração
├── contexts/
│   └── ThemeContext.tsx # Tema claro/escuro
└── i18n/
    ├── LanguageContext.tsx  # Provedor de idioma
    └── translations.ts     # Traduções PT/EN/ES
```

---

## 🌐 Deploy (Vercel)

1. Faça push para o GitHub
2. Acesse [vercel.com](https://vercel.com) e importe o repositório
3. Configure **Root Directory** como `frontend`
4. Adicione as variáveis de ambiente no painel da Vercel
5. Deploy automático!

---

## 📜 Contratos (Sepolia)

| Contrato | Endereço |
|----------|----------|
| ClimateEventToken | `0xBc0f8DF2ad5dC218BbbA579C65F3C274DBbBded6` |
| LiquidityPool | `0x6440239C519d62BF94f37DaE08635BE65Ac8f8B1` |
| ClimateOracle | `0xF137c61543a2656ED66e58418CE3c27d829617a8` |
| SettlementEngine | `0x3d4219054030A09c879A65F2861f18E0Fe3768D2` |
| ClimateEventFactory | `0x774FCe394C8287818038A62763263DB4736A92Cb` |
| ClimProtocol | `0x901936D63109b8838591211a16856Eb2C197C1e4` |

---

## 📄 Licença

MIT © Web3EduBrasil
