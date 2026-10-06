import { Contact } from "@/components/contact";
import { Hero } from "@/components/hero";
import { Path } from "@/components/path";
import { Practice } from "@/components/practice";
import { Research } from "@/components/research";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Work } from "@/components/work";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="relative">
        <Hero />
        <Practice />
        <Work />
        <Research />
        <Path />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
