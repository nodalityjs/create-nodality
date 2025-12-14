#!/usr/bin/env node

import { mkdirSync, writeFileSync, existsSync, copyFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";

function createProject(projectName) {
  const projectPath = resolve(process.cwd(), projectName);

  if (existsSync(projectPath)) {
    console.error(`Folder ${projectName} already exists.`);
    process.exit(1);
  }

  // Create folders
  mkdirSync(projectPath);
  const srcPath = resolve(projectPath, "src");
  mkdirSync(srcPath);

  // Copy index.html
  const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>

  <!-- importmap to map "nodality" to node_modules path -->
  <script type="importmap">
  {
    "imports": {
      "nodality": "/node_modules/nodality/dist/index.esm.js"
    }
  }
  </script>
</head>
<body>
  <div id="mount"></div>

  <!-- User app -->
  <script type="module" src="src/app.js"></script>
</body>
</html>
  `;
  writeFileSync(resolve(projectPath, "index.html"), indexHtml.trim());

  // Copy app.js
  const appJs = `
import { Des } from "nodality";           

const elements = [
  { type: "h1", text: "Hello" }
];

const nodes = [
  { op: "blast" }
];

new Des()
  .nodes(nodes)
  .add(elements)
  .set({
    mount: "#mount",
    code: true,
  });
  `;
  writeFileSync(resolve(srcPath, "app.js"), appJs.trim());

  // Copy webpack.config.js
  const webpackConfig = `
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: "production",
  entry: "nodality",               // bundle Nodality only
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "lib.bundle.js",
    library: { type: "module" },   // ESM output
    environment: { module: true },
    clean: true,
    publicPath: "/",
  },
  experiments: { outputModule: true },
  module: {
    rules: [
      {
        test: /\\.m?js$/,
        exclude: /node_modules/,
        use: { loader: "babel-loader", options: { presets: ["@babel/preset-env"] } },
      },
    ],
  },
};
  `;
  writeFileSync(resolve(projectPath, "webpack.config.js"), webpackConfig.trim());

  // package.json
  const pkg = {
    name: projectName,
    version: "1.0.0",
    type: "module",
    scripts: {
      build: "webpack --config webpack.config.js",
      watch: "webpack --watch --config webpack.config.js",
      start: "live-server . --port=4000 --watch=dist,src",
      dev: "npm-run-all --parallel watch start"
    },
    dependencies: {
      nodality: "latest"
    },
    devDependencies: {
      "@babel/core": "^7.28.4",
      "@babel/preset-env": "^7.28.3",
      "babel-loader": "^9.2.1",
      "live-server": "^1.2.2",
      "npm-run-all": "^4.1.5",
      "serve": "^14.0.0",
      "webpack": "^5.101.3",
      "webpack-cli": "^5.1.4",
      "webpack-dev-server": "^5.2.2"
    }
  };
  writeFileSync(resolve(projectPath, "package.json"), JSON.stringify(pkg, null, 2));

  console.log("Installing dependencies...");
  execSync(`npm install`, { cwd: projectPath, stdio: "inherit" });

  console.log("Building Nodality bundle...");
  execSync(`npm run build`, { cwd: projectPath, stdio: "inherit" });

  const bold = "\x1b[1m";
  const color1abc9c = "\x1b[38;5;37m";
  const reset = "\x1b[0m";

  console.log(`\n${color1abc9c}${bold}%s${reset}\n`, `Project "${projectName}" is ready! 🎉`);
  console.log("\nUsage:\n");
  console.log(`  cd ${projectName}`);
  console.log("  npm run build      # Rebuild library bundle");
  console.log("  npm run dev        # Start dev server with live reload");
  console.log("  npm start          # Serve project without watch");
}

// Get project name from CLI args
const args = process.argv.slice(2);
if (!args[0]) {
  console.error("Usage: npm create nodality <project-name>");
  process.exit(1);
}

createProject(args[0]);
