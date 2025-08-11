// src/middlewares/authMiddleware.js

const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const authMiddleware = async (req, res, next) => {
  try {
    // Debug file for auth middleware
    const fs = require('fs');
    fs.writeFileSync('auth-debug.json', JSON.stringify({
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      headers: req.headers,
      hasAuth: !!req.headers.authorization
    }, null, 2));
    
    // 1. Pega o token do cabeçalho da requisição
    // O formato esperado é "Bearer TOKEN"
    const authHeader = req.headers.authorization;

    // 2. Verifica se o cabeçalho de autorização existe e tem o formato correto
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Acesso não autorizado. Token não fornecido." });
    }

    // 3. Extrai o token do cabeçalho
    const token = authHeader.split(" ")[1];

    // 4. Verifica se o token é válido e decodifica seu conteúdo
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Usa o `userId` do token para buscar o usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
    });

    // 6. Se o usuário associado ao token não for encontrado, retorna erro
    if (!user) {
      return res
        .status(401)
        .json({ error: "Acesso não autorizado. Usuário não encontrado." });
    }

    // 7. Anexa o objeto do usuário (sem a senha) à requisição
    // Isso permite que as rotas subsequentes acessem os dados do usuário logado
    const { password: _, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;

    // 8. Se tudo estiver correto, passa para o próximo middleware ou para a rota final
    next();
  } catch (error) {
    // Trata erros de token inválido ou expirado
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({ error: "Token inválido ou expirado." });
    }

    console.error("Erro no middleware de autenticação:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};

module.exports = authMiddleware;
