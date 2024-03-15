import './App.scss';
import GamePage from './pages/GamePage/GamePage';
import background from './assets/6661821.jpg'
import HomePage from './pages/HomePage/HomePage'
import { useContext } from 'react';
import { GameContext } from './contexts/GameContext';
function App() {
  const {isLoggedIn} = useContext(GameContext)
  return (
    <div style={{backgroundImage: `url(${background})` }} className='container'>
      {isLoggedIn?
      <GamePage />:
      <HomePage />
      }
    </div>

  );
}

export default App;
