// storage-adapter-import-placeholder
import path from 'path';
import { fileURLToPath } from 'url';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import { payloadSupabaseRLS } from '@sect/payload-supabase-rls/integrations/payload';
import { buildConfig } from 'payload';
import sharp from 'sharp';

import { Documents } from './collections/Documents';
import { Media } from './collections/Media';
import { Posts } from './collections/Posts';
import { Users } from './collections/Users';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users, Media, Documents, Posts],
  editor: lexicalEditor(),
  // editor: lexicalEditor({
  //   features: ({ defaultFeatures }) => [
  //     ...defaultFeatures,
  //     // HTMLConverterFeature({}),
  //   ],
  // }),
  // editor: lexicalEditor({
  //   features: [
  //     // ParagraphFeature(),
  //     HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4', 'h5', 'h6'] }),
  //     // BlockQuoteFeature({}),
  //     LinkFeature({}),
  //   ],
  // }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [
    // storage-adapter-placeholder
    s3Storage({
      collections: {
        media: {
          prefix: 'media',
        },
      },
      bucket: process.env.S3_BUCKET || '',
      config: {
        forcePathStyle: true, // Important for using Supabase
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        region: process.env.S3_REGION,
        endpoint: process.env.S3_ENDPOINT,
      },
    }),
    payloadSupabaseRLS({
      autoEnable: true,
      environments: ['development'],
    }),
  ],
  localization: {
    locales: ['ja'],
    defaultLocale: 'ja',
    fallback: true,
  },
});
