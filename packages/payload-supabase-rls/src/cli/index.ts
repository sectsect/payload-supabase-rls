#!/usr/bin/env node

import { Command } from 'commander';
// eslint-disable-next-line import/no-extraneous-dependencies
import dotenv from 'dotenv';

import { enableCommand } from './commands/enable.js';
import { statusCommand } from './commands/status.js';
import { verifyCommand } from './commands/verify.js';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('payload-supabase-rls')
  .description('Manage Row-Level Security (RLS) for Supabase PostgreSQL')
  .version('0.1.0');

program.addCommand(enableCommand);
program.addCommand(verifyCommand);
program.addCommand(statusCommand);

program.parse(process.argv);
