BOT DE TICKETS PARA DISCORD - DISCORD.JS V14

REQUISITOS
- Node.js 20 ou superior
- Uma aplicação criada no Discord Developer Portal
- O bot convidado ao seu servidor

INSTALAÇÃO
1. Extraia o ZIP.
2. Abra a pasta no terminal.
3. Execute: npm install
4. Copie .env.example para um arquivo chamado .env.
5. Preencha BOT_TOKEN, CLIENT_ID e GUILD_ID.
6. Execute: npm run deploy
7. Execute: npm start

COMANDOS
/painel ticket
/painel xfacc

PERMISSÕES DO BOT
- Manage Channels
- View Channels
- Send Messages
- Read Message History
- Embed Links

INTENTS
O código utiliza somente o intent Guilds.

IMPORTANTE
- Nunca compartilhe o Token do bot.
- Não envie o arquivo .env para outras pessoas.
- Os comandos são restritos a membros com Manage Server (Gerenciar servidor).
- Confira se todos os IDs de cargos pertencem ao servidor.
- O bot precisa ter hierarquia/permissões suficientes para gerenciar canais.
- O arquivo data/tickets.json guarda os registros; o tópico dos canais também
  permite reconstruir os registros quando o bot inicia.
