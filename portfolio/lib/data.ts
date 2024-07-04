import React from 'react';
import { CgWorkAlt } from 'react-icons/cg';
import { GiChefToque } from 'react-icons/gi';
import { FaReact } from 'react-icons/fa';
import { LuGraduationCap } from 'react-icons/lu';
import { RiPoliceBadgeLine } from 'react-icons/ri';
import corpcommentImg from '@/public/corpcomment.png';
import rmtdevImg from '@/public/rmtdev.png';
import wordanalyticsImg from '@/public/wordanalytics.png';

export const links = [
  {
    name: 'Home',
    hash: '#home',
  },
  {
    name: 'About',
    hash: '#about',
  },
  {
    name: 'Projects',
    hash: '#projects',
  },
  {
    name: 'Skills',
    hash: '#skills',
  },
  {
    name: 'Experience',
    hash: '#experience',
  },
  {
    name: 'Contact',
    hash: '#contact',
  },
] as const;

export const experiencesData = [
  {
    title: 'Graduated College',
    location: 'Providence, RI',
    description:
      'I graduated from Johnson & Wales University with a BS in Culinary Nutrition. From there I worked my way up to a Sous Chef position in the Greater Philadelphia area.',
    icon: React.createElement(LuGraduationCap),
    date: '2008 - 2014',
  },
  {
    title: 'Police Officer',
    location: 'Philadelphia, PA',
    description:
      'I transitioned to a Police Officer in the city of Philadelphia until I was promoted to Sergeant in 2022.',
    icon: React.createElement(RiPoliceBadgeLine),
    date: '2014 - 2023',
  },
  {
    title: 'CO-Owner/Executive Chef of "Dawghouse Grille"',
    location: 'Elmer, NJ',
    description:
      'I resigned from the Police Department to help start a business in South Jersey which included a food truck and brewery/cidery.',
    icon: React.createElement(GiChefToque),
    date: '2023 - 2024',
  },
  {
    title: 'Full-Stack Developer',
    location: 'Newfield, NJ',
    description:
      "I'm now a mid-level full-stack developer working as a freelancer. My stack includes React, Next.js, TypeScript, and Tailwind. I'm open to full-time opportunities.",
    icon: React.createElement(FaReact),
    date: '2024 - present',
  },
] as const;

export const projectsData = [
  {
    title: 'Project 1',
    description: 'Coming soon!',
    tags: ['React', 'Next.js', 'MongoDB', 'Tailwind', 'Prisma'],
    imageUrl: corpcommentImg,
  },
  {
    title: 'Project 2',
    description: 'Coming soon!',
    tags: ['React', 'TypeScript', 'Next.js', 'Tailwind', 'Redux'],
    imageUrl: rmtdevImg,
  },
  {
    title: 'Project 3',
    description: 'Coming soon!',
    tags: ['React', 'Next.js', 'SQL', 'Tailwind', 'Framer'],
    imageUrl: wordanalyticsImg,
  },
] as const;

export const skillsData = [
  'HTML',
  'CSS',
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Node.js',
  //'Git',
  'Tailwind',
  //'Prisma',
  //'MongoDB',
  //'Redux',
  //'GraphQL',
  //'Apollo',
  //'Express',
  //'PostgreSQL',
  //'Python',
  //'Django',
  'Framer Motion',
] as const;
