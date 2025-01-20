#!/usr/bin/env node

import { resolve } from 'node:path';

import { access, readFile, writeFile, constants } from 'node:fs/promises';

function usage() {
  const usage = `Formats mtgo txt deck lists
Usage: node format.js [-h] [-c] [-p] [-w] decklist.txt another-list.txt ...

-h, --help: show this help text
-c, --check: check format of all supplied decklists, exits with error if at least one list has invalid format
-p, --print: print formatted list and exit
-w, --write: overwrites the supplied files with their formatted version
`;
  console.log(usage);
}

function format(decklist) {
  const newLine = /(\r\n|\r|\n)/g;
  const matches = decklist.match(newLine);
  if (matches === null) {
    console.warn('Invalid format');
    return decklist;
  }
  const newLineCharacter = matches[0];
  const lines = decklist.split(newLine).filter(line => line.match(newLine) == null);
  let blocks = [];
  let currentBlock = [];
  for (let line of lines) {
    if (line.trim() === ''){
      if (currentBlock.length > 0) {
        blocks.push(currentBlock);
        currentBlock = [];
      }
    } else {
      currentBlock.push(line);
    }
  }
  // sort each block by card name (ignore cad amount)
  for (let i = 0; i < blocks.length; i++) {
    blocks[i] = blocks[i].sort((a, b) => {
      const cardA = a.split(/\s+/).slice(1).join(' ').toUpperCase();
      const cardB = b.split(/\s+/).slice(1).join(' ').toUpperCase();
      if (cardA < cardB) {
        return -1;
      }
      if (cardA > cardB) {
        return 1;
      }
      return 0;
    });
  }
  const formatted = blocks.reduce((acc, block, index) =>  {
    if (index > 0) {
      acc += newLineCharacter + newLineCharacter;
    }
      return acc + block.join(newLineCharacter);
    }, "");
  return formatted + newLineCharacter;
}

function handleArguments() {
  if (process.argv.length <= 2) {
    console.log('Provide at least one deck list to format!')
    usage();
    process.exit();
  }

  let args = process.argv.slice(2);
  if (args[0] === '-h' || args[0] === '--help') {
    usage();
    process.exit();
  }

  let checkFormat = false;
  if (args[0] === '-c' || args[0] === '--check') {
    checkFormat = true;
    args = args.slice(1);
  }

  let onlyPrintFormatted = false;
  if (args[0] === '-p' || args[0] === '--print') {
    onlyPrintFormatted = true;
    args = args.slice(1);
  }

  let writeDecklists = false;
  if (args[0] === '-w' || args[0] === '--write') {
    writeDecklists = true;
    args = args.slice(1);
  }

  let filePaths = args;

  return {
    filePaths,
    checkFormat,
    onlyPrintFormatted,
    writeDecklists
  };
}

async function canAccess(path) {
  try {
    await access(path, constants.R_OK | constants.W_OK);
    return true;
  } catch (err) {
    console.error(err);
    console.error(`Cannot access: ${path}`);
    return false;
  }
}

async function checkFile(filePath) {
  const fileContent = await readFile(filePath, { encoding: 'utf8' });
  const formatted = format(fileContent);
  const valid = fileContent.localeCompare(formatted) === 0;

  return {
    filePath,
    formatted,
    valid
  }
}

async function main(){
  const { filePaths, checkFormat, onlyPrintFormatted, writeDecklists} = handleArguments();

  // get absolute paths
  const resolvedPaths = filePaths.map(p => resolve(p));

  // check if files are accessible
  const canAccessPaths = await Promise.all(resolvedPaths.map(canAccess));
  if (canAccessPaths.includes(false)) {
    return 1;
  }

  // format all files and check if valid
  const checkedFiles = await Promise.all(resolvedPaths.map(checkFile));

  if (onlyPrintFormatted) {
    for (const checkedFile of checkedFiles) {
      console.log(checkedFile.formatted);
      console.log('\n');
    }
  }

  if (writeDecklists) {
    await Promise.all(checkedFiles.map(({filePath, formatted}) => writeFile(filePath, formatted)));
  }

  if (checkFormat)  {
    const invalidFiles = checkedFiles.filter(({valid}) => !valid);
    invalidFiles.forEach(({filePath}) => {
      console.error(`Invalid format: ${filePath}`)
    });
    return invalidFiles.length === 0 ? 0 : 1;
  }

  return 0;
}

main().then(r => process.exit(r));
