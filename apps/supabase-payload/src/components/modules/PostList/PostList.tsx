import Link from 'next/link';

import type { Post } from '@/payload-types';
import { formatDate } from '@/utils/datetime';

interface Props {
  posts: Post[];
}

const PostList = ({ posts }: Props) => {
  return (
    <ul>
      {posts.map(post => {
        const { id, title, publishedAt } = post;

        return (
          <li key={id}>
            <Link href={`/posts/${id}`}>
              <h3 className="font-bold">{title}</h3>
              <time className="text-sm text-gray-600" dateTime={publishedAt}>
                {formatDate(publishedAt)}
              </time>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default PostList;
