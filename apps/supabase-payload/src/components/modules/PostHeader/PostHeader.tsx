import type { Post } from '@/payload-types';
import { formatDate } from '@/utils/datetime';

interface Props {
  title: Post['title'];
  publishedAt: Post['publishedAt'];
}

const PostHeader = ({ title, publishedAt }: Props) => {
  return (
    <header className="mb-12 font-bold">
      <div className="inner">
        <div className="flex flex-col gap-2 md:gap-4">
          <h1 className="text-4xl md:text-6xl">{title}</h1>
          <time className="text-sm text-gray-400" dateTime={publishedAt}>
            {formatDate(publishedAt)}
          </time>
        </div>
      </div>
    </header>
  );
};

export default PostHeader;
