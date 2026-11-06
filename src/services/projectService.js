import { request } from './client';

export const projectService = {
  // Returns engineering infrastructure projects directly from PostgreSQL database
  getProjects: async () => {
    try {
      const res = await request('/shop/projects');
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      return list;
    } catch (err) {
      console.warn('Projects fetch from database:', err.message);
      return [];
    }
  }
};

export default projectService;
