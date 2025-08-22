import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { usePuterStore } from "~/lib/puter";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";


const Resume = () => {
    const { auth, isLoading, fs, kv} = usePuterStore();

    const { id } = useParams();
    const [imageUrl, setImageUrl] = useState("");
    const [resumeUrl, setResumeUrl] = useState("");
    const [feedback, setFeedback] = useState<Feedback | null >(null);
    const navigate = useNavigate();

    useEffect(()=>{
        if(isLoading && !auth.isAuthenticated){
            navigate(`/auth?next=/resume/${id}`);
        }

    },[isLoading]);

    useEffect(() => {
        let resumeObjectUrl: string | null = null;
        let imageObjectUrl: string | null = null;

        const loadResume = async () => {
            if (!id) {
                navigate("/");
                return;
            }

            const resumeRaw = await kv.get(`resume:${id}`); // Use colon, not slash
            if (!resumeRaw) {
                console.error("No resume data found for id:", id);
                navigate("/");
                return;
            }

            try {
                const data = JSON.parse(resumeRaw);

                const resumeFileRaw = await fs.read(data.resumePath);
                if (!resumeFileRaw) {
                    console.error("Failed to read resume file");
                    return;
                }
                const resumeBlob = new Blob([resumeFileRaw], { type: "application/pdf" });
                if (resumeObjectUrl) URL.revokeObjectURL(resumeObjectUrl);
                resumeObjectUrl = URL.createObjectURL(resumeBlob);
                setResumeUrl(resumeObjectUrl);

                const imageFileRaw = await fs.read(data.imagePath);
                if (!imageFileRaw) {
                    console.error("Failed to read image file");
                    return;
                }
                const imageBlob = new Blob([imageFileRaw], { type: "image/png" });
                if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
                imageObjectUrl = URL.createObjectURL(imageBlob);
                setImageUrl(imageObjectUrl);

                setFeedback(data.feedback);
                console.log("Loaded resumeUrl:", resumeObjectUrl);
                console.log("Loaded imageUrl:", imageObjectUrl);
                console.log("Feedback:", data.feedback);
            } catch (error) {
                console.error("Error loading resume data:", error);
            }
        };

        loadResume();

        return () => {
            if (resumeObjectUrl) URL.revokeObjectURL(resumeObjectUrl);
            if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
        };
    }, [id, kv, fs, navigate]);

    return (
        <main className="!pt-0">
            <nav className="resume-nav">
                <Link to="/" className="back-button">
                    <img src="/icons/back.svg" alt="Back" className="w-2.5 h-2.5" />
                    <span className="text-gray-800 text-sm font-semibold">Back to HomePage</span>
                </Link>
            </nav>

            <div className="flex flex-row w-full max-lg:flex-col-reverse">
                <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center justify-center">
                    {imageUrl && resumeUrl && (
                        <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={imageUrl}
                                    alt="Resume preview"
                                    className="w-full h-full object-contain rounded-2xl"
                                    title="resume"
                                />
                            </a>
                        </div>
                    )}
                </section>


                <section className="feedback-section>">
                    <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
                    {feedback ? (
                        <div  className="flex flex-col gap-8 animate-in fade-in duration-1000">
                            <Summary feedback={feedback}/>
                            <ATS score={feedback.ATS.score || 0} suggestions = {feedback.ATS.tips || []} />
                            <Details feedback={feedback}/>

                        </div>

                    ) : (
                        <img src="/images/resume-scan-2.gif" className="w-full" />
                    )}



                </section>

            </div>
        </main>
    );
};

export default Resume;
