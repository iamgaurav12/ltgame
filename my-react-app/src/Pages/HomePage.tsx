import { TypewriterEffectSmooth } from "../components/ui/Typewriter";
import { Link } from "react-router-dom"; // Changed from 'react-router' to 'react-router-dom'
import { useMemo } from "react"; // Added for memoization

const HomePage = () => {
  // Memoize the words array to prevent unnecessary recalculations
  const words = useMemo(() => [
    { text: "Welcome" },
    { text: "to" },
    { text: "Lawyaltech" },
    { text: "game" },
  ], []);

  // Extract button classes to constants for better maintainability
  const primaryButtonClasses = "w-40 h-10 rounded-xl bg-green-600 hover:bg-green-700 border border-transparent text-white text-sm transition-colors";
  const secondaryButtonClasses = "w-40 h-10 rounded-xl bg-white text-green-600 border border-green-600 hover:bg-green-50 text-sm transition-colors";

  return (
    <div className="flex flex-col items-center justify-center min-h-[40rem] bg-gradient-to-b from-green-200 to-white px-4"> {/* Added px-4 for mobile padding */}
      
      <TypewriterEffectSmooth words={words} className="mb-6" />
      
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 space-x-0 md:space-x-4 mt-8">
        <Link 
          to="/login" 
          className="no-underline" // Using className instead of inline style
        >
          <button className={primaryButtonClasses}>
            Login
          </button>
        </Link>
        <Link 
          to="/signup" 
          className="no-underline" // Using className instead of inline style
        >
          <button className={secondaryButtonClasses}>
            Signup
          </button>
        </Link>
      </div>
      
      <div className="w-full max-w-4xl py-10 px-4"> {/* Added container for better video sizing */}
        <video 
          className="w-full rounded-lg shadow-md" // Added shadow for better appearance
          controls 
          autoPlay 
          muted // Added muted for autoplay to work in most browsers
          loop // Added loop if you want the video to repeat
          playsInline // Better for mobile
        >
          <source src="/video.mp4" type="video/mp4" />
          Your browser does not support the video tag. {/* Fallback text */}
        </video>
      </div>
    </div>
  );
};

export default HomePage;