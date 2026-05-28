async function getApiHealth() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return { status: "not configured", apiUrl: "NEXT_PUBLIC_API_URL" };
  }

  try {
    const response = await fetch(`${apiUrl}/health`, { cache: "no-store" });
    if (!response.ok) {
      return { status: `HTTP ${response.status}`, apiUrl };
    }
    return { ...(await response.json()), apiUrl };
  } catch {
    return { status: "unavailable", apiUrl };
  }
}

export default async function HomePage() {
  const health = await getApiHealth();

  return (
    <div className="text-center py-12">
      <h1 className="text-4xl font-bold mb-4">Fullstack Portfolio Deployment</h1>
      <p className="text-lg text-gray-600 mb-8">
        Next.js frontend connected to the FastAPI backend deployed in Yandex Cloud.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-2">Next.js</h2>
          <p className="text-gray-600">Vercel deployment with production environment variables.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-2">FastAPI</h2>
          <p className="text-gray-600">Book API with health check and OpenAPI docs.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-2">API health</h2>
          <p className="text-gray-600">{health.status}</p>
          <p className="mt-2 text-xs text-gray-400 break-words">{health.apiUrl}</p>
        </div>
      </div>
    </div>
  );
}

