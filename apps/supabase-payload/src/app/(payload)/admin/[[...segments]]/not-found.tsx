/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import { NotFoundPage, generatePageMetadata } from '@payloadcms/next/views';

import config from '@payload-config';

import { importMap } from '../importMap.js';
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */

type Args = {
  params: Promise<{
    segments: string[];
  }>;
  searchParams: Promise<{
    [key: string]: string | string[];
  }>;
};

export const generateMetadata = async ({ params, searchParams }: Args) => {
  return generatePageMetadata({
    config,
    params,
    searchParams,
  });
};

const NotFound = async ({ params, searchParams }: Args) => {
  return NotFoundPage({
    config,
    importMap,
    params,
    searchParams,
  });
};

export default NotFound;
