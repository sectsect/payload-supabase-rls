import type { TextBlock } from '@/payload-types';

interface Props {
  block: TextBlock;
}

const BlockText = ({ block }: Props) => {
  const { text } = block;

  return <p>{text}</p>;
};

export default BlockText;
