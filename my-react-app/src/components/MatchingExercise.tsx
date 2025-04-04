import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MatchingItem } from "../types";
import MatchLine from "./MatchLine";
import "../styles/MatchingExercise.css";
import { auth } from "../Pages/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import correctSound from "../assets/correct.mp3";
import incorrectSound from "../assets/incorrect.mp3";

// Initialize Firestore
const db = getFirestore();

interface MatchingExerciseProps {
  data: MatchingItem[];
  levelId: number;
}

const MatchingExercise = ({ data, levelId }: MatchingExerciseProps) => {
  // State management
  const [items, setItems] = useState<MatchingItem[]>(() => [...data]);
  const [selectedTerm, setSelectedTerm] = useState<MatchingItem | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [lines, setLines] = useState<
    {
      startId: string;
      endId: string;
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      color: string;
    }[]
  >([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [score, setScore] = useState<number>(0);
  const [scoreChange, setScoreChange] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const [highestScore, setHighestScore] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);
  const [correctMatches, setCorrectMatches] = useState<number>(0);
  const [totalMatches, setTotalMatches] = useState<number>(0);
  const [progressPercentage, setProgressPercentage] = useState<number>(0);

  // Refs & hooks
  const termRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const defRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const navigate = useNavigate();

  // Audio refs - memoized to prevent recreation on each render
  const correctSoundRef = useRef(new Audio(correctSound));
  const incorrectSoundRef = useRef(new Audio(incorrectSound));

  // Constants
  const CORRECT_MATCH_POINTS = 10;
  const INCORRECT_MATCH_PENALTY = 5;
  const SCORE_ANIMATION_DURATION = 2000;

  // Track user authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchUserData(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch user data from Firestore
  const fetchUserData = async (userId: string) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Get existing highest score and attempts for this matching exercise level
        const levelData = userData.levelStats?.[`matching${levelId}`];
        if (levelData) {
          setHighestScore(levelData.highestScore || 0);
          setAttempts(levelData.attempts || 0);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // Update lines position on window resize
  useEffect(() => {
    // Skip updating lines if showCompletion is true
    if (showCompletion) return;

    const updateLines = () => {
      setLines((prevLines) =>
        prevLines.map((line) => {
          const termElement = termRefs.current[line.startId];
          const defElement = defRefs.current[line.endId];

          if (termElement && defElement) {
            const termRect = termElement.getBoundingClientRect();
            const defRect = defElement.getBoundingClientRect();

            return {
              ...line,
              startX: termRect.right,
              startY: termRect.top + termRect.height / 2,
              endX: defRect.left,
              endY: defRect.top + defRect.height / 2,
            };
          }
          return line;
        })
      );
    };

    window.addEventListener("resize", updateLines);
    // Execute updateLines once on mount and when lines change
    updateLines();
    return () => window.removeEventListener("resize", updateLines);
  }, [lines, showCompletion]);

  // Check if exercise is complete and save score
  // Modified to check if all terms have been matched (not just correct matches)
  const isComplete = Object.keys(matches).length === items.length;

  useEffect(() => {
    if (isComplete && !showCompletion) {
      saveScoreToFirestore();
      // Clear lines when showing completion popup
      setLines([]);
      setShowCompletion(true);
    }
  }, [isComplete, showCompletion, items.length]);

  // Save score to Firestore when exercise is completed
  const saveScoreToFirestore = async () => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      // Get current attempt count
      const newAttemptCount = attempts + 1;

      // Determine if this is a new high score
      const isNewHighScore = score > highestScore;
      const newHighestScore = isNewHighScore ? score : highestScore;

      // Create score entry
      const scoreEntry = {
        level: `matching${levelId}`,
        score: score,
        timestamp: new Date(),
        attempt: newAttemptCount,
      };

      // Create level stats entry
      const levelStatsEntry = {
        [`matching${levelId}`]: {
          highestScore: newHighestScore,
          attempts: newAttemptCount,
          lastPlayed: new Date(),
        },
      };

      // Prepare update data
      let updateData: Record<string, any> = {
        matchingScores: [scoreEntry],
        levelStats: levelStatsEntry,
      };

      // If user document already exists, preserve existing data
      if (userDoc.exists()) {
        const existingData = userDoc.data();

        if (
          existingData.matchingScores &&
          Array.isArray(existingData.matchingScores)
        ) {
          updateData.matchingScores = [
            ...existingData.matchingScores,
            scoreEntry,
          ];
        }

        // Preserve stats for other levels
        if (existingData.levelStats) {
          updateData.levelStats = {
            ...existingData.levelStats,
            ...levelStatsEntry,
          };
        }
      }

      // Update the database
      await setDoc(userRef, updateData, { merge: true });

      // Update local state
      setAttempts(newAttemptCount);
      if (isNewHighScore) {
        setHighestScore(score);
      }
    } catch (error) {
      console.error("Error saving score: ", error);
    }
  };

  // Create a line between term and definition
  const createConnectionLine = (
    termId: string,
    defId: string,
    color: string
  ) => {
    const termElement = termRefs.current[termId];
    const defElement = defRefs.current[defId];

    if (!termElement || !defElement) return null;

    const termRect = termElement.getBoundingClientRect();
    const defRect = defElement.getBoundingClientRect();

    // Fix: Calculate positions relative to the viewport
    // Start from the right edge of the term
    // End at the left edge of the definition
    return {
      startId: termId,
      endId: defId,
      startX: termRect.right,
      startY: termRect.top + termRect.height / 2,
      endX: defRect.left,
      endY: defRect.top + defRect.height / 2,
      color: color,
    };
  };

  // Handle term click
  const handleTermClick = (item: MatchingItem) => {
    // Don't allow clicking on terms that are already matched
    if (matches[item.id]) return;
    setSelectedTerm((prev) => (prev?.id === item.id ? null : item));
  };

  // Handle definition click
  const handleDefinitionClick = (item: MatchingItem) => {
    // Guard clauses for invalid interactions
    if (!selectedTerm) return;
    if (Object.values(matches).includes(item.id)) return;
    if (matches[selectedTerm.id]) return;

    const isCorrectMatch = item.id === selectedTerm.id;
    const lineColor = isCorrectMatch ? "#10B981" : "#EF4444";

    // Remove any existing lines from the selected term
    setLines((prevLines) =>
      prevLines.filter((line) => line.startId !== selectedTerm.id)
    );

    // Create new connection line
    const newLine = createConnectionLine(selectedTerm.id, item.id, lineColor);
    if (newLine) {
      setLines((prevLines) => [...prevLines, newLine]);
    }

    // Update score based on match correctness
    let change = 0;
    if (isCorrectMatch) {
      setScore((prevScore) => prevScore + CORRECT_MATCH_POINTS);
      change = CORRECT_MATCH_POINTS;
      setCorrectMatches((prev) => prev + 1);
      correctSoundRef.current.play();
    } else {
      if (score > 0) {
        setScore((prevScore) =>
          Math.max(0, prevScore - INCORRECT_MATCH_PENALTY)
        );
        change = -INCORRECT_MATCH_PENALTY;
        incorrectSoundRef.current.play();
      }
    }

    // Show score change animation
    if (change !== 0) {
      setScoreChange(change);
      setTimeout(() => setScoreChange(null), SCORE_ANIMATION_DURATION);
    }

    // Record the match
    setMatches((prev) => ({
      ...prev,
      [selectedTerm.id]: item.id,
    }));

    // Update total matches
    setTotalMatches((prev) => prev + 1);

    // Clear selected term
    setSelectedTerm(null);

    // Update progress percentage based on total matches (not just correct ones)
    const totalItems = items.length;
    const progress = ((Object.keys(matches).length + 1) / totalItems) * 100;
    setProgressPercentage(progress);
  };

  // Navigate home
  const goHome = () => navigate("/dashboard");

  // Reset exercise
  const resetExercise = () => {
    setItems([...data]);
    setSelectedTerm(null);
    setMatches({});
    setLines([]);
    setScore(0);
    setScoreChange(null);
    setCorrectMatches(0);
    setTotalMatches(0);
    setProgressPercentage(0);
    setShowCompletion(false);
  };

  return (
    <div className="matching-exercise-container">
      <h1 className="matching-exercise-title">
        Match the definitions with the correct terms
      </h1>

      {/* Progress and Score section */}
      <div className="flex-none px-2 sm:px-4 mb-4">
        <div className="flex items-center space-x-4 lg:mt-2">
          <div className="w-full bg-opacity-30 bg-indigo-300 h-2 sm:h-3 md:h-4 rounded-full overflow-hidden border border-indigo-500/30">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Score Display */}
        <div className="flex flex-col sm:flex-row justify-between px-2 py-2">
          <div className="px-4 py-1 my-2 bg-white rounded-full text-[#34C759] text-[18px] shadow-lg shadow-black/50">
            Level {levelId}
          </div>
          <div className="flex gap-x-2 sm:gap-x-4 relative">
            <div className="relative">
              <div className="px-4 py-1 my-2 bg-white rounded-full text-[#34C759] text-[18px] shadow-lg shadow-black/50">
                Score: {score}
              </div>
              {scoreChange !== null && (
                <div
                  className={`absolute -top-6 right-0 text-sm sm:text-lg font-bold ${
                    scoreChange > 0 ? "text-green-500" : "text-red-500"
                  } animate-bounce`}
                >
                  {scoreChange > 0 ? `+${scoreChange}` : scoreChange}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="matching-columns">
        <div className="terms-column">
          {items.map((item) => (
            <div
              key={`term-${item.id}`}
              ref={(el) => {
                termRefs.current[item.id] = el;
              }}
              className={`term-item ${
                selectedTerm?.id === item.id ? "selected" : ""
              } ${matches[item.id] ? "matched" : ""}`}
              onClick={() => handleTermClick(item)}
            >
              {item.term}
            </div>
          ))}
        </div>

        <div className="definitions-column">
          {items.map((item) => (
            <div
              key={`def-${item.id}`}
              ref={(el) => {
                defRefs.current[item.id] = el;
              }}
              className={`definition-item ${
                Object.values(matches).includes(item.id) ? "matched" : ""
              }`}
              onClick={() => handleDefinitionClick(item)}
            >
              {item.definition}
            </div>
          ))}
        </div>

        {/* Only show lines when not showing completion popup */}
        {!showCompletion &&
          lines.map((line, index) => (
            <MatchLine
              key={`line-${index}`}
              startX={line.startX}
              startY={line.startY}
              endX={line.endX}
              endY={line.endY}
              color={line.color}
            />
          ))}
      </div>

      {/* Buttons */}
      <div className="mt-6 flex justify-center gap-4">
        <button
          className="px-6 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition duration-300"
          onClick={goHome}
        >
          Home
        </button>
        <button
          className="px-6 py-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition duration-300"
          onClick={resetExercise}
        >
          Reset Exercise
        </button>
      </div>

      {/* Completion Popup */}
      {showCompletion && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/50 backdrop-blur-md p-4 z-50">
          <div className="bg-gradient-to-r from-indigo-900 to-violet-900 p-4 sm:p-6 md:p-8 rounded-lg shadow-2xl border-2 border-indigo-500 w-full max-w-xs sm:max-w-sm md:max-w-md">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 text-white">
              Exercise Completed!
            </h2>
            <p className="text-base sm:text-lg text-indigo-200 mb-2">
              Final Score: {score}
            </p>
            <p className="text-base sm:text-lg text-indigo-200 mb-2">
              Highest Score: {score > highestScore ? score : highestScore}
            </p>
            <p className="text-base sm:text-lg text-indigo-200 mb-4">
              Attempt: {attempts + 1}
            </p>
            {score > highestScore && (
              <p className="text-base text-green-300 font-bold mb-4 animate-pulse">
                New high score! Congratulations!
              </p>
            )}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  // First navigate to dashboard, bypassing the normal flow
                  navigate("/dashboard");
                  // We don't need to set showCompletion to false here
                  // since we're navigating away from the component
                }}
                className="mt-4 md:mt-6 px-3 sm:px-4 md:px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 transition-all duration-300 cursor-pointer text-xs sm:text-sm md:text-base"
              >
                Home
              </button>
              <button
                onClick={() => {
                  setShowCompletion(false);
                  resetExercise();
                }}
                className="mt-4 md:mt-6 px-3 sm:px-4 md:px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-400 transition-all duration-300 cursor-pointer text-xs sm:text-sm md:text-base"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchingExercise;
