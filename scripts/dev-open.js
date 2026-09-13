const { spawn } = require('child_process');

const server = spawn('npx', ['next', 'dev'], { stdio: 'inherit', shell: true });

// Aguarda o servidor iniciar antes de abrir o navegador
setTimeout(() => {
  const cmd = process.platform === 'win32' ? 'start' : 'open';
  spawn(cmd, ['http://localhost:3000'], { shell: true });
  spawn(cmd, ['http://localhost:3000/admin'], { shell: true });
}, 4000);

server.on('close', (code) => process.exit(code));
