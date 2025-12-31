/* eslint-disable @typescript-eslint/no-shadow */
import { Fragment } from 'react';

import { match } from 'ts-pattern';

import BlockButton from '@/components/elements/BlockButton/BlockButton';
import BlockHeading from '@/components/elements/BlockHeading/BlockHeading';
import BlockRichText from '@/components/elements/BlockRichText/BlockRichText';
import BlockSlider from '@/components/elements/BlockSlider/BlockSlider';
import BlockText from '@/components/elements/BlockText/BlockText';
import type { Page } from '@/payload-types';

interface Props {
  pages?: Page;
}

const PostPages = ({ pages }: Props) => {
  // console.log(pages);
  if (!pages) {
    return null;
  }

  return (
    <>
      {pages.map(page => {
        const { id, block: blocks } = page;

        if (!blocks || blocks.length === 0) {
          return null;
        }

        return (
          <div key={id} className="inner mt-8 space-y-8 md:mt-10 md:space-y-10">
            {blocks.map(block => {
              return match(block)
                .with({ blockType: 'Heading2' }, block => (
                  <BlockHeading key={block.id} block={block} />
                ))
                .with({ blockType: 'Text' }, block => (
                  <BlockText key={block.id} block={block} />
                ))
                .with({ blockType: 'RichText' }, block => (
                  <BlockRichText key={block.id} block={block} />
                ))
                .with({ blockType: 'Button' }, block => (
                  <BlockButton key={block.id} block={block} />
                ))
                .with({ blockType: 'Slider' }, block => (
                  <BlockSlider key={block.id} block={block} />
                ))
                .exhaustive();
              // .otherwise(() => null);
            })}
          </div>
        );
      })}
    </>
  );
};

export default PostPages;
