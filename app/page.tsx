"use client";
import { useState } from "react";

export default function Home() {
  const [guidelines, setGuidelines] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [isOverridden, setIsOverridden] = useState(false);
  const [dbStatus, setDbStatus] = useState("");

  const handleReview = async () => {
    setLoading(true);
    setResult(null);
    setIsOverridden(false);
    setDbStatus("");
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft, guidelines }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Error connecting to AI.");
    }
    setLoading(false);
  };

  const submitOverride = async () => {
    if (!overrideReason) return alert("Please provide a reason.");
    
    try {
      // Send data to the secure backend route instead of Supabase directly
      const res = await fetch("/api/save-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft_text: draft,
          is_flagged: result.is_flagged,
          override_reason: overrideReason
        }),
      });

      const data = await res.json();

      if (data.error) {
        console.error("Save Error:", data.error);
        alert("Failed to save to database: " + data.error);
      } else {
        setIsOverridden(true);
        setShowOverrideModal(false);
        setDbStatus("✅ Override successfully saved to the audit ledger.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to connect to server.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Brand Symbiosis Engine</h1>
          <p className="text-gray-600">Intelligent Brand Governance Platform</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Inputs */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <label className="block text-sm font-semibold mb-2">1. Approved Guidelines (Admin)</label>
              <textarea
                className="w-full h-32 p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Never use the word 'cheap'. Always use 'affordable'."
                value={guidelines}
                onChange={(e) => setGuidelines(e.target.value)}
              />
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <label className="block text-sm font-semibold mb-2">2. Draft Content (Creator)</label>
              <textarea
                className="w-full h-32 p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Our new product is cheap and fast."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </div>

            <button
              onClick={handleReview}
              disabled={loading || !draft || !guidelines}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-bold transition-colors"
            >
              {loading ? "Analyzing Draft..." : "Run AI Review"}
            </button>
          </div>

          {/* Right Column: Results */}
          <div className="bg-white p-4 rounded-lg shadow min-h-[300px]">
            <label className="block text-sm font-semibold mb-4 border-b pb-2">3. AI Review Dashboard</label>
            
            {!result && !loading && (
              <p className="text-gray-400 text-sm text-center mt-10">Submit a draft to see AI analysis.</p>
            )}

            {loading && (
              <p className="text-blue-500 text-sm animate-pulse text-center mt-10">Scanning against brand rules...</p>
            )}

            {result && (
              <div className="space-y-4">
                {result.is_flagged ? (
                  <div className={`border-l-4 p-4 rounded ${isOverridden ? 'bg-gray-100 border-gray-400' : 'bg-red-50 border-red-500'}`}>
                    <h3 className={`font-bold ${isOverridden ? 'text-gray-600 line-through' : 'text-red-700'}`}>
                      Violation Found: {result.issue_type} {isOverridden && "(Overridden)"}
                    </h3>
                    <p className="text-sm mt-2 text-gray-700">
                      <strong>Guideline Cited:</strong> "{result.guideline_cited}"
                    </p>
                    <p className="text-sm mt-2 text-gray-700">
                      <strong>Explanation:</strong> {result.explanation}
                    </p>
                  </div>
                ) : (
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                    <h3 className="font-bold text-green-700">No Issues Found</h3>
                    <p className="text-sm mt-2 text-gray-700">This draft aligns with the brand guidelines.</p>
                  </div>
                )}

                {result.suggested_fix && result.is_flagged && !isOverridden && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded mt-4">
                    <h4 className="font-bold text-blue-800 text-sm">Suggested Fix:</h4>
                    <p className="text-sm mt-1 text-blue-900">{result.suggested_fix}</p>
                    
                    <div className="flex gap-2 mt-4">
                      <button 
                        onClick={() => setResult({...result, is_flagged: false})}
                        className="bg-green-600 text-white text-sm py-1 px-3 rounded hover:bg-green-700 transition-colors"
                      >
                        Accept Fix
                      </button>
                      <button 
                        onClick={() => setShowOverrideModal(true)}
                        className="bg-gray-200 text-gray-800 text-sm py-1 px-3 rounded hover:bg-gray-300 transition-colors"
                      >
                        Override
                      </button>
                    </div>
                  </div>
                )}

                {isOverridden && (
                  <div className="bg-yellow-50 border border-yellow-300 p-4 rounded mt-4 text-sm">
                    <strong>Override Reason Logged:</strong> "{overrideReason}"
                  </div>
                )}
                
                {dbStatus && (
                   <p className="text-green-600 text-sm mt-2 font-semibold">{dbStatus}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Reasoned Override</h2>
            <p className="text-sm text-gray-600 mb-4">You are overriding an AI brand violation. You must log a reason for the audit trail.</p>
            <textarea
              className="w-full border p-2 rounded mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
              placeholder="e.g. CEO approved this exact phrasing for the launch."
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowOverrideModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
              <button onClick={submitOverride} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Confirm Override</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

