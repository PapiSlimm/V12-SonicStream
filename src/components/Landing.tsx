import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900">
      <header className="p-8 text-white">
        <h1 className="text-5xl font-bold">Indie Artist Platform</h1>
        <p className="mt-4 text-xl">Upload • Stream • Monetize • Book Gigs</p>
        <div className="mt-8 space-x-4">
          <Link to="/signup" className="px-8 py-3 bg-white text-purple-900 rounded-lg font-bold">
            Start Free
          </Link>
          <Link to="/demo" className="px-8 py-3 border border-white rounded-lg">
            Live Demo
          </Link>
        </div>
      </header>
      
      <section className="grid md:grid-cols-3 gap-8 p-16 text-white">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">Music Streaming</h3>
          <p>HLS/DASH + 3D immersive players</p>
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">Print-on-Demand</h3>
          <p>Merch that ships worldwide</p>
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">Gig Booking</h3>
          <p>Connect with venues instantly</p>
        </div>
      </section>
    </div>
  );
}
