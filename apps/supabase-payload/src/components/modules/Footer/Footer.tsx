import { getCurrentYear } from '@/utils/datetime';

const Footer = () => {
  return (
    <footer className="mt-12 bg-black text-white md:mt-20">
      <div className="inner py-6 font-bold ">
        <p>&copy; {getCurrentYear()} The Really Good Project</p>
      </div>
    </footer>
  );
};

export default Footer;
