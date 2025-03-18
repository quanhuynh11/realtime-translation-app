"use client";

export default function HomePage() {
  return (
    <section className="w-screen h-screen bg-slate-900 p-5 text-center">
      <h1 className="text-4xl font-bold">Home Page</h1>
      <p className="text-2xl">Welcome to the Real-time Translation App</p>
      <section className="mt-5">
        <button onClick={() => window.location.href = "/translate-page"} className="bg-blue-600 text-white py-2 px-4 rounded-lg text-2xl hover:cursor-pointer hover:bg-blue-800">Translate!</button>
      </section>
    </section>
  )
}