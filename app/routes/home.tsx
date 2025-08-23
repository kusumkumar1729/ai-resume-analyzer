import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import { usePuterStore } from "~/lib/puter";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";

// Enhanced meta function with full SEO title and description
export function meta({}: Route.MetaArgs) {
    return [
        { title: "Resumind - Track Your Resume & Job Applications" },
        {
            name: "description",
            content:
                "Upload your resumes, track job applications, and get AI-powered feedback to improve your chances of landing your dream job.",
        },
        { name: "robots", content: "index, follow" }, // ensure page is indexed
        { name: "viewport", content: "width=device-width, initial-scale=1" },
    ];
}

// Structured data for Organization schema in JSON-LD format
export function headers() {
    return {
        "Content-Type": "text/html",
    };
}

// Inject JSON-LD for SEO structured data dynamically (if supported by your framework)
export function handleStructuredData() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Resumind",
        url: "https://yourdomain.com",
        description:
            "Smart feedback platform for job seekers to track resumes and job applications with AI assistance.",
        logo: "https://yourdomain.com/images/logo.png",
    };
    return (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    );
}

export default function Home() {
    const { auth, kv } = usePuterStore();
    const navigate = useNavigate();
    const [resumes, setResumes] = useState<Resume[]>([]);
    const [loadingResumes, setLoadingResumes] = useState(false);

    useEffect(() => {
        if (!auth.isAuthenticated) navigate("/auth?next=/");
    }, [auth.isAuthenticated]);

    useEffect(() => {
        const loadResumes = async () => {
            setLoadingResumes(true);

            const resumes = (await kv.list("resume:*", true)) as KVItem[];

            const parsedResumes = resumes?.map((resume) => JSON.parse(resume.value) as Resume);
            console.log(parsedResumes);
            setResumes(parsedResumes || []);
            setLoadingResumes(false);
        };

        loadResumes();
    }, []);

    return (
        <>
            {handleStructuredData()}
            <main className="bg-[url('/images/bg-main.svg')] bg-cover">
                <Navbar />

                <section className="main-section">
                    <div className="page-heading py-16">
                        <h1>Track Your Applications & Resume Ratings</h1>
                        {!loadingResumes && resumes?.length === 0 ? (
                            <h2>No resumes found. Upload your first resume to get feedback.</h2>
                        ) : (
                            <h2>Review your submissions and check AI-powered feedback.</h2>
                        )}
                    </div>
                    {loadingResumes && (
                        <div className="flex flex-col items-center justify-center">
                            <img
                                src="/images/resume-scan-2.gif"
                                alt="Loading animation scanning resume"
                                className="w-[200px]"
                            />
                        </div>
                    )}

                    {!loadingResumes && resumes.length > 0 && (
                        <div className="resumes-section">
                            {resumes.map((resume) => (
                                <ResumeCard key={resume.id} resume={resume} />
                            ))}
                        </div>
                    )}

                    {!loadingResumes && resumes?.length === 0 && (
                        <div className="flex flex-col items-center justify-center mt-10 gap-4">
                            <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
                                Upload Resume
                            </Link>
                        </div>
                    )}

                    {/* Developer details section */}
                    <div className="mt-20 text-center text-gray-800">
                        <p className="text-2xl font-semibold">Developer Name : M Kusuma Kumar</p>
                        <p className="text-lg font-medium text-gray-600 mt-1">Tech Enthusiast</p>
                    </div>
                </section>
            </main>
        </>
    );
}
