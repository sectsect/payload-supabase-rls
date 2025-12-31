import type { Post } from '@/payload-types';

interface Props {
  text: Post['lead'];
}

const PostLead = ({ text }: Props) => {
  if (!text) {
    return null;
  }

  return (
    <section>
      <div className="inner space-y-6 md:space-y-8">
        <p className="font-bold">{text}</p>
      </div>
    </section>
  );
};

export default PostLead;
