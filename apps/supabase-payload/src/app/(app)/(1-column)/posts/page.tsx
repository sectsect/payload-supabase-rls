import { notFound } from 'next/navigation';

import PostArchive from '@/components/modules/PostArchive/PostArchive';
import { getPostsForArchive } from '@/utils/queries/post';

const page = async () => {
  const data = await getPostsForArchive();

  if (!data) {
    notFound();
  }

  return <PostArchive data={data} />;
};

export default page;
