# Ascend Financial API

Backend API para o aplicativo de finanças pessoais Ascend. Desenvolvido com Node.js, Express, PostgreSQL e Prisma.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados
- **Prisma** - ORM
- **JWT** - Autenticação
- **bcryptjs** - Criptografia de senhas
- **Docker** - Containerização

## ⚙️ Configuração

### Pré-requisitos

- Node.js (v18 ou superior)
- PostgreSQL (v13 ou superior)
- Docker (opcional)

### Instalação

1. Clone o repositório
```bash
git clone https://github.com/your-username/ascend-financas-api.git
cd ascend-financas-api
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
PORT=3000
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
JWT_SECRET="your_strong_secret_here"
NODE_ENV="development"
```

4. Execute as migrações do banco de dados
```bash
npx prisma migrate deploy
npx prisma generate
```

5. Inicie o servidor
```bash
npm start
```

## 🐳 Docker

Para executar com Docker:

```bash
# Configure as variáveis de ambiente
cp .env.example .env

# Inicie os serviços
docker-compose up -d
```

## 📚 API Endpoints

### Autenticação
- `POST /api/users/register` - Registro de usuário
- `POST /api/users/login` - Login
- `POST /api/users/forgot-password` - Solicitar reset de senha
- `POST /api/users/reset-password` - Reset de senha

### Transações
- `GET /api/transactions` - Listar transações
- `POST /api/transactions` - Criar transação
- `PUT /api/transactions/:id` - Atualizar transação
- `DELETE /api/transactions/:id` - Deletar transação

### Cobranças/Débitos
- `GET /api/debts` - Listar cobranças
- `POST /api/debts` - Criar cobrança
- `PUT /api/debts/:id` - Atualizar cobrança
- `DELETE /api/debts/:id` - Deletar cobrança

### Outros
- `GET /api/health` - Health check
- `GET /api/categories` - Listar categorias
- `GET /api/accounts` - Listar contas

## 🔒 Segurança

- Autenticação JWT
- Senhas criptografadas com bcrypt
- Middleware de autenticação em rotas protegidas
- Validação de entrada nos endpoints
- Isolamento de dados por usuário

## 🧪 Testes

```bash
npm test
```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Ícaro Aguiar**
- GitHub: [@IcaroAguiar](https://github.com/IcaroAguiar)
- LinkedIn: [Ícaro Aguiar](https://linkedin.com/in/icaro-aguiar)

---

Parte do projeto [Ascend](https://github.com/IcaroAguiar/ascend-financas-app) - Aplicativo completo de gestão financeira.