/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import { RootPage, generatePageMetadata } from '@payloadcms/next/views';

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

const Page = async ({ params, searchParams }: Args) => {
  return RootPage({
    config,
    importMap,
    params,
    searchParams,
  });
};

export default Page;
