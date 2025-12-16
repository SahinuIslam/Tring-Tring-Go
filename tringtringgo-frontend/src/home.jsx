import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-page">
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-overlay" />
        <div className="home-hero-content">
          <h1>Smart travel guide for Dhaka, in one place.</h1>
          <p>
            TringTringGo connects travelers, local merchants, and admins to make
            discovering places, foods, and essential services easier than ever.
          </p>
          <div className="home-hero-actions">
            <Link to="/signup" className="home-btn primary">
              Get started
            </Link>
            <Link to="/explore" className="home-btn secondary">
              Explore Dhaka
            </Link>
          </div>
        </div>
      </section>

      {/* For travelers */}
      <section className="home-section">
        <div className="home-section-text">
          <h2>For travelers</h2>
          <p>
            Stop jumping between random Facebook groups and blogs. Get
            structured, local insights about areas, foods, and services in
            Dhaka – with ratings, reviews, and a real community feed.
          </p>
          <ul>
            <li>Browse destinations and top–rated foods in each area</li>
            <li>See essential services: hospitals, police, ATMs, pharmacies</li>
            <li>Join the community: price alerts, traffic, food tips, lost & found</li>
          </ul>
        </div>
        <div className="home-section-image">
          <div className="home-image-card">
            <span className="home-tag">Traveler view</span>
            <h3>Plan your day in Dhanmondi</h3>
            <p>See nearby cafes, parks, clinics, and honest reviews in one view.</p>
          </div>
        </div>
      </section>

      {/* For merchants */}
      <section className="home-section reverse">
        <div className="home-section-text">
          <h2>For merchants</h2>
          <p>
            TringTringGo lets local businesses be discovered by the right
            travelers – not lost inside generic social feeds.
          </p>
          <ul>
            <li>Create and manage your restaurant or mall listing</li>
            <li>Show opening hours, address, phone, and description</li>
            <li>Request verification from area admin to build trust</li>
          </ul>
        </div>
        <div className="home-section-image">
          <div className="home-image-card">
            <span className="home-tag">Merchant dashboard</span>
            <h3>Tell your story to nearby travelers</h3>
            <p>
              Highlight your signature dishes, location, and timing – all in a
              clean profile.
            </p>
          </div>
        </div>
      </section>

      {/* Services strip */}
      <section className="home-strip">
        <h2>Everything you need around you</h2>
        <p>
          Quickly find hospitals, police stations, ATMs, pharmacies and transport hubs
          near your area in Dhaka.
        </p>
        <div className="home-strip-grid">
          <div className="home-strip-card">Hospitals & clinics</div>
          <div className="home-strip-card">Police & safety</div>
          <div className="home-strip-card">ATMs & banks</div>
          <div className="home-strip-card">Pharmacies</div>
          <div className="home-strip-card">Bus & train hubs</div>
        </div>
      </section>

      {/* Community & chat */}
      <section className="home-section">
        <div className="home-section-text">
          <h2>Community, chat & chatbot</h2>
          <p>
            TringTringGo is not just a directory – it’s a conversation around
            Dhaka’s streets.
          </p>
          <ul>
            <li>Share price alerts, traffic updates, and food tips</li>
            <li>Comment and react to posts from real travelers</li>
            <li>Chat with merchants for quick questions</li>
            <li>Use the chatbot for common travel FAQs (coming soon)</li>
          </ul>
        </div>
        <div className="home-section-image">
          <div className="home-image-card">
            <span className="home-tag">Community feed</span>
            <h3>Real–time updates from the city</h3>
            <p>
              See what’s happening now in your area – before you step out.
            </p>
          </div>
        </div>
      </section>

      {/* Final call-to-action */}
      <section className="home-cta">
        <h2>Ready to explore Dhaka smarter?</h2>
        <p>
          Create an account as a traveler or merchant and start using
          TringTringGo today.
        </p>
        <div className="home-hero-actions">
          <Link to="/signup" className="home-btn primary">
            Join now
          </Link>
          <Link to="/login" className="home-btn secondary">
            Log in
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
