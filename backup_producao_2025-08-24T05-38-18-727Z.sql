-- Backup do banco de produção - 2025-08-24T05:38:14.711Z
-- Host: dpg-d280n2uuk2gs73eo32m0-a.oregon-postgres.render.com
-- Database: ascend_db

-- Tabela: Account (5 registros)
-- Colunas: id (text), name (text), type (text), balance (integer), createdAt (timestamp without time zone), updatedAt (timestamp without time zone), userId (text)
INSERT INTO "Account" ("id", "name", "type", "balance", "createdAt", "updatedAt", "userId") VALUES
('44e9c73c-ec21-46ee-bd3b-34c14761c3a2', 'Nubank', 'Cartão de Crédito', 0, '2025-08-18T07:23:56.527Z', '2025-08-18T07:23:56.527Z', '7ed07c52-f8f5-4b99-b126-589640cd0bae'),
('5e44c6e5-df94-48ea-b483-5215a42eb8ff', 'Inter', 'Cartão de Crédito', 0, '2025-08-18T07:24:08.645Z', '2025-08-18T07:24:08.645Z', '7ed07c52-f8f5-4b99-b126-589640cd0bae'),
('dbc61874-d0ba-41bd-9c9c-731b6fd42868', 'Santander', 'Conta Corrente', 0, '2025-08-18T07:24:20.124Z', '2025-08-18T07:24:20.124Z', '7ed07c52-f8f5-4b99-b126-589640cd0bae'),
('6d64817d-59e4-4fe0-914b-a83b401c9782', 'Cartão Santander', 'Cartão de Crédito', 0, '2025-08-18T07:24:31.821Z', '2025-08-18T07:24:51.808Z', '7ed07c52-f8f5-4b99-b126-589640cd0bae'),
('a8c7e7f3-41ec-40f0-af02-02d43a4c504f', 'Mercado Pago', 'Cartão de Crédito', 0, '2025-08-18T07:25:42.951Z', '2025-08-18T07:25:42.951Z', '7ed07c52-f8f5-4b99-b126-589640cd0bae');

-- Tabela: Category (2 registros)
-- Colunas: id (text), name (text), color (text), createdAt (timestamp without time zone), updatedAt (timestamp without time zone), userId (text)
INSERT INTO "Category" ("id", "name", "color", "createdAt", "updatedAt", "userId") VALUES
('39af598d-9482-4a23-8606-270908e7ed64', 'Investimento', '#4ECDC4', '2025-08-18T07:27:33.024Z', '2025-08-18T07:27:33.024Z', '7ed07c52-f8f5-4b99-b126-589640cd0bae'),
('6ac04559-d5aa-4246-8259-8b91439a299b', 'Apartamento', '#F8C471', '2025-08-18T07:28:18.637Z', '2025-08-18T07:28:18.637Z', '7ed07c52-f8f5-4b99-b126-589640cd0bae');

-- Tabela: Debt (0 registros)
-- Colunas: id (text), description (text), totalAmount (integer), dueDate (timestamp without time zone), createdAt (timestamp without time zone), updatedAt (timestamp without time zone), debtorId (text), categoryId (text), accountId (text), status (USER-DEFINED), isInstallment (boolean), installmentCount (integer), installmentFrequency (USER-DEFINED), installmentAmount (integer), notificationId (text)
-- Tabela vazia

-- Tabela: Debtor (0 registros)
-- Colunas: id (text), name (text), email (text), phone (text), createdAt (timestamp without time zone), updatedAt (timestamp without time zone), userId (text), categoryId (text)
-- Tabela vazia

-- Tabela: Installment (0 registros)
-- Colunas: id (text), installmentNumber (integer), amount (integer), dueDate (timestamp without time zone), paidDate (timestamp without time zone), status (USER-DEFINED), createdAt (timestamp without time zone), updatedAt (timestamp without time zone), debtId (text)
-- Tabela vazia

-- Tabela: Payment (0 registros)
-- Colunas: id (text), amount (integer), paymentDate (timestamp without time zone), notes (text), createdAt (timestamp without time zone), updatedAt (timestamp without time zone), debtId (text)
-- Tabela vazia

-- Tabela: Subscription (0 registros)
-- Colunas: id (text), name (text), description (text), amount (integer), type (USER-DEFINED), frequency (USER-DEFINED), startDate (timestamp without time zone), endDate (timestamp without time zone), isActive (boolean), nextPaymentDate (timestamp without time zone), lastProcessedAt (timestamp without time zone), createdAt (timestamp without time zone), updatedAt (timestamp without time zone), userId (text), categoryId (text), accountId (text)
-- Tabela vazia

-- Tabela: Transaction (7 registros)
-- Colunas: id (text), description (text), amount (integer), date (timestamp without time zone), type (USER-DEFINED), isRecurring (boolean), createdAt (timestamp without time zone), updatedAt (timestamp without time zone), userId (text), categoryId (text), accountId (text), subscriptionId (text), isInstallmentPlan (boolean), installmentCount (integer), installmentFrequency (USER-DEFINED), installmentAmount (integer), firstInstallmentDate (timestamp without time zone)
INSERT INTO "Transaction" ("id", "description", "amount", "date", "type", "isRecurring", "createdAt", "updatedAt", "userId", "categoryId", "accountId", "subscriptionId", "isInstallmentPlan", "installmentCount", "installmentFrequency", "installmentAmount", "firstInstallmentDate") VALUES
('a7f3c7c5-e306-4787-af09-53c56241d170', 'Pagamento Cartão Nubank', 1508, '2025-08-18T07:26:33.541Z', 'PAGO', false, '2025-08-18T07:26:33.607Z', '2025-08-18T07:36:42.155Z', '7ed07c52-f8f5-4b99-b126-589640cd0bae', 'contas', '44e9c73c-ec21-46ee-bd3b-34c14761c3a2', NULL, false, NULL, NULL, NULL, NULL),
('730b0da2-6274-4bdd-8b4c-5fc3a5c7bf60', 'Internet ', 79, '2025-08-18T07:31:58.329Z', 'PAGO', false, '2025-08-18T07:31:58.267Z', '2025-08-18T07:36:59.769Z', '7ed07c52-f8f5-4b99-b126-589640cd0bae', NULL, 'dbc61874-d0ba-41bd-9c9c-731b6fd42868', NULL, false, NULL, NULL, NULL, NULL),
('39e0daef-6922-4ad6-933b-ab9ba2e1b8c3', 'Evolução de obra', 758, '2025-08-18T07:34:46.903Z', 'PAGO', false, '2025-08-18T07:34:46.941Z', '2025-08-18T07:37:03.370Z', '7ed07c52-f8f5-4b99-b126-589640cd0bae', '6ac04559-d5aa-4246-8259-8b91439a299b', 'dbc61874-d0ba-41bd-9c9c-731b6fd42868', NULL, false, NULL, NULL, NULL, NULL),
('4b23e2aa-01ce-4e1f-960f-e778bb7bd8ef', 'Geladeira', 258, '2025-08-18T07:32:44.927Z', 'PAGO', false, '2025-08-18T07:32:45.285Z', '2025-08-18T07:37:41.537Z', '7ed07c52-f8f5-4b99-b126-589640cd0bae', '6ac04559-d5aa-4246-8259-8b91439a299b', '6d64817d-59e4-4fe0-914b-a83b401c9782', NULL, false, NULL, NULL, NULL, NULL),
('f4ecea79-0f9e-4aa3-b1e6-60989dd4c567', 'Planejados', 714, '2025-08-18T07:30:55.778Z', 'PAGO', false, '2025-08-18T07:30:56.147Z', '2025-08-18T07:37:45.780Z', '7ed07c52-f8f5-4b99-b126-589640cd0bae', '6ac04559-d5aa-4246-8259-8b91439a299b', 'dbc61874-d0ba-41bd-9c9c-731b6fd42868', NULL, false, NULL, NULL, NULL, NULL),
('2460264b-08c8-481c-a8b4-4fa06089ddfd', 'Ferias', 10000, '2025-08-18T07:36:25.306Z', 'RECEITA', false, '2025-08-18T07:36:25.322Z', '2025-08-18T07:38:24.306Z', '7ed07c52-f8f5-4b99-b126-589640cd0bae', 'salario', 'dbc61874-d0ba-41bd-9c9c-731b6fd42868', NULL, false, NULL, NULL, NULL, NULL),
('de7a6a52-7d98-40a4-a14d-60bb716c05d8', 'Investimento Alpha', 5000, '2025-08-18T07:27:41.154Z', 'PAGO', false, '2025-08-18T07:27:41.193Z', '2025-08-18T07:38:38.044Z', '7ed07c52-f8f5-4b99-b126-589640cd0bae', '39af598d-9482-4a23-8606-270908e7ed64', 'dbc61874-d0ba-41bd-9c9c-731b6fd42868', NULL, false, NULL, NULL, NULL, NULL);

-- Tabela: TransactionInstallment (0 registros)
-- Colunas: id (text), installmentNumber (integer), amount (integer), dueDate (timestamp without time zone), paidDate (timestamp without time zone), status (USER-DEFINED), createdAt (timestamp without time zone), updatedAt (timestamp without time zone), transactionId (text)
-- Tabela vazia

-- Tabela: User (2 registros)
-- Colunas: id (text), email (text), name (text), password (text), createdAt (timestamp without time zone), updatedAt (timestamp without time zone), resetToken (text), resetTokenExpiry (timestamp without time zone)
INSERT INTO "User" ("id", "email", "name", "password", "createdAt", "updatedAt", "resetToken", "resetTokenExpiry") VALUES
('7ed07c52-f8f5-4b99-b126-589640cd0bae', 'luishenrique.ss@outlook.com', 'Luis Henrique', '$2b$10$Q8Qr./sZxAAGR/8Ex2Kz9uuPOkybtuMxweEa24C5gIPe7ijyjIEOq', '2025-08-18T07:22:53.389Z', '2025-08-18T07:22:53.389Z', NULL, NULL),
('e4b8c098-08f4-4fb4-9292-cd5d19b00353', 'marcioribeiro.vet@hotmail.com', 'Márcio de Oliveira Ribeiro ', '$2b$10$md2eObEuJYpiov0yKfIjJ.LQzDS3Am26oNopMvY4KCh2tStb10c4O', '2025-08-18T11:12:27.414Z', '2025-08-18T11:12:27.414Z', NULL, NULL);

