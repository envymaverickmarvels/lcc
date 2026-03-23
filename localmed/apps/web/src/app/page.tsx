import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="hero">
        <div className="container">
          <h1>Find Medicines Nearby</h1>
          <p>Search and reserve medicines from pharmacies near you</p>
          <div className="search-box">
            <input type="text" placeholder="Search for medicines..." />
            <button>Search</button>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2>How It Works</h2>
          <div className="feature-grid">
            <div className="feature">
              <h3>1. Search</h3>
              <p>Search for medicines and see availability at nearby pharmacies</p>
            </div>
            <div className="feature">
              <h3>2. Reserve</h3>
              <p>Reserve your medicines for pickup</p>
            </div>
            <div className="feature">
              <h3>3. Pickup</h3>
              <p>Collect your medicines from the pharmacy</p>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <p>&copy; 2026 LocalMed. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
