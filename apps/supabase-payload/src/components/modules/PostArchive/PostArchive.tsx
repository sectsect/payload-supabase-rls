import type { PaginatedDocs } from 'payload';

import PostList from '@/components/modules/PostList/PostList';
import type { Post } from '@/payload-types';

interface Props {
  data: PaginatedDocs<Post>;
}

const PostArchive = ({ data }: Props) => {
  const { docs: posts } = data;

  return (
    <>
      <header className="mb-12">
        <div className="inner">
          <h1 className="text-4xl font-bold">Posts</h1>
        </div>
      </header>

      <section>
        <div className="inner">
          {posts.length > 0 ? (
            <PostList posts={posts} />
          ) : (
            <p>No posts found</p>
          )}
        </div>
      </section>
    </>
  );
};

export default PostArchive;
