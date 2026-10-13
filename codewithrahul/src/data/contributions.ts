import { projects } from '../constants/projects';

export type ContributionRecord = {
  title: string;
  organization: string;
  date?: string;
  href: string;
  category: 'Merged pull request' | 'Personal project';
  details: string[];
};

const mergedPullRequests: ContributionRecord[] = [
  {
    title: 'Add Rahul De to Contributors list',
    organization: 'firstcontributions/first-contributions',
    date: 'Oct 11, 2026',
    href: 'https://github.com/firstcontributions/first-contributions/pull/126396',
    category: 'Merged pull request',
    details: [
      'Added Rahul De to the repository Contributors.md file.',
      'Merged as pull request #126396 on Oct 11, 2026.',
    ],
  },
];

const personalProjects: ContributionRecord[] = projects.map((project) => ({
  title: project.title,
  organization: 'GitHub project',
  href: project.github,
  category: 'Personal project',
  details: [project.description],
}));

export const contributions: ContributionRecord[] = [
  ...mergedPullRequests,
  ...personalProjects,
];
