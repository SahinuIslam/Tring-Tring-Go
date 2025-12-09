import axios from 'axios';

export const chatApi = (message) => {
  return axios.post('/api/chat/', { message }).then(res => res.data);
}

export const topPlacesApi = () => axios.get('/api/top-places/').then(res => res.data);
export const placesSearchApi = (q) => axios.get(`/api/places-search/?q=${encodeURIComponent(q)}`).then(res => res.data);
