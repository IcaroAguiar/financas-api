// src/lib/prisma.js

// Importa a classe PrismaClient do pacote @prisma/client
const { PrismaClient } = require('@prisma/client');

// Cria uma única instância do PrismaClient
const prisma = new PrismaClient();

// Exporta a instância para que possa ser usada em outras partes do projeto
module.exports = prisma;
