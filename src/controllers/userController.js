// src/controllers/userController.js

const prisma = require("../lib/prisma"); // Nosso cliente Prisma centralizado
const bcrypt = require("bcryptjs"); // Biblioteca para criptografia de senha
const jwt = require('jsonwebtoken');
// Função para criar um novo usuário (Cadastro)
const createUser = async (req, res) => {
  try {
    // 1. Pega os dados do corpo da requisição
    const { email, name, password } = req.body;

    // 2. Validação simples: verifica se a senha existe
    if (!password) {
      return res.status(400).json({ error: "A senha é obrigatória." });
    }

    // 3. Verifica se o usuário já existe no banco de dados
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Usa o código 409 (Conflict) para indicar que o recurso já existe
      return res.status(409).json({ error: "Este e-mail já está em uso." });
    }

    // 4. Criptografa a senha antes de salvar
    // O '10' é o "salt rounds", um fator de complexidade da criptografia
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 5. Cria o usuário no banco de dados com a senha criptografada
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    // 6. Remove a senha do objeto de usuário antes de enviar a resposta
    // Por segurança, nunca retorne a senha, mesmo que criptografada.
    const { password: _, ...userWithoutPassword } = newUser;

    // 7. Retorna o usuário criado com o status 201 (Created)
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    // 8. Tratamento de erro genérico
    console.error("Erro ao criar usuário:", error);
    res.status(500).json({ error: "Não foi possível criar o usuário." });
  }


  
};

// Função para autenticar um usuário (Login)
const loginUser = async (req, res) => {
  try {
    // 1. Pega email e senha do corpo da requisição
    const { email, password } = req.body;

    // 2. Procura pelo usuário no banco de dados usando o email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 3. Se o usuário não for encontrado, retorna erro 401 (Não Autorizado)
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' }); // Mensagem genérica por segurança
    }

    // 4. Compara a senha enviada com a senha criptografada no banco
    const isPasswordValid = bcrypt.compareSync(password, user.password);

    // 5. Se as senhas não baterem, retorna erro 401
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // 6. Se a senha estiver correta, gera o Token JWT
    const token = jwt.sign(
      { userId: user.id },      // Carga útil (Payload): dados que queremos guardar no token
      process.env.JWT_SECRET,   // Chave secreta que está no .env
      { expiresIn: '1d' }       // Opções: define a validade do token (ex: 1 dia)
    );

    // 7. Retorna o token para o cliente
    res.status(200).json({ token });

  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Não foi possível fazer o login.' });
  }
};

const getMe = (req, res) => {
  // Graças ao nosso middleware, `req.user` já contém os dados do usuário logado.
  // O middleware já tratou a busca do usuário e os erros,
  // então aqui só precisamos retornar a informação.
  res.status(200).json(req.user);
};

module.exports = {
  createUser,
  loginUser,
  getMe,
};

