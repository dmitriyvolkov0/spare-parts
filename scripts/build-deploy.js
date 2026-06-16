const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const deployDir = path.join(root, 'deploy');
const clientDir = path.join(root, 'client');
const serverDir = path.join(root, 'server');

function run(command, args, cwd, env = {}) {
  console.log(`> ${[command, ...args].join(' ')}`);
  execFileSync(command, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, ...env } });
}

function ensureExists(target) {
  if (!fs.existsSync(target)) {
    throw new Error(`Path not found: ${target}`);
  }
}

function remove(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function mkdir(target) {
  fs.mkdirSync(target, { recursive: true });
}

function copyFile(source, target) {
  mkdir(path.dirname(target));
  fs.copyFileSync(source, target);
}

function copyDir(source, target, options = {}) {
  const ignored = options.ignored || new Set();
  mkdir(target);

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;

    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath, options);
    } else if (entry.isFile()) {
      copyFile(sourcePath, targetPath);
    }
  }
}

function copyIfExists(source, target) {
  if (fs.existsSync(source)) {
    copyFile(source, target);
  }
}

function writeFile(target, content) {
  mkdir(path.dirname(target));
  fs.writeFileSync(target, content, 'utf8');
}

function writeDeployFiles() {
  writeFile(path.join(deployDir, '.htaccess'), `RewriteEngine On

RewriteCond %{REQUEST_URI} !^/public/
RewriteRule ^(.*)$ public/$1 [L]
`);

  writeFile(path.join(deployDir, 'public', '.htaccess'), `RewriteEngine On

RewriteRule ^api(/.*)?$ api/index.php [QSA,L]

RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

RewriteRule ^ index.html [L]
`);

  writeFile(path.join(deployDir, 'public', 'api', 'index.php'), `<?php

use Slim\\Factory\\AppFactory;

require __DIR__ . '/../../vendor/autoload.php';

$envPath = dirname(__DIR__, 2);
if (class_exists(\\Dotenv\\Dotenv::class) && file_exists($envPath . '/.env')) {
    \\Dotenv\\Dotenv::createUnsafeImmutable($envPath)->safeLoad();
}

$app = AppFactory::create();
$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();

$app->add(function ($request, $handler) {
    if ($request->getMethod() === 'OPTIONS') {
        $response = new \\Slim\\Psr7\\Response();
    } else {
        $response = $handler->handle($request);
    }

    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
});

$app->addErrorMiddleware(false, true, true);

require __DIR__ . '/../../routes/api.php';

$app->run();
`);

  writeFile(path.join(deployDir, 'DEPLOY.md'), `# Deploy

Upload the contents of this folder to your hosting.

Required after upload:

1. Copy .env.example to .env.
2. Fill database credentials and optional AI tokens in .env.
3. Import database/schema.sql into MySQL if the database is empty.

If your hosting lets you select a document root, set it to public.
If not, the root .htaccess redirects requests into public automatically.
`);
}

function main() {
  ensureExists(clientDir);
  ensureExists(serverDir);

  console.log('Building client...');
  run('npm', ['install'], clientDir);
  run('npm', ['run', 'build'], clientDir, { VITE_API_URL: '/api' });

  console.log('Installing server dependencies...');
  run('composer', ['install', '--no-dev', '--optimize-autoloader'], serverDir);

  console.log('Preparing deploy folder...');
  remove(deployDir);
  mkdir(deployDir);

  copyDir(path.join(clientDir, 'dist'), path.join(deployDir, 'public'));
  copyDir(path.join(serverDir, 'app'), path.join(deployDir, 'app'));
  copyDir(path.join(serverDir, 'config'), path.join(deployDir, 'config'));
  copyDir(path.join(serverDir, 'database'), path.join(deployDir, 'database'));
  copyDir(path.join(serverDir, 'routes'), path.join(deployDir, 'routes'));
  copyDir(path.join(serverDir, 'vendor'), path.join(deployDir, 'vendor'));
  copyFile(path.join(serverDir, 'composer.json'), path.join(deployDir, 'composer.json'));
  copyFile(path.join(serverDir, 'composer.lock'), path.join(deployDir, 'composer.lock'));
  writeDeployFiles();

  copyIfExists(path.join(root, '.env.example'), path.join(deployDir, '.env.example'));
  copyIfExists(path.join(root, 'README.md'), path.join(deployDir, 'README.md'));

  console.log('Deploy build completed: deploy/');
  console.log('Upload the contents of deploy/ to your hosting and configure .env.');
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
