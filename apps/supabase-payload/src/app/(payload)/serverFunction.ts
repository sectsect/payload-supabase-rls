'use server';

import { handleServerFunctions } from '@payloadcms/next/layouts';
import type { ServerFunctionClientArgs } from 'payload';

import configPromise from '@payload-config';

import { importMap } from './admin/importMap.js';

/**
 * Server function handler for Payload admin panel
 * Processes server-side operations within the Payload CMS admin interface
 */
const serverFunction = async (args: ServerFunctionClientArgs) => {
  const config = await configPromise;
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

export default serverFunction;
