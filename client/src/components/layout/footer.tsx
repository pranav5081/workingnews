// Simple footer with only copyright text

const Footer = () => {
  return (
    <footer className="bg-neutral-800 text-white py-4">
      <div className="container mx-auto px-4">
        <div className="flex justify-center items-center">
          <p className="text-neutral-400 text-sm">
            © {new Date().getFullYear()} NewsHub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
