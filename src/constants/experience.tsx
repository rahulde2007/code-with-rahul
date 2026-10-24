import React from 'react';
import { GitBranch } from 'lucide-react';
import { SiC, SiCplusplus } from 'react-icons/si';
import Github from '../components/svgs/Github';
import JavaScript from '../components/svgs/JavaScript';
import Html from '../components/svgs/Html';
import CSS from '../components/svgs/CSS';
import { Python } from '../components/svgs/Python';

export interface ExperienceInterface {
    company: string;
    isBlur?: boolean;
    isCurrent?: boolean;
    position: string;
    startDate: string;
    endDate?: string;
    location?: string;
    technologies: { name: string; icon: React.ReactNode }[];
    description: string[];
}

export const experiences: ExperienceInterface[] = [
    {
        company: 'Independent',
        location: 'Personal Projects',
        position: 'Aspiring Full-Stack Developer',
        startDate: '2026',
        endDate: 'Present',
        description: [
            'Built personal web development projects using modern technologies.',
            'Developed responsive user interfaces and practical web applications.',
            'Continuously improving coding, debugging, and problem-solving skills.',
        ],
        technologies: [
            { name: 'HTML', icon: <Html /> },
            { name: 'CSS', icon: <CSS /> },
            { name: 'JavaScript', icon: <JavaScript /> },
        ],
    },
    {
        company: 'GitHub',
        position: 'Open Source Contributor',
        startDate: '2026',
        endDate: 'Present',
        description: [
            'Contributed to open-source projects through GitHub.',
            'Worked with repositories, commits, pull requests, and code reviews.',
            'Engaged with the developer community to improve project quality.',
        ],
        technologies: [
            { name: 'Git', icon: <GitBranch /> },
            { name: 'GitHub', icon: <Github /> },
        ],
    },
    {
        company: 'Future Institute of Engineering and Management',
        location: 'Kolkata, West Bengal',
        position: 'Computer Science Engineering Student',
        startDate: '2026',
        endDate: 'Present',
        description: [
            'Building a strong foundation in programming and computer science fundamentals.',
            'Learning software development, data structures, and problem-solving.',
            'Applying new concepts through hands-on projects.',
        ],
        technologies: [
            { name: 'C', icon: <SiC className="text-[#A8B9CC]" /> },
            { name: 'C++', icon: <SiCplusplus className="text-[#00599C]" /> },
            { name: 'Python', icon: <Python /> },
        ],
    },
];
