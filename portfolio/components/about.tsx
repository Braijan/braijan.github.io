'use client';

import React from 'react';
import SectionHeading from './section-heading';
import { motion } from 'framer-motion';
import { useSectionInView } from '@/lib/hooks';

export default function About() {
  const { ref } = useSectionInView('About');

  return (
    <motion.section
      ref={ref}
      className="mb-28 max-w-[45rem] text-center leading-8 sm:mb-40 scroll-mt-28"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.175 }}
      id="about"
    >
      <SectionHeading>About Me</SectionHeading>
      <p className="mb-3">
        With over a decade of leadership experience as a dedicated{' '}
        <span className="font-medium">police officer</span>, I bring a unique
        blend of resilience, creativity, and problem-solving skills to the world
        of <span className="font-medium">software development</span>. My journey
        from law enforcement to technology is driven by a passion for{' '}
        <span className="italic">continuous learning and innovation</span>.
      </p>
      <p className="mb-3">
        As a co-founder of a{' '}
        <span className="font-medium">successful restaurant business</span>, I
        honed my entrepreneurial skills, including branding and social media
        strategy, which significantly contributed to our success. My ability to{' '}
        <span className="italic">thrive in high-stress environments</span> and
        lead teams effectively has been proven time and again.
      </p>
      <p className="mb-3">
        I am currently self-teaching and have achieved mid-level proficiency in{' '}
        <span className="underline">JavaScript</span>,{' '}
        <span className="underline">TypeScript</span>,{' '}
        <span className="underline">React</span>, and other programming
        languages. My self-discipline and determination have enabled me to
        rapidly acquire and apply these new skills, demonstrating my{' '}
        <span className="font-medium">
          commitment to growth and adaptability
        </span>
        .
      </p>
      <p>
        I am seeking entry to mid-level software development roles where I can
        further develop my technical skills and contribute to innovative
        projects. I am also{' '}
        <span className="font-medium">open to opportunities</span> in{' '}
        <span className="underline">software management</span>,{' '}
        <span className="underline">scrum mastering</span>,{' '}
        <span className="underline">quality assurance</span>, where I can
        leverage my leadership experience and technical knowledge to drive team
        success.
      </p>
    </motion.section>
  );
}
