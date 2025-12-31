import Link from 'next/link';

import type { ButtonBlock } from '@/payload-types';

interface Props {
  block: ButtonBlock;
}

const BlockButton = ({ block }: Props) => {
  const { url, label } = block;

  return (
    <div className="flex justify-center">
      <Link
        href={url}
        className="min-w-[200px] rounded-full bg-black px-8 py-4 text-center text-lg font-bold text-white"
      >
        {label || 'Learn More'}
      </Link>
    </div>
  );
};

export default BlockButton;
