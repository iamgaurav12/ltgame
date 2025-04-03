import { TypewriterEffectSmooth } from "../components/ui/Typewriter";
import { Link } from "react-router";
const HomePage = () => {
  const words = [
    {
      text: "Welcome",
    },
    {
      text: "to",
    },
    {
      text: "Lawyaltech",
    },
    {
      text: "game",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-[40rem] bg-gradient-to-b from-green-200 to-white">
      <p className="text-green-400 text-sm sm:text-lg mb-2">
        Where law and technology meet to make an impact
      </p>
      <TypewriterEffectSmooth words={words} className="mb-6" />
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 space-x-0 md:space-x-4 mt-8">
        <Link to="/login" style={{textDecoration: 'none'}}>
        <button className="w-40 h-10 rounded-xl bg-green-600 hover:bg-green-700 border border-transparent text-white text-sm transition-colors">
          Login
        </button>
        </Link>
        <Link to="/signup" style={{textDecoration: 'none'}}>
        <button className="w-40 h-10 rounded-xl bg-white text-green-600 border border-green-600 hover:bg-green-50 text-sm transition-colors">
          Signup
        </button>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;