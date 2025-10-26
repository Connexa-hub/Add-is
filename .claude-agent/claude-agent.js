#!/usr/bin/env node
// Claude Agent — Repo Editing Tool
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs-extra";
import * as globby from "globby"; // ✅ fixed import for Node v22
import chalk from "chalk";
import path from "path";
import process from "process";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Grab user prompt
const userPrompt = process.argv.slice(2).join(" ");
if (!userPrompt) {
  console.log(chalk.red("❌ Please provide a task for Claude."));
  process.exit(1);
}

// Define repo root (parent folder)
const repoPath = path.resolve(process.cwd());
console.log(chalk.cyan(`📂 Scanning repo at: ${repoPath}`));

// Load code files
const files = await globby.globby(["**/*.{js,jsx,ts,tsx,json,md}"], {
  gitignore: true,
  cwd: repoPath,
});

if (!files.length) {
  console.log(chalk.red("⚠️ No code files found."));
  process.exit(1);
}

// Load small sample of files to keep context small
const contextFiles = files.slice(0, 10);
let context = "";
for (const file of contextFiles) {
  try {
    const content = await fs.readFile(path.join(repoPath, file), "utf-8");
    context += `\n\n# FILE: ${file}\n${content}`;
  } catch (e) {
    console.warn(chalk.yellow(`⚠️ Skipped: ${file}`));
  }
}

console.log(chalk.yellow(`🧠 Sending request to Claude (analyzing ${contextFiles.length} files)...`));

const prompt = `
You are an expert full-stack mobile developer.
The user wants to modify the repo as follows:
"${userPrompt}"

Here is a partial view of the current project for context:
${context}

Make the necessary code changes step-by-step and return updated code blocks with filenames.
`;

const response = await client.messages.create({
  model: "claude-3-5-sonnet",
  max_tokens: 4000,
  messages: [{ role: "user", content: prompt }],
});

console.log(chalk.green("\n💬 Claude's response:\n"));
console.log(response.content[0].text);

// Optional: Auto-save if Claude provides clear “FILE:” headers
if (response.content[0].text.includes("FILE:")) {
  const matches = response.content[0].text.matchAll(/FILE:\s*(.*?)\n+```(?:\w+)?\n([\s\S]*?)```/g);
  for (const match of matches) {
    const filePath = match[1].trim();
    const newContent = match[2];
    const absPath = path.join(repoPath, filePath);
    await fs.outputFile(absPath, newContent);
    console.log(chalk.green(`✅ Updated: ${filePath}`));
  }
}
