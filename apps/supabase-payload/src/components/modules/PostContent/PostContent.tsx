import PostHeader from '@/components/modules/PostHeader/PostHeader';
import PostLead from '@/components/modules/PostLead/PostLead';
import PostPages from '@/components/modules/PostPages/PostPages';
import type { Post } from '@/payload-types';

interface Props {
  post: Post;
}

const PostContent = ({ post }: Props) => {
  // console.log(post);
  const { title, publishedAt, lead, page } = post;

  return (
    <>
      <PostHeader title={title} publishedAt={publishedAt} />
      <PostLead text={lead} />
      <PostPages pages={page} />
    </>
  );
};

export default PostContent;
