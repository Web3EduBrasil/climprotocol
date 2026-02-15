# 📚 Documentação do Clim Protocol

Bem-vindo à documentação completa do Clim Protocol - Parametric Drought Protection for Small Farmers.

---

## 🎯 Documentos de Referência Rápida

### ⭐ Comece Aqui
- **[STATUS.md](./STATUS.md)** - **Estado atual do projeto (visão executiva)**
- **[PITCH_DECK.md](./PITCH_DECK.md)** - **Apresentação para hackathon/investidores** 🎤
- **[FINAL_CHECKLIST.md](./FINAL_CHECKLIST.md)** - **Checklist de entrega completa** ✅
- **[TEST_REPORT.md](./phase3-testes-validacao/TEST_REPORT.md)** - 66/66 testes passando
- **[CHANGELOG.md](./CHANGELOG.md)** - Histórico completo de mudanças

### 🚀 Para Desenvolvedores
- **[HOW_TO_TEST.md](./phase3-testes-validacao/HOW_TO_TEST.md)** - Execute os testes
- **[ARCHITECTURE.md](./phase1-planejamento/ARCHITECTURE.md)** - Entenda a arquitetura
- **[CORRECTIONS_APPLIED.md](./phase3-testes-validacao/CORRECTIONS_APPLIED.md)** - Últimas atualizações

---

## 📂 Estrutura da Documentação

A documentação está organizada em três fases do desenvolvimento:

### 📋 [Phase 1: Planejamento](./phase1-planejamento/)
Fase de design e arquitetura do protocolo.

- **[ARCHITECTURE.md](./phase1-planejamento/ARCHITECTURE.md)**  
  Visão geral da arquitetura do sistema, diagramas e fluxos principais.

- **[SMART_CONTRACTS_EXPLAINED.md](./phase1-planejamento/SMART_CONTRACTS_EXPLAINED.md)**  
  Explicação detalhada de cada smart contract, funções e integrações.

- **[TODO_ROADMAP.md](./phase1-planejamento/TODO_ROADMAP.md)**  
  Roadmap completo do projeto com todas as fases e tarefas.

---

### 🔨 [Phase 2: Implementação](./phase2-implementacao/)
Fase de desenvolvimento dos contratos e funcionalidades.

- **[PHASE1_IMPLEMENTATION.md](./phase2-implementacao/PHASE1_IMPLEMENTATION.md)**  
  Documentação da primeira fase de implementação dos contratos principais.

- **[PHASE1_VALIDATION.md](./phase2-implementacao/PHASE1_VALIDATION.md)**  
  Validação inicial dos contratos implementados.

---

### ✅ [Phase 3: Testes e Validação](./phase3-testes-validacao/)
Fase de testes extensivos e relatórios de qualidade.

- **[TEST_REPORT.md](./phase3-testes-validacao/TEST_REPORT.md)** ⭐  
  Relatório completo de todos os testes realizados (66 testes, 100% passing).

- **[CORRECTIONS_APPLIED.md](./phase3-testes-validacao/CORRECTIONS_APPLIED.md)** 🆕  
  Última atualização: Correções de código e otimizações aplicadas.

- **[TEST_COVERAGE.md](./phase3-testes-validacao/TEST_COVERAGE.md)**  
  Detalhamento da cobertura de testes por contrato.

- **[HOW_TO_TEST.md](./phase3-testes-validacao/HOW_TO_TEST.md)**  
  Guia prático para executar os testes localmente.

---

## 🚀 Quick Start

### Para Desenvolvedores
```bash
# 1. Clone o repositório
git clone <repo-url>
cd climprotocol

# 2. Entre na pasta de contratos
cd contracts

# 3. Instale dependências (Foundry requerido)
forge install

# 4. Compile os contratos
forge build

# 5. Execute os testes
forge test

# 6. Gere relatório de coverage
forge coverage
```

### Para Revisores / Auditores
1. **Comece aqui:** [TEST_REPORT.md](./phase3-testes-validacao/TEST_REPORT.md)
2. **Entenda a arquitetura:** [ARCHITECTURE.md](./phase1-planejamento/ARCHITECTURE.md)
3. **Revise os contratos:** [SMART_CONTRACTS_EXPLAINED.md](./phase1-planejamento/SMART_CONTRACTS_EXPLAINED.md)
4. **Execute os testes:** [HOW_TO_TEST.md](./phase3-testes-validacao/HOW_TO_TEST.md)

---

## 📊 Status Atual do Projeto

| Aspecto | Status | Detalhes |
|---------|--------|----------|
| **Contratos** | ✅ Completos | 6 contratos principais implementados |
| **Testes** | ✅ 100% Passing | 66/66 testes aprovados |
| **Coverage** | 🔄 Em Análise | Report pronto para geração |
| **Integração Chainlink** | ⚠️ Mocks | Pronto para testnet |
| **Deploy** | 📋 Planejado | Próximo: Sepolia testnet |
| **Frontend** | 📋 Planejado | Fase futura |

---

## 🎯 Produto: Parametric Drought Protection

### Caso de Uso Principal
Proteção paramétrica contra seca para pequenos agricultores do **Semiárido Pernambucano**.

### Parâmetros Principais
- **Localização:** Sertão de Pernambuco (exemplo: -8.285°, -37.975°)
- **Duração:** 90 dias (período crítico de chuvas)
- **Gatilho:** Precipitação < 150mm acumulados
- **Pagamento:** Automático via Chainlink Automation
- **Dados:** Open-Meteo API via Chainlink Functions

### Como Funciona
1. **Agricultor compra tokens de proteção** pagando um prêmio
2. **Chainlink monitora** precipitação via Open-Meteo durante 90 dias
3. **Se seca ocorrer** (<150mm): Agricultor recebe payout automaticamente
4. **Se não ocorrer**: Tokens expiram, liquidez retorna ao pool

---

## 🔗 Links Úteis

### Chainlink Integration
- [Chainlink Functions Documentation](https://docs.chain.link/chainlink-functions)
- [Chainlink Automation Documentation](https://docs.chain.link/chainlink-automation)
- [Open-Meteo API](https://open-meteo.com/)

### Foundry Development
- [Foundry Book](https://book.getfoundry.sh/)
- [Forge Testing Guide](https://book.getfoundry.sh/forge/tests)

### OpenZeppelin
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [ERC-1155 Standard](https://eips.ethereum.org/EIPS/eip-1155)

---

## 👥 Para o Hackathon Chainlink Convergence 2026

Este projeto foi desenvolvido para o **Chainlink Convergence 2026 Hackathon** com foco em:

✅ **Uso Extensivo de Chainlink:**
- Chainlink Functions para dados climáticos
- Chainlink Automation para liquidação automática
- Integração com CRE (Chainlink Runtime Environment)

✅ **Impacto Social Real:**
- Proteção financeira para agricultores vulneráveis
- Solução para semiárido brasileiro
- Pagamentos automáticos e transparentes

✅ **Qualidade de Código:**
- 66 testes unitários (100% passing)
- Solidity 0.8.33 com proteções nativas
- OpenZeppelin para segurança
- Documentação completa

---

## 📧 Contato

Para dúvidas ou contribuições, consulte o README principal na raiz do projeto.

---

**Última Atualização:** 15 de Fevereiro de 2026  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para Testnet
