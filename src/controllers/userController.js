// src/controllers/userController.js

const prisma = require("../lib/prisma"); // Nosso cliente Prisma centralizado
const bcrypt = require("bcryptjs"); // Biblioteca para criptografia de senha
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Para gerar tokens seguros
// Função para criar um novo usuário (Cadastro)
const createUser = async (req, res) => {
  try {
    // 1. Pega os dados do corpo da requisição
    const { email, name, password } = req.body;

    // 2. Validações mais robustas
    if (!name) {
      return res.status(400).json({ error: "O nome é obrigatório." });
    }

    if (!email) {
      return res.status(400).json({ error: "O e-mail é obrigatório." });
    }

    if (!password) {
      return res.status(400).json({ error: "A senha é obrigatória." });
    }

    // Validação de formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Formato de e-mail inválido." });
    }

    // Validação de tamanho da senha
    if (password.length < 6) {
      return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres." });
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

// Função para solicitar reset de senha (Esqueci minha senha)
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Validação básica
    if (!email) {
      return res.status(400).json({ error: "O e-mail é obrigatório." });
    }

    // Busca o usuário pelo e-mail
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Por segurança, não revela se o e-mail existe ou não
      return res.status(200).json({ 
        message: "Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha." 
      });
    }

    // Gera um token seguro de 32 bytes (256 bits)
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Define a expiração do token para 1 hora a partir de agora
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Salva o token e sua expiração no banco de dados
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: resetToken,
        resetTokenExpiry: resetTokenExpiry,
      },
    });

    // TODO: Aqui você enviaria um e-mail com o token
    // Por enquanto, retornamos o token na resposta (APENAS PARA DESENVOLVIMENTO)
    console.log(`Token de reset para ${email}: ${resetToken}`);
    console.log(`URL de reset: /reset-password/${resetToken}`);

    res.status(200).json({ 
      message: "Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.",
      // REMOVER ESTA LINHA EM PRODUÇÃO:
      dev_reset_token: resetToken // Apenas para facilitar testes
    });

  } catch (error) {
    console.error("Erro ao solicitar reset de senha:", error);
    res.status(500).json({ error: "Não foi possível processar a solicitação." });
  }
};

// Função para redefinir a senha usando o token
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validação básica
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token e nova senha são obrigatórios." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres." });
    }

    // Busca o usuário pelo token de reset válido
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gte: new Date(), // Token ainda não expirou
        },
      },
    });

    if (!user) {
      return res.status(400).json({ 
        error: "Token inválido ou expirado. Solicite um novo reset de senha." 
      });
    }

    // Criptografa a nova senha
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    // Atualiza a senha e limpa os campos de reset
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.status(200).json({ 
      message: "Senha redefinida com sucesso. Você já pode fazer login com sua nova senha." 
    });

  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    res.status(500).json({ error: "Não foi possível redefinir a senha." });
  }
};

// Função para verificar se um token de reset é válido
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    // Busca o usuário pelo token válido
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gte: new Date(), // Token ainda não expirou
        },
      },
      select: {
        id: true,
        email: true,
        resetTokenExpiry: true,
      },
    });

    if (!user) {
      return res.status(400).json({ 
        valid: false, 
        error: "Token inválido ou expirado." 
      });
    }

    res.status(200).json({ 
      valid: true,
      email: user.email,
      expiresAt: user.resetTokenExpiry,
    });

  } catch (error) {
    console.error("Erro ao verificar token:", error);
    res.status(500).json({ error: "Não foi possível verificar o token." });
  }
};

// Função para verificar senha do usuário autenticado (para configuração biométrica)
const verifyPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user?.id; // Vem do middleware de autenticação

    if (!password) {
      return res.status(400).json({ error: "Senha é obrigatória." });
    }

    // Busca o usuário atual
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    // Verifica se a senha está correta
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ error: "Senha incorreta." });
    }

    res.status(200).json({ 
      message: "Senha verificada com sucesso.",
      verified: true
    });

  } catch (error) {
    console.error("Erro ao verificar senha:", error);
    res.status(500).json({ error: "Não foi possível verificar a senha." });
  }
};

// Função para atualizar perfil do usuário
const updateProfile = async (req, res) => {
  try {
    const { name, email, profilePicture } = req.body;
    const userId = req.user?.id; // Vem do middleware de autenticação

    // Validação básica
    if (!name && !email && profilePicture === undefined) {
      return res.status(400).json({ error: "Nome, e-mail ou foto de perfil deve ser fornecido para atualização." });
    }

    // Validação de nome
    if (name && name.trim().length === 0) {
      return res.status(400).json({ error: "O nome não pode estar vazio." });
    }

    // Validação de e-mail
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Formato de e-mail inválido." });
      }

      // Verifica se o e-mail já está sendo usado por outro usuário
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ error: "Este e-mail já está em uso por outro usuário." });
      }
    }

    // Monta o objeto de dados para atualização
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    // Atualiza o usuário no banco de dados
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({ 
      message: "Perfil atualizado com sucesso.",
      user: updatedUser
    });

  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    res.status(500).json({ error: "Não foi possível atualizar o perfil." });
  }
};

// Função para alterar senha do usuário
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id; // Vem do middleware de autenticação

    // Validação básica
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Senha atual e nova senha são obrigatórias." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "A nova senha deve ter pelo menos 6 caracteres." });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: "A nova senha deve ser diferente da senha atual." });
    }

    // Busca o usuário atual
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    // Verifica se a senha atual está correta
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Senha atual incorreta." });
    }

    // Criptografa a nova senha
    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

    // Atualiza a senha no banco de dados
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
      },
    });

    res.status(200).json({ 
      message: "Senha alterada com sucesso."
    });

  } catch (error) {
    console.error("❌ [API] Erro ao alterar senha:", error);
    res.status(500).json({ error: "Não foi possível alterar a senha." });
  }
};

module.exports = {
  createUser,
  loginUser,
  getMe,
  requestPasswordReset,
  resetPassword,
  verifyResetToken,
  verifyPassword,
  updateProfile,
  changePassword,
};

