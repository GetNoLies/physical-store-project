# 🏬 Physical Store Project

Descrição:
Physical Store API é uma aplicação desenvolvida com NestJS para gerenciar lojas físicas e calcular fretes. O sistema permite localizar PDVs (Pontos de Venda) próximos a um determinado CEP e oferece diferentes opções de envio, incluindo motoboy para entregas locais e serviços dos Correios (PAC e SEDEX) para maiores distâncias.

---

Recursos da API

Funcionalidades:
Cadastro, consulta, atualização e exclusão de lojas
Busca de lojas por proximidade geográfica (CEP)
Busca de lojas por estado
Cálculo de frete para entrega com diferentes modalidades
Integração com APIs externas (Melhor Envio, ViaCEP, OSRM)

Regras de Negócio Implementadas:
Para PDVs próximos (até 50km), o valor de entrega é fixo em R$15,00
Para distâncias maiores, há cálculo de frete via API Melhor Envio (PAC e SEDEX)
As coordenadas geográficas são obtidas automaticamente pelo CEP
O cálculo de distância entre pontos é feito pela API OSRM

---

## 🎯 Objetivo

Automatizar o controle de uma loja física com funcionalidades como:

- Cadastro e consulta de produtos
- Gerenciamento de estoque
- Simulação de processos de compra e venda
- Persistência de dados via banco SQLite

---

## 🧰 Tecnologias

- TypeScript - Linguagem de programação
- Node.js - Ambiente de execução
- NestJS - Framework para desenvolvimento de aplicações
- SQLite - Banco de dados
- Swagger - Documentação da API
- Jest - Framework de testes
- TypeORM - ORM para manipulação do banco de dados

---

## 🛠️ Instalação

1. Clone o projeto:

git clone https://github.com/GetNoLies/physical-store-project.git

2. Instale as dependências:

npm install

3. Rode o servidor em modo desenvolvimento:

npm run start:dev

✅ Funcionalidades

Produtos: cadastro, listagem, busca por nome

Estoque: consulta e atualização de quantidades

Simulação de Venda: com verificação de estoque

Modularização clara com suporte a escalabilidade

🧪 Testes
Execute:

npm run test

A suíte de testes cobre os principais casos de uso, como manipulação de produtos e verificação de estoque.

Endpoints Disponíveis:

Listagem de lojas:
GET /stores: Lista todas as lojas cadastradas
Query params: limit, offset
Exemplo: GET /stores

Busca por ID:
GET /stores/:id: Retorna detalhes de uma loja específica
Exemplo: GET /stores/1

Busca por CEP:
GET /stores/by-cep/:cep: Encontra lojas próximas a um CEP
Query params: limit, offset
Exemplo: GET /stores/by-cep/01001-000
Retorna PDVs próximos (até 50km) e opções de lojas online com cálculo de frete

Busca por estado:
GET /stores/by-state/:state: Lista lojas de um determinado estado
Query params: limit, offset
Exemplo: GET /stores/by-state/SP

Criação de lojas:
POST /stores: Cria uma nova loja
Body: dados da loja (nome, CEP, tipo, etc.)
Automaticamente extrai informações de endereço e coordenadas do CEP

Atualização de lojas:
PUT /stores/:id: Atualiza uma loja existente
Body: campos a serem atualizados
Se o CEP for alterado, atualiza automaticamente endereço e coordenadas

Exclusão de lojas:
DELETE /stores/:id: Remove uma loja do banco de dados
---------------------------------------------------------------------------------------------------

Documentação da API (Swagger)
A API é documentada usando Swagger, que permite visualizar e testar os endpoints diretamente pelo navegador.

Para acessar a documentação:

Inicie o servidor: npm run start:dev
Acesse no navegador: http://localhost:3000/api
-----------------------------------------------------------------------------------------------------

Integrações com APIs Externas
ViaCEP: Utilizada para obter informações de endereço a partir do CEP
OSRM (Open Source Routing Machine): Calcula rotas e distâncias entre pontos geográficos
Melhor Envio: Utilizada para calcular fretes de PAC e SEDEX

*Observações*:
O projeto utiliza SQLite como banco de dados, o que simplifica a configuração inicial.
Para utilizar o cálculo de frete, é necessário ter um token válido do Melhor Envio.
A API faz tratamento de erros para token inválido, campos inválidos e retornos vazios das APIs externas.
