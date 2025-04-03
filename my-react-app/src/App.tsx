import { Routes, Route, Navigate } from "react-router";
import HomePage from "./Pages/HomePage";
import LevelOneQuizPage from "./Pages/LevelOneQuizPage";
import Level2 from "./Pages/LevelTwo";
import LevelTwoPart_Two from "./Pages/Level2_PartTwo";
import LevelOneDesign from "./Pages/Level1_newDesign";
import Questionnaire from "./Pages/Questionnaire";
import Live_Generation from "./Pages/Live_Generation";
import Finish from "./Pages/Finish";
import { HighlightedTextProvider } from "./context/HighlightedTextContext";
import { QuestionTypeProvider } from "./context/QuestionTypeContext";
import MatchingExercise from "./components/MatchingExercise";
import { matchingData } from "./data/matchingData";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider , useAuth } from "./context/AuthContext";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Dashboard from "./Pages/Dashboard";
import ForgotPassword from "./components/ForgotPAssword";

const App = () => {
  return (
    <AuthProvider>
      <HighlightedTextProvider>
        <QuestionTypeProvider>
          <ThemeProvider>
            <AppRoutes />
          </ThemeProvider>
        </QuestionTypeProvider>
      </HighlightedTextProvider>
    </AuthProvider>
  );
};

// Separate component for routes that can use the useAuth hook
const AppRoutes = () => {
  const { user } = useAuth(); // Now this is used within AuthProvider
  
  if (user === undefined) {
    return <p>Loading...</p>; // Prevent flickering while checking authentication
  }
  
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/Level-One-Quiz" element={<LevelOneQuizPage />} />
      <Route path="/Level-Two-Part-One" element={<Level2 />} />
      <Route path="/Matching-Exercise" element={<MatchingExercise data={matchingData} />} />
      <Route path="/Level-Two-Part-Two" element={<LevelTwoPart_Two />} />
      <Route path="/Questionnaire" element={<Questionnaire />} />
      <Route path="/Live_Generation" element={<Live_Generation />} />
      <Route path="/Level-One-Design" element={<LevelOneDesign />} />
      {/* <Route path="/Live_Generation_2" element={<Live_Generation_2 />}/> */}
      <Route path="/Finish" element={<Finish />} />
    </Routes>
  );
};

export default App;