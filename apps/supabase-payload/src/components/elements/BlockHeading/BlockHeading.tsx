import type { HeadingBlock } from '@/payload-types';

interface Props {
  block: HeadingBlock;
}

const BlockHeading = ({ block }: Props) => {
  const { text } = block;

  return <h2 className="text-2xl font-bold">{text}</h2>;
};

export default BlockHeading;
