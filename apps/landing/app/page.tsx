export default function Home() {
  return (
    <div className="container">
      <div className="content">
        <header className="header">
          <h1 className="title">
            Sanaattori
          </h1>
          <p className="subtitle">
            Collection of Finnish Word Games
          </p>
        </header>

        <div className="games-grid">
          {/* Sanasto Game Card */}
          <a
            href="/sanasto"
            className="game-card"
          >
            <div className="game-card-content">
              <div className="game-icon">
                <span className="game-icon-text">S</span>
              </div>
              <h2 className="game-title">
                Sanasto
              </h2>
              <p className="game-description">
                A Wordle-style word guessing game in Finnish
              </p>
            </div>
          </a>

          {/* Placeholder for future games */}
          <div className="game-card placeholder-card">
            <div className="game-card-content">
              <div className="game-icon placeholder-icon">
                <span className="game-icon-text placeholder-icon-text">?</span>
              </div>
              <h2 className="game-title placeholder-title">
                Coming Soon
              </h2>
              <p className="game-description placeholder-description">
                More word games coming soon!
              </p>
            </div>
          </div>

          <div className="game-card placeholder-card">
            <div className="game-card-content">
              <div className="game-icon placeholder-icon">
                <span className="game-icon-text placeholder-icon-text">?</span>
              </div>
              <h2 className="game-title placeholder-title">
                Coming Soon
              </h2>
              <p className="game-description placeholder-description">
                More word games coming soon!
              </p>
            </div>
          </div>
        </div>

        <footer className="footer">
          <p>Enjoy our collection of Finnish word games!</p>
        </footer>
      </div>
    </div>
  );
}
