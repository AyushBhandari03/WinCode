import axios from 'axios';

function resolveApiBaseUrl() {
	if (process.env.REACT_APP_API_BASE_URL) {
		return process.env.REACT_APP_API_BASE_URL;
	}

	const { protocol, hostname } = window.location;
	const apiProtocol = protocol === 'https:' ? 'https:' : 'http:';
	return `${apiProtocol}//${hostname}:5000/api`;
}

const api = axios.create({
	baseURL: resolveApiBaseUrl()
});

export const createContest = (data) => api.post('/contest/create', data);
export const joinContest = (data) => api.post('/contest/join', data);
export const getContest = (contestId) => api.get(`/contest/${contestId}`);

// New endpoints for Check/Submit system
export const checkCode = (data) => api.post('/submit/check', data);
export const submitCode = (data) => api.post('/submit/submit', data);

export const getLeaderboard = (contestId) => api.get(`/submit/leaderboard/${contestId}`);

export default api;