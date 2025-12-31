import type { PayloadLexicalReactRendererContent } from '@atelier-disko/payload-lexical-react-renderer';

import LexicalRichText from '@/components/elements/LexicalRichText/LexicalRichText';
import type { RichTextBlock } from '@/payload-types';

interface Props {
  block: RichTextBlock;
}

const BlockRichText = ({ block }: Props) => {
  const { richText } = block;

  return (
    <LexicalRichText content={richText as PayloadLexicalReactRendererContent} />
  );
};

export default BlockRichText;
