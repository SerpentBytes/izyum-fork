#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const jsdom = require("jsdom")

var pjson = require("./../package.json")

export type ConsoleCommands =
  | "--help"
  | "-v"
  | "--version"
  | "-h"
  | "--help"
  | "-i"
  | "--input"

const initalHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Filename</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <!-- Your generated content here... -->
</body>
</html>`

function getInputFileName(words: Array<string>) {
  return words.reduce((prev, cur, index) => {
    if (index === 0) {
      return cur
    }

    return prev + " " + cur
  }, "")
}

const helpMessage = `
  Description: The Izyum is a simple SSG that converts .txt 
  Usage: 
    izyum [options]
  Options:
    --help | -h - shows help message (eg. izyum --help)
    --version | -v - shows the version (eg. izyum --version)
    -input - converts provided .txt file to .html (eg. izyum --input filename.txt)
    -i - covnerts .txt files of provided folder to .html (eg. izyum -i foldername)
`

function printCommandHelp() {
  console.log(helpMessage)
}

function printCommandVersion() {
  console.log(`
    App Name: Izyum
    Verion: ${pjson.version}
  `)
}

function prepearDistFolder() {
  fs.rmSync("./dist", { recursive: true, force: true })
  fs.mkdirSync("./dist")
}

function transformToSerializedHtml(lines: Array<string>) {
  const { JSDOM } = jsdom
  const dom = new JSDOM(initalHtml)
  const { window } = dom

  let paragraphBuffer = ""

  lines.forEach((line, index) => {
    if (index === 0) {
      window.document.title = line
      const newH1 = window.document.createElement("h1")
      newH1.innerHTML = line
      window.document.body.appendChild(newH1)
    } else if (line === "" && paragraphBuffer !== "") {
      const newP = window.document.createElement("p")
      newP.innerHTML = paragraphBuffer
      window.document.body.appendChild(newP)
      paragraphBuffer = ""
    } else {
      paragraphBuffer += line
    }
  })

  return dom.serialize()
}

function proccessTextFile(filename: string) {
  const fileContent = getFileContent(filename)

  const result = transformToSerializedHtml(fileContent)
  fs.writeFile(`./dist/${path.parse(filename).name}.html`, result, (err) => {
    if (err) {
      console.error(err)
    }
  })
}

function proccessSingleFile(filename: string) {
  prepearDistFolder()
  proccessTextFile(filename)
}

function proccessFolder(folderName: string) {
  prepearDistFolder()
  fs.readdir(folderName, (err, files) => {
    if (err) console.log(err)
    else {
      files.forEach((file) => {
        if (path.extname(file) === ".txt") {
          proccessTextFile(`${folderName}/${file}`)
        }
      })
    }
  })
}

function getArgs() {
  const args = process.argv.slice(2)
  return args
}

function getFileContent(filename: string): Array<string> {
  const allFileContents = fs.readFileSync(filename, "utf-8")

  return allFileContents.split(/\r?\n/)
}

const symbols = getArgs()

switch (symbols[0] as ConsoleCommands) {
  case "-h":
  case "--help":
    printCommandHelp()
    break
  case "-v":
  case "--version":
    printCommandVersion()
    break
  case "--input":
    proccessSingleFile(getInputFileName(symbols.slice(1, symbols.length)))
    break
  case "-i":
    proccessFolder(getInputFileName(symbols.slice(1, symbols.length)))
    break
  default:
    console.log("unkown command, try --help")
}