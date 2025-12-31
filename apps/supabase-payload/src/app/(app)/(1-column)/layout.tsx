import Footer from '@/components/modules/Footer/Footer';
import Header from '@/components/modules/Header/Header';

interface Props {
  children: React.ReactNode;
}

const OneColumnLayout = ({ children }: Props) => {
  return (
    <>
      <Header />
      <main className="flex-1">
        <article>{children}</article>
      </main>
      <Footer />
    </>
  );
};

export default OneColumnLayout;
