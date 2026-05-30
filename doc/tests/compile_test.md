# Mermaid2Obsidian - Relatório de Tentativas de Distribuição

## Objetivo

Transformar o projeto Mermaid2Obsidian, atualmente executado via Node.js:

```bash
node src/index.js
```

em um executável Windows:

```txt
M2O.exe
```

com o seguinte fluxo de uso:

```txt
Abrir M2O.exe
↓
Selecionar arquivo .md ou .mmd
↓
Escolher modo de exportação
↓
Gerar arquivo .canvas
```

---

# Estado Inicial do Projeto

## Arquitetura

O projeto é um compilador Mermaid → Obsidian Canvas.

Possui:

* Parser Mermaid
* Parser Mindmap
* Layout Engine
* Exportador Canvas
* CLI Node.js

Entrada:

```txt
.md
.mmd
```

Saída:

```txt
.canvas
```

---

## Ambiente

Node:

```txt
v22.22.0
```

Projeto configurado como:

```json
{
  "type": "module"
}
```

Utiliza:

```js
import ...
export ...
import.meta.url
```

Portanto o projeto é ESM moderno.

---

# Experimento 1 - Substituir Digitação de Caminho por Explorer

## Objetivo

Eliminar a necessidade de o usuário digitar o caminho do arquivo.

Fluxo desejado:

```txt
Abrir programa
↓
Explorer abre
↓
Usuário seleciona arquivo
```

---

## Biblioteca Testada

```txt
node-file-dialog
```

Instalação:

```bash
npm install node-file-dialog
```

---

## Resultado

Funcionou durante execução normal:

```bash
node src/index.js
```

Foi possível:

* Abrir Explorer
* Navegar pelas pastas
* Selecionar arquivos

---

## Descoberta

A biblioteca não utiliza APIs nativas do Windows.

Internamente executa:

```txt
python/dist/windows/dialog.exe
```

através de:

```js
child_process.exec(...)
```

---

## Conclusão

A biblioteca funciona em desenvolvimento.

Porém introduz dependência externa:

```txt
dialog.exe
```

que precisa acompanhar qualquer distribuição futura.

---

# Experimento 2 - Empacotamento com pkg

## Objetivo

Gerar:

```txt
M2O.exe
```

a partir do projeto Node.

---

## Ferramenta

```bash
npm install -D pkg
```

---

## Teste

```bash
npx pkg .
```

---

## Resultado

Falha.

Erro:

```txt
No available node version satisfies 'node22'
```

---

## Teste Alternativo

```bash
npx pkg . --targets node18-win-x64
```

---

## Resultado

Executável gerado.

Porém ao executar:

```txt
Cannot use import statement outside a module
```

---

## Diagnóstico

pkg não conseguiu interpretar corretamente o projeto ESM.

Problema principal:

```txt
"type": "module"
```

e

```js
import ...
```

---

## Conclusão

pkg gera executável.

Executável não roda.

Ferramenta incompatível com a arquitetura atual do projeto.

---

# Experimento 3 - pkg sem bytecode

Teste:

```bash
npx pkg . --targets node18-win-x64 --no-bytecode
```

---

## Resultado

Mesmo erro.

```txt
Cannot use import statement outside a module
```

---

## Conclusão

Bytecode não era o problema.

---

# Experimento 4 - Bundle com esbuild

Objetivo:

Transformar ESM em um único arquivo.

Instalação:

```bash
npm install -D esbuild
```

---

## Primeira Tentativa

```bash
npx esbuild src/index.js --bundle --platform=node --format=cjs --outfile=dist/m2o.js
```

---

## Resultado

Erro:

```txt
Top-level await is currently not supported with the "cjs" output format
```

---

# Experimento 5 - Remoção do Top-Level Await

Código original:

```js
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli(...)
}
```

Substituído por:

```js
runCli(...).catch(...)
```

---

## Resultado

Todos os testes continuaram passando.

```txt
14 testes
14 sucessos
```

---

## Conclusão

Top-level await removido com sucesso.

---

# Experimento 6 - Novo Bundle

Após remover top-level await:

```bash
npx esbuild src/index.js --bundle --platform=node --format=cjs --outfile=dist/m2o.cjs
```

---

## Resultado

Bundle gerado com sucesso.

Tamanho aproximado:

```txt
435 KB
```

---

## Aviso

```txt
import.meta is not available with the "cjs" output format
```

---

# Experimento 7 - Execução do Bundle

```bash
node dist/m2o.cjs
```

---

## Resultado

Nada acontecia.

Sem erro.

Sem saída.

---

## Diagnóstico

A condição:

```js
process.argv[1].includes('index')
```

nunca era verdadeira após o bundle.

---

# Experimento 8 - Forçar Execução

Substituição temporária:

```js
const isDirectExecution = true;
```

---

## Resultado

O bundle passou a executar.

---

## Conclusão

Problema identificado como detecção de entrypoint.

Não era falha do bundle.

---

# Experimento 9 - node-file-dialog dentro do Bundle

Ao executar:

```bash
node dist/m2o.cjs
```

ocorreu:

```txt
dialog.exe not found
```

Erro:

```txt
dist/python/dist/windows/dialog.exe
```

---

## Diagnóstico

esbuild não copia executáveis auxiliares.

node-file-dialog depende de:

```txt
dialog.exe
```

externo.

---

## Conclusão

A dependência não é adequada para empacotamento simples.

Biblioteca removida.

Todas as alterações relacionadas foram revertidas.

---

# Experimento 10 - Nexe

Instalação:

```bash
npm install -D nexe
```

---

## Primeira Tentativa

```bash
npx nexe src/index.js -o M2O.exe
```

---

## Resultado

Falha.

Erro:

```txt
windows-x64-22.22.0 is not available
```

---

## Diagnóstico

Nexe tentou baixar runtime específico para Node 22.

Runtime inexistente.

---

## Conclusão

Nexe apresenta o mesmo padrão observado com pkg:

```txt
Projeto moderno
↓
Runtime antigo
↓
Incompatibilidade
```

---

# Descobertas Consolidadas

## O compilador funciona

Confirmado por:

```txt
14 testes
14 sucessos
```

---

## O problema NÃO está em

* Parser
* Layout
* Exportador
* Mermaid
* Obsidian Canvas
* Mindmaps
* Flowcharts

---

## O problema está em

Distribuição.

Mais especificamente:

```txt
Node 22
+
ESM
+
Empacotadores antigos
```

---

# Decisão Final

Abandonar temporariamente:

* pkg
* nexe
* node-file-dialog
