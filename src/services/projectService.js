export const FEATURED_PROJECTS = [
  {
    id: 'proj-1',
    customId: 'proj-1',
    title: 'High-Strength Self Leveling Mortar Road Repair',
    location: 'C-5 Highway Corridor, Pasig (Metro Manila)',
    date: 'Jan 31 – Feb 2, 2020',
    contractor: 'Applied by RF Flores Construction',
    region: 'Metro Manila',
    summary: 'Pavement rehabilitation of national road sections using Archon Nell high-strength self-leveling repair system.',
    image: '/assets/images/High-Strength Self Leveling Mortar Road Repair.jpg'
  },
  {
    id: 'proj-2',
    customId: 'proj-2',
    title: 'National Pavement Pilot Run for "One-Day Concrete"',
    location: 'EDSA Balintawak Section, Quezon City (Metro Manila)',
    date: 'January 10, 2020',
    contractor: 'Poured by Eddmari Construction & Trading Corp.',
    region: 'Metro Manila',
    summary: 'Official demonstration of rapid strength concrete technology allowing traffic opening in 24 hours.',
    image: '/assets/images/National Pavement Pilot Run for One-Day Concrete.jpg'
  },
  {
    id: 'proj-3',
    customId: 'proj-3',
    title: 'San Simon Pavement Road Repair Project',
    location: 'Roxas Boulevard & Port Access, Manila (Metro Manila)',
    date: 'November 14, 2019',
    contractor: 'Archon Nell Engineering Team',
    region: 'Metro Manila',
    summary: 'Concrete pavement repair utilizing Megaflow, SP402 & MF3000 high-durability admixtures.',
    image: '/assets/images/San Simon Pavement Road Repair Project.jpg'
  },
  {
    id: 'proj-4',
    customId: 'proj-4',
    title: 'Major Waterworks & Dam Infrastructure Supply',
    location: 'La Mesa Reservoir Corridor, Quezon City (Metro Manila)',
    date: '2019 – 2023 (4-Year Project)',
    contractor: 'National Waterways Authority',
    region: 'Metro Manila',
    summary: 'Continuous 4-year bulk supply of specialized high-slump concrete admixtures for major infrastructure.',
    image: '/assets/images/Major Metro Manila Infrastructure Admixture Supply.jpg'
  }
];

export const projectService = {
  // Returns featured engineering projects showcase portfolio
  getProjects: async () => FEATURED_PROJECTS
};

export default projectService;
