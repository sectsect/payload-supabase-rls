import { notFound } from 'next/navigation';

import PostContent from '@/components/modules/PostContent/PostContent';
import { getPostById } from '@/utils/queries/post';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

const Page = async ({ params }: Props) => {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    notFound();
  }

  return <PostContent post={post} />;
};

export default Page;
