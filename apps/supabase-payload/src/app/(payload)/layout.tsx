/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import React from 'react';

import { RootLayout } from '@payloadcms/next/layouts';

import configPromise from '@payload-config';

import { importMap } from './admin/importMap.js';
import serverFunction from './serverFunction';

/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */

import '@payloadcms/next/css';

import './custom.scss';

type Args = {
  children: React.ReactNode;
};

const Layout = ({ children }: Args) => (
  <RootLayout
    config={configPromise}
    importMap={importMap}
    serverFunction={serverFunction}
    children={children}
  />
);

export default Layout;
