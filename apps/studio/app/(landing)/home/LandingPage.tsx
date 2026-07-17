import "./home.css";
import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { SocialProof } from "./SocialProof";
import { Problem } from "./Problem";
import { HowItWorks } from "./HowItWorks";
import { ForEveryone } from "./ForEveryone";
import { Testimonials } from "./Testimonials";
import { Manifesto } from "./Manifesto";
import { ArchiveBand } from "./ArchiveBand";
import { Footer } from "./Footer";

export function LandingPage() {
  return (
    <div className="poy-landing-root flex min-h-screen flex-col bg-[#F2EEE2] font-sans text-[#262922]">
      <Nav />
      <Hero />
      <SocialProof />
      <Problem />
      <HowItWorks />
      <ForEveryone />
      <Testimonials />
      <Manifesto />
      <ArchiveBand />
      <Footer />
    </div>
  );
}
