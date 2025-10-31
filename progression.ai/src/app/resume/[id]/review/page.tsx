"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../../../../components/ui/accordion";
import { Input } from "../../../../components/ui/input";
import { Badge } from "../../../../components/ui/badge";
import { Textarea } from "../../../../components/ui/textarea";

export default function ReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<any | null>(null);
  const [sectionsReviewed, setSectionsReviewed] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState("");

  async function markReviewed(section: string) {
    const isCurrentlyReviewed = sectionsReviewed[section];
    setSectionsReviewed({ ...sectionsReviewed, [section]: !isCurrentlyReviewed });
    await saveDraft();
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/resume/${params.id}/review`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load draft");
        setData(json.parsedData);
        setSectionsReviewed(json.sectionsReviewed || {});
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, [params.id]);

  useEffect(() => {
    if (!data) return;
    const interval = setInterval(saveDraft, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sectionsReviewed]);

  async function saveDraft() {
    if (!data) return;
    setSaving(true);
    try {
      await fetch(`/api/resume/${params.id}/draft`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftUpdate: data, sectionsReviewed }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function confirm() {
    try {
      const res = await fetch(`/api/resume/${params.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Confirmation failed");
      router.push("/dashboard");
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/circular logo.png"
              alt="Progression"
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="text-xl font-semibold text-[#007A33]">Progression</span>
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-6 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => router.push("/upload")}>← Back</Button>
            <CardTitle>Review Your Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Sections reviewed: {Object.values(sectionsReviewed).filter(Boolean).length}/5 {saving ? "• saving..." : ""}</p>
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="contact">
              <AccordionTrigger>Contact Information</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-sm">Name*</label>
                    <Input value={data.contact?.name || ""} onChange={(e) => setData({ ...data, contact: { ...data.contact, name: e.target.value } })} />
                  </div>
                  <div>
                    <label className="text-sm">Email</label>
                    <Input value={data.contact?.email || ""} onChange={(e) => setData({ ...data, contact: { ...data.contact, email: e.target.value } })} />
                  </div>
                  <div>
                    <label className="text-sm">Phone</label>
                    <Input value={data.contact?.phone || ""} onChange={(e) => setData({ ...data, contact: { ...data.contact, phone: e.target.value } })} />
                  </div>
                  <div>
                    <label className="text-sm">Location*</label>
                    <Input value={data.contact?.location || ""} onChange={(e) => setData({ ...data, contact: { ...data.contact, location: e.target.value } })} />
                  </div>
                </div>
                <div className="pt-3">
                  <Button
                    variant={sectionsReviewed.contact ? "ghost" : "secondary"}
                    onClick={() => markReviewed("contact")}
                    className={`transition-all duration-300 ${
                      sectionsReviewed.contact
                        ? "opacity-50 hover:opacity-60"
                        : "opacity-100 bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    {sectionsReviewed.contact ? "Reviewed" : "Mark as Reviewed"}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="education">
              <AccordionTrigger>Education</AccordionTrigger>
              <AccordionContent>
                {Array.isArray(data.education) && data.education.length > 0 ? (
                  <div className="space-y-3">
                    {data.education.map((ed: any, idx: number) => (
                      <div key={idx} className="text-sm border rounded-md p-3 space-y-2">
                        <div className="grid gap-2 md:grid-cols-2">
                          <div>
                            <label className="text-xs">School</label>
                            <Input value={ed.school || ""} onChange={(e) => {
                              const next = [...data.education];
                              next[idx] = { ...ed, school: e.target.value };
                              setData({ ...data, education: next });
                            }} />
                          </div>
                          <div>
                            <label className="text-xs">Degree</label>
                            <Input value={ed.degree || ""} onChange={(e) => {
                              const next = [...data.education];
                              next[idx] = { ...ed, degree: e.target.value };
                              setData({ ...data, education: next });
                            }} />
                          </div>
                          <div>
                            <label className="text-xs">Major</label>
                            <Input value={ed.major || ""} onChange={(e) => {
                              const next = [...data.education];
                              next[idx] = { ...ed, major: e.target.value };
                              setData({ ...data, education: next });
                            }} />
                          </div>
                          <div>
                            <label className="text-xs">Graduation date</label>
                            <Input value={ed.graduation_date || ""} onChange={(e) => {
                              const next = [...data.education];
                              next[idx] = { ...ed, graduation_date: e.target.value };
                              setData({ ...data, education: next });
                            }} />
                          </div>
                          <div>
                            <label className="text-xs">GPA</label>
                            <Input value={ed.gpa || ""} onChange={(e) => {
                              const next = [...data.education];
                              next[idx] = { ...ed, gpa: e.target.value };
                              setData({ ...data, education: next });
                            }} />
                          </div>
                          <div>
                            <label className="text-xs">Honors</label>
                            <Input value={ed.honors || ""} onChange={(e) => {
                              const next = [...data.education];
                              next[idx] = { ...ed, honors: e.target.value };
                              setData({ ...data, education: next });
                            }} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => {
                            const next = data.education.filter((_: any, i: number) => i !== idx);
                            setData({ ...data, education: next });
                          }}>Remove</Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" onClick={() => setData({ ...data, education: [...(data.education || []), { school: "", degree: "", major: "", graduation_date: "", gpa: "", honors: "" }] })}>Add education</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">No education parsed.</p>
                    <Button variant="outline" onClick={() => setData({ ...data, education: [{ school: "", degree: "", major: "", graduation_date: "", gpa: "", honors: "" }] })}>Add education</Button>
                  </div>
                )}
                <div className="pt-3">
                  <Button
                    variant={sectionsReviewed.education ? "ghost" : "secondary"}
                    onClick={() => markReviewed("education")}
                    className={`transition-all duration-300 ${
                      sectionsReviewed.education
                        ? "opacity-50 hover:opacity-60"
                        : "opacity-100 bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    {sectionsReviewed.education ? "Reviewed" : "Mark as Reviewed"}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="experience">
              <AccordionTrigger>Experience</AccordionTrigger>
              <AccordionContent>
                {Array.isArray(data.experience) && data.experience.length > 0 ? (
                  <div className="space-y-3">
                    {data.experience.map((ex: any, idx: number) => (
                      <div key={idx} className="text-sm border rounded-md p-3 space-y-2">
                        <div className="grid gap-2 md:grid-cols-2">
                          <div>
                            <label className="text-xs">Company</label>
                            <Input value={ex.company || ""} onChange={(e) => {
                              const next = [...data.experience];
                              next[idx] = { ...ex, company: e.target.value };
                              setData({ ...data, experience: next });
                            }} />
                          </div>
                          <div>
                            <label className="text-xs">Title</label>
                            <Input value={ex.title || ""} onChange={(e) => {
                              const next = [...data.experience];
                              next[idx] = { ...ex, title: e.target.value };
                              setData({ ...data, experience: next });
                            }} />
                          </div>
                          <div>
                            <label className="text-xs">Location</label>
                            <Input value={ex.location || ""} onChange={(e) => {
                              const next = [...data.experience];
                              next[idx] = { ...ex, location: e.target.value };
                              setData({ ...data, experience: next });
                            }} />
                          </div>
                          <div>
                            <label className="text-xs">Start date</label>
                            <Input value={ex.start_date || ""} onChange={(e) => {
                              const next = [...data.experience];
                              next[idx] = { ...ex, start_date: e.target.value };
                              setData({ ...data, experience: next });
                            }} />
                          </div>
                          <div>
                            <label className="text-xs">End date</label>
                            <Input value={ex.end_date || ""} onChange={(e) => {
                              const next = [...data.experience];
                              next[idx] = { ...ex, end_date: e.target.value };
                              setData({ ...data, experience: next });
                            }} />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs">Description (include any bullet points)</label>
                          <Textarea value={ex.description || ""} onChange={(e) => {
                            const next = [...data.experience];
                            next[idx] = { ...ex, description: e.target.value };
                            setData({ ...data, experience: next });
                          }} />
                          <p className="text-xs text-muted-foreground mt-1">Tip: enter bullets on new lines prefixed with • or -</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => {
                            const next = data.experience.filter((_: any, i: number) => i !== idx);
                            setData({ ...data, experience: next });
                          }}>Remove</Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" onClick={() => setData({ ...data, experience: [...(data.experience || []), { company: "", title: "", location: "", start_date: "", end_date: "", description: "", highlights: [] }] })}>Add experience</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">No experience parsed.</p>
                    <Button variant="outline" onClick={() => setData({ ...data, experience: [{ company: "", title: "", location: "", start_date: "", end_date: "", description: "", highlights: [] }] })}>Add experience</Button>
                  </div>
                )}
                <div className="pt-3">
                  <Button
                    variant={sectionsReviewed.experience ? "ghost" : "secondary"}
                    onClick={() => markReviewed("experience")}
                    className={`transition-all duration-300 ${
                      sectionsReviewed.experience
                        ? "opacity-50 hover:opacity-60"
                        : "opacity-100 bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    {sectionsReviewed.experience ? "Reviewed" : "Mark as Reviewed"}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="skills">
              <AccordionTrigger>Skills</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {(data.skills || []).map((s: string, i: number) => (
                      <span key={`${s}-${i}`} className="inline-flex items-center gap-2 border rounded-md px-2 py-1 text-sm">
                        {s}
                        <button type="button" className="text-muted-foreground" onClick={() => {
                          const next = (data.skills || []).filter((_: string, idx: number) => idx !== i);
                          setData({ ...data, skills: next });
                        }}>×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const value = skillInput.trim();
                          if (value) {
                            const next = Array.from(new Set([...(data.skills || []), value]));
                            setData({ ...data, skills: next });
                            setSkillInput("");
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        const value = skillInput.trim();
                        if (value) {
                          const next = Array.from(new Set([...(data.skills || []), value]));
                          setData({ ...data, skills: next });
                          setSkillInput("");
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                <div className="pt-3">
                  <Button
                    variant={sectionsReviewed.skills ? "ghost" : "secondary"}
                    onClick={() => markReviewed("skills")}
                    className={`transition-all duration-300 ${
                      sectionsReviewed.skills
                        ? "opacity-50 hover:opacity-60"
                        : "opacity-100 bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    {sectionsReviewed.skills ? "Reviewed" : "Mark as Reviewed"}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="certifications">
              <AccordionTrigger>Certifications</AccordionTrigger>
              <AccordionContent>
                {Array.isArray(data.certifications) && data.certifications.length > 0 ? (
                  <div className="space-y-3">
                    {data.certifications.map((cert: any, idx: number) => (
                      <div key={idx} className="text-sm border rounded-md p-3 space-y-2">
                        <div className="grid gap-2 md:grid-cols-2">
                          <div>
                            <label className="text-xs">Certification Name</label>
                            <Input value={cert.name || ""} onChange={(e) => {
                              const next = [...data.certifications];
                              next[idx] = { ...cert, name: e.target.value };
                              setData({ ...data, certifications: next });
                            }} />
                          </div>
                          <div>
                            <label className="text-xs">Issuer</label>
                            <Input value={cert.issuer || ""} onChange={(e) => {
                              const next = [...data.certifications];
                              next[idx] = { ...cert, issuer: e.target.value };
                              setData({ ...data, certifications: next });
                            }} />
                          </div>
                          <div>
                            <label className="text-xs">Date Obtained</label>
                            <Input value={cert.date || ""} placeholder="e.g. May 2024" onChange={(e) => {
                              const next = [...data.certifications];
                              next[idx] = { ...cert, date: e.target.value };
                              setData({ ...data, certifications: next });
                            }} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => {
                            const next = data.certifications.filter((_: any, i: number) => i !== idx);
                            setData({ ...data, certifications: next });
                          }}>Remove</Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" onClick={() => setData({ ...data, certifications: [...(data.certifications || []), { name: "", issuer: "", date: "" }] })}>Add certification</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">No certifications parsed. Add any certifications you have (optional).</p>
                    <Button variant="outline" onClick={() => setData({ ...data, certifications: [{ name: "", issuer: "", date: "" }] })}>Add certification</Button>
                  </div>
                )}
                <div className="pt-3">
                  <Button
                    variant={sectionsReviewed.certifications ? "ghost" : "secondary"}
                    onClick={() => markReviewed("certifications")}
                    className={`transition-all duration-300 ${
                      sectionsReviewed.certifications
                        ? "opacity-50 hover:opacity-60"
                        : "opacity-100 bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    {sectionsReviewed.certifications ? "Reviewed" : "Mark as Reviewed"}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={saveDraft}>Save</Button>
            <Button onClick={confirm} disabled={Object.values(sectionsReviewed).filter(Boolean).length < 5}>Confirm & Continue</Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}


