"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";

const STAGES = ["High School", "College", "Postgrad", "Professional"] as const;

const CAREER_GROUPS: Record<string, string[]> = {
  Engineering: [
    "Software Engineer",
    "Frontend Engineer",
    "Backend Engineer",
    "Full Stack Engineer",
    "Mobile Engineer",
    "Data Engineer",
    "DevOps Engineer",
    "Cloud Engineer",
    "Security Engineer",
  ],
  "Data & Analytics": [
    "Data Science",
    "Data Analyst",
    "Business Analyst",
    "Analytics Engineer",
  ],
  "Product & Design": [
    "Product Management",
    "Product Design",
    "UX Design",
    "UI Design",
  ],
  "Finance & Trading": [
    "Quant/Trading",
    "Finance",
    "Investment Banking",
  ],
  Business: [
    "Consulting",
    "Strategy",
    "Operations",
    "Marketing",
    "Sales",
    "Business Development",
  ],
  Other: ["Other"],
};

const CAREER_DESCRIPTIONS: Record<string, string> = {
  "Software Engineer": "Build and maintain software applications and systems",
  "Frontend Engineer": "Create user interfaces and interactive web experiences",
  "Backend Engineer": "Develop server-side logic, APIs, and databases",
  "Full Stack Engineer": "Work across both frontend and backend development",
  "Mobile Engineer": "Develop iOS, Android, or cross-platform mobile apps",
  "Data Engineer": "Design and build data pipelines and infrastructure",
  "DevOps Engineer": "Automate deployment, scaling, and monitoring",
  "Cloud Engineer": "Architect and manage cloud infrastructure",
  "Security Engineer": "Protect systems and applications from threats",
  "Data Science": "Analyze data to extract insights and build ML models",
  "Data Analyst": "Turn data into actionable business insights",
  "Business Analyst": "Bridge business needs with technical solutions",
  "Analytics Engineer": "Build and maintain data analytics infrastructure",
  "Product Management": "Define product vision and guide development",
  "Product Design": "Design user experiences and interfaces",
  "UX Design": "Create intuitive and user-centered designs",
  "UI Design": "Design visual interfaces and design systems",
  "Quant/Trading": "Develop quantitative trading strategies and models",
  "Finance": "Manage financial planning, analysis, and operations",
  "Investment Banking": "Facilitate M&A, IPOs, and capital raising",
  "Consulting": "Advise organizations on strategy and operations",
  "Strategy": "Develop long-term strategic plans and initiatives",
  "Operations": "Optimize business processes and efficiency",
  "Marketing": "Drive brand awareness and customer acquisition",
  "Sales": "Build relationships and close deals",
  "Business Development": "Identify and pursue growth opportunities",
};

// Skills to category mapping
const SKILL_TO_CATEGORY: Record<string, string> = {
  "python": "Data & Analytics",
  "javascript": "Engineering",
  "typescript": "Engineering",
  "react": "Engineering",
  "node": "Engineering",
  "sql": "Data & Analytics",
  "tableau": "Data & Analytics",
  "figma": "Product & Design",
  "design": "Product & Design",
  "finance": "Finance & Trading",
  "trading": "Finance & Trading",
  "consulting": "Business",
  "marketing": "Business",
};

export default function IntentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [parsedData, setParsedData] = useState<any>(null);
  const [stage, setStage] = useState<string>("");
  const [career, setCareer] = useState<string>("");
  const [customCareer, setCustomCareer] = useState<string>("");
  const [careerSearch, setCareerSearch] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("All");
  const [showAll, setShowAll] = useState<boolean>(false);
  const [recommendedCareers, setRecommendedCareers] = useState<string[]>([]);

  // Load parsed data and auto-preselect
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/resume/${params.id}/review`);
        if (res.ok) {
          const json = await res.json();
          setParsedData(json.parsedData);
          
          // Auto-detect stage from education/experience
          const edu = json.parsedData?.education || [];
          const exp = json.parsedData?.experience || [];
          const skills = (json.parsedData?.skills || []).map((s: string) => s.toLowerCase());
          
          // Auto-detect stage from education/experience (only if not already set)
          const hasPhD = edu.some((e: any) => /phd|doctorate/i.test(e.degree || ""));
          const hasMasters = edu.some((e: any) => /masters?|ms|ma|mba/i.test(e.degree || ""));
          const hasBachelors = edu.some((e: any) => /bachelor|bs|ba|b\.?s\.?/i.test(e.degree || ""));
          const hasHighSchool = edu.some((e: any) => /high school|hs/i.test(e.degree || e.school || ""));
          const yearsExp = calculateYearsExp(exp);
          
          if (hasPhD || (hasMasters && yearsExp >= 2)) {
            setStage((prev) => prev || "Postgrad");
          } else if (hasMasters || hasBachelors || (yearsExp > 0)) {
            setStage((prev) => prev || (yearsExp >= 1 ? "Professional" : "College"));
          } else if (hasHighSchool) {
            setStage((prev) => prev || "High School");
          }
          
          // Auto-detect career category and recommend careers (only if not already set)
          const recommended = recommendCareers(skills, exp);
          setRecommendedCareers(recommended.careers);
          if (recommended.category) {
            setSelectedGroup((prev) => prev === "All" ? recommended.category || "All" : prev);
          }
        }
      } catch (e) {
        console.error("Failed to load profile data", e);
      }
    })();
  }, [params.id]);

  function calculateYearsExp(exp: any[]): number {
    let months = 0;
    exp.forEach((e: any) => {
      const start = e?.start_date ? new Date(e.start_date) : null;
      const end = !e?.end_date || /present|current/i.test(e.end_date) ? new Date() : new Date(e.end_date);
      if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
        months += Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
      }
    });
    return Math.round(months / 12);
  }

  function recommendCareers(skills: string[], exp: any[]): { category: string | null; careers: string[] } {
    const careerScores: Record<string, number> = {};
    const allCareers = Object.values(CAREER_GROUPS).flat();
    
    // Extract experience titles and descriptions
    const expTitles = exp.map((e: any) => (e?.title || "").toLowerCase()).join(" ");
    const expDescriptions = exp.map((e: any) => (e?.description || "").toLowerCase()).join(" ");
    const allText = `${skills.join(" ")} ${expTitles} ${expDescriptions}`.toLowerCase();
    
    // Score each career based on skills and experience
    allCareers.forEach((career) => {
      let score = 0;
      const careerLower = career.toLowerCase();
      const desc = (CAREER_DESCRIPTIONS[career] || "").toLowerCase();
      
      // Skill matching (weighted: exact match = 2, partial = 1)
      skills.forEach((skill) => {
        if (careerLower.includes(skill) || desc.includes(skill)) {
          score += 2; // Strong match
        } else if (skill.includes("engineer") && careerLower.includes("engineer")) {
          score += 1.5; // Partial match
        } else if (skill.includes("data") && (careerLower.includes("data") || careerLower.includes("analyst"))) {
          score += 1.5;
        } else if (skill.includes("design") && careerLower.includes("design")) {
          score += 1.5;
        }
      });
      
      // Experience title matching (higher weight)
      if (expTitles.includes(careerLower.split(" ")[0]) || expTitles.includes(careerLower.split(" ")[1])) {
        score += 3; // Strong indicator from experience
      }
      
      // Experience description matching
      if (expDescriptions.includes(careerLower.split(" ")[0]) || expDescriptions.includes(careerLower.split(" ")[1])) {
        score += 2;
      }
      
      // Category keyword matching
      const categoryKeywords: Record<string, string[]> = {
        "Engineering": ["software", "code", "programming", "develop", "engineer", "api", "system", "tech"],
        "Data & Analytics": ["data", "analysis", "sql", "python", "analytics", "machine learning", "ml", "statistics"],
        "Product & Design": ["product", "design", "ux", "ui", "user experience", "wireframe", "prototype"],
        "Finance & Trading": ["finance", "trading", "investment", "banking", "quantitative", "trading", "portfolio"],
        "Business": ["business", "strategy", "consulting", "marketing", "sales", "operations", "management"],
      };
      
      for (const [cat, keywords] of Object.entries(categoryKeywords)) {
        if (CAREER_GROUPS[cat]?.includes(career)) {
          keywords.forEach((keyword) => {
            if (allText.includes(keyword)) {
              score += 1;
            }
          });
        }
      }
      
      careerScores[career] = score;
    });
    
    // Get top 3 matches
    const sorted = Object.entries(careerScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([career]) => career);
    
    // If we don't have 3 matches with scores > 0, fill with popular careers
    if (sorted.length < 3) {
      const popularCareers = ["Software Engineer", "Data Science", "Product Management"];
      popularCareers.forEach((career) => {
        if (!sorted.includes(career) && sorted.length < 3) {
          sorted.push(career);
        }
      });
    }
    
    // Determine category from top match
    let category: string | null = null;
    if (sorted.length > 0) {
      for (const [cat, careers] of Object.entries(CAREER_GROUPS)) {
        if (careers.includes(sorted[0])) {
          category = cat;
          break;
        }
      }
    }
    
    return { category, careers: sorted.slice(0, 3) }; // Ensure exactly 3
  }

  const effectiveCareer = career === "Other" ? customCareer : career;
  
  const allCareersFlat = Object.values(CAREER_GROUPS).flat();
  const baseList = selectedGroup === "All" ? allCareersFlat : CAREER_GROUPS[selectedGroup] || [];
  const filteredCareers = baseList.filter((c) => c.toLowerCase().includes(careerSearch.toLowerCase()));
  const visibleCareers = showAll ? filteredCareers : filteredCareers.slice(0, 12);
  
  // Filter out "Other" from recommended if not needed
  const displayedRecommended = recommendedCareers.filter((c) => c !== "Other");

  async function saveIntent() {
    // Allow saving partial progress (stage and/or career)
    if (!stage && !effectiveCareer) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/resume/${params.id}/draft`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftUpdate: { intent: { ...(stage ? { stage } : {}), ...(effectiveCareer ? { career: effectiveCareer } : {}) } } }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function continueNext() {
    // Save whatever is selected, allow skipping career for now
    await saveIntent();
    try {
      const res = await fetch(`/api/resume/${params.id}/confirm`, { method: "POST", headers: { "Content-Type": "application/json" } });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        const j = await res.json();
        setError(j?.error || "Confirmation failed");
      }
    } catch (e: any) {
      setError(e?.message || "Confirmation failed");
    }
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/circular logo.png" alt="Progression" width={32} height={32} className="rounded-full" />
            <span className="text-xl font-semibold text-[#007A33]">Progression</span>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-xs font-medium bg-[#007A33]/10 text-[#007A33] px-3 py-1 rounded-full border border-[#007A33]/20">Step 2 · Intent</div>
            </div>
            <CardTitle className="mt-2">Select Your Stage and Career</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              We'll tailor your rating and recommendations based on these choices. You can change them anytime.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium mb-3">
                Current Stage
                {stage && <span className="ml-2 text-xs text-gray-500 font-normal">({stage} selected)</span>}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STAGES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStage(s)}
                    className={`rounded-lg border-2 p-4 text-left transition-all duration-200 ${
                      stage === s
                        ? "border-[#007A33] bg-[#007A33] text-white shadow-md"
                        : "border-gray-200 hover:border-[#007A33]/50 hover:bg-gray-50 hover:shadow-sm"
                    }`}
                  >
                    <div className={`text-sm font-semibold ${stage === s ? "text-white" : "text-black"}`}>{s}</div>
                    <div className={`text-xs mt-1 ${stage === s ? "text-white/90" : "text-gray-600"}`}>
                      {s === "High School" && "Exploring internships and early experiences • 9-12th grade"}
                      {s === "College" && "Internships, co-ops, first roles • Undergraduate or recent grad"}
                      {s === "Postgrad" && "MS/PhD pathways and specialized roles • Graduate student or advanced degree"}
                      {s === "Professional" && "Industry roles and progression • Full-time work experience"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">
                  Target Career
                  {career && <span className="ml-2 text-xs text-gray-500 font-normal">({career} selected)</span>}
                </p>
                {career && (
                  <button
                    type="button"
                    onClick={() => {
                      setCareer("");
                      setCustomCareer("");
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500">Don’t see an exact match? Pick the closest. You can change it anytime.</p>
                <button
                  type="button"
                  onClick={() => {
                    setCareer("");
                    setCustomCareer("");
                  }}
                  className="text-xs text-[#007A33] hover:underline"
                >
                  Skip career for now
                </button>
              </div>
              
              {/* Recommended careers - always show 3, stays visible after selection */}
              {displayedRecommended.length > 0 && (
                <div className="mb-4 p-4 bg-gradient-to-br from-[#007A33]/5 to-[#007A33]/10 border border-[#007A33]/20 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-[#007A33]" />
                    <p className="text-sm font-semibold text-[#007A33]">AI Recommended for You</p>
                    <TrendingUp className="h-3 w-3 text-[#007A33]" />
                  </div>
                  <p className="text-xs text-gray-600 mb-4">Based on your skills and experience</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {displayedRecommended.slice(0, 3).map((c, idx) => {
                      const isSelected = career === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setCareer(c);
                            // Auto-select the category
                            for (const [cat, careers] of Object.entries(CAREER_GROUPS)) {
                              if (careers.includes(c)) {
                                setSelectedGroup(cat);
                                break;
                              }
                            }
                          }}
                          className={`group rounded-lg border-2 px-4 py-3 text-left transition-all duration-200 ${
                            isSelected
                              ? "border-[#007A33] bg-[#007A33] text-white shadow-md scale-105"
                              : "border-[#007A33] bg-white hover:bg-[#007A33] hover:text-white hover:shadow-md"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold">{c}</span>
                            <div className="flex items-center gap-1">
                              {idx === 0 && !isSelected && (
                                <span className="text-[10px] bg-[#007A33] text-white px-1.5 py-0.5 rounded-full">Best Match</span>
                              )}
                              {isSelected && (
                                <CheckCircle2 className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </div>
                          {CAREER_DESCRIPTIONS[c] && (
                            <p className={`text-[10px] line-clamp-2 mt-1 ${isSelected ? "text-white/90" : "text-gray-600 group-hover:text-white/80"}`}>
                              {CAREER_DESCRIPTIONS[c]}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <Input
                placeholder="Search careers... (or browse categories below)"
                value={careerSearch}
                onChange={(e) => setCareerSearch(e.target.value)}
                className="mb-3"
              />
              {!careerSearch && (
                <p className="text-xs text-gray-500 mb-3">Not sure? Pick the closest match—you can change it anytime.</p>
              )}
              {/* Category filter - single row, horizontally scrollable */}
              <div className="overflow-x-auto mb-4 flex justify-center">
                <div className="inline-flex gap-2 min-w-max">
                  {(["All", ...Object.keys(CAREER_GROUPS)]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => { setSelectedGroup(g); setShowAll(false); }}
                      className={`text-xs rounded-full px-3 py-1 border transition whitespace-nowrap ${
                        selectedGroup === g
                          ? "border-[#007A33] bg-[#007A33]/10 text-[#007A33]"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {visibleCareers.map((c) => {
                  const isRecommended = displayedRecommended.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCareer(c)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setCareer(c);
                        }
                      }}
                      className={`rounded-lg border-2 p-3 text-left transition-all duration-200 ${
                        career === c
                          ? "border-[#007A33] bg-[#007A33] text-white shadow-md scale-105"
                          : isRecommended
                          ? "border-[#007A33]/30 bg-[#007A33]/5 hover:border-[#007A33]/50 hover:bg-[#007A33]/10"
                          : "border-gray-200 hover:border-[#007A33]/50 hover:bg-gray-50 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold flex-1">{c}</div>
                        {isRecommended && !career && (
                          <Sparkles className="h-3 w-3 text-[#007A33] flex-shrink-0" />
                        )}
                        {career === c && (
                          <CheckCircle2 className="h-3 w-3 text-white flex-shrink-0" />
                        )}
                      </div>
                      {CAREER_DESCRIPTIONS[c] && (
                        <div className={`text-[10px] mt-1 line-clamp-2 ${career === c ? "text-white/80" : "text-gray-500"}`}>
                          {CAREER_DESCRIPTIONS[c]}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {filteredCareers.length > 12 && (
                <div className="mt-3">
                  <button
                    type="button"
                    className="text-xs text-[#007A33] hover:underline"
                    onClick={() => setShowAll((s) => !s)}
                  >
                    {showAll ? "Show less" : `Show ${filteredCareers.length - 12} more`}
                  </button>
                </div>
              )}
              {career === "Other" && (
                <div className="mt-4">
                  <Input 
                    placeholder="Enter your target career" 
                    value={customCareer} 
                    onChange={(e) => setCustomCareer(e.target.value)}
                    className="border-[#007A33] focus:border-[#007A33]"
                  />
                </div>
              )}
              {filteredCareers.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No careers found matching "{careerSearch}"</p>
              )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            
            {saved && (
              <div className="flex items-center gap-2 text-sm text-[#007A33]">
                <CheckCircle2 className="h-4 w-4" />
                <span>Saved ✓</span>
              </div>
            )}
            {/* Sticky action bar on mobile */}
            <div className="h-4" />
            <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 p-3 sm:static sm:p-0 sm:border-0 sm:bg-transparent">
              <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-3">
                <div className="flex-1 hidden sm:flex items-center gap-2">
                  {saving && <span className="text-xs text-gray-500">Saving...</span>}
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    onClick={saveIntent} 
                    disabled={(!stage && !effectiveCareer) || saving}
                    className="flex-1 sm:flex-initial"
                  >
                    {saved ? "Saved ✓" : "Save"}
                  </Button>
                  <Button 
                    onClick={continueNext} 
                    disabled={!stage || saving} 
                    className="bg-[#007A33] hover:bg-[#006628] flex-1 sm:flex-initial"
                  >
                    {saving ? "Processing..." : "Continue → Generate OVR"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


