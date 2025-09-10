import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div className="card landing">
      <h2>Welcome</h2>
      <p>Practice multiple choice questions.</p>
      <div className="landing-buttons">
        <Link to="/quiz"><button>Start Quiz</button></Link>
        <Link to="/settings"><button>Settings</button></Link>
        <Link to="/import"><button>Questions</button></Link>
      </div>
    </div>
  );
}

export default LandingPage;
