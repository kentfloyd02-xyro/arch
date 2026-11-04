import { request } from './client';

export const uploadService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/upload/image', {
      method: 'POST',
      body: formData
    });
  }
};

export default uploadService;
