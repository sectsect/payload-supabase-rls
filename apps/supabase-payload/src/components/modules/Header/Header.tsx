import Link from 'next/link';

const Header = () => {
  return (
    <header>
      <div className="inner flex items-center justify-between py-6">
        <Link href="/" className="text-2xl font-bold md:text-6xl">
          The Really Good Project
        </Link>

        <nav>
          <ul className="flex gap-4 text-sm font-bold md:text-xl">
            <li>
              <Link href="/posts">Posts</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
