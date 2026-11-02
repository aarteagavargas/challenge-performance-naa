import http from 'k6/http';
import { check } from 'k6';

export function login(username = 'emilys', password = 'emilyspass') {
  const loginResponse = http.post(
    'https://dummyjson.com/auth/login',
    JSON.stringify({ username, password }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { operation: 'login' },
    },
  );

  check(loginResponse, {
    'login returned HTTP 200': (response) => response.status === 200,
  });

  if (loginResponse.status !== 200) {
    throw new Error(`Login failed with HTTP ${loginResponse.status}: ${loginResponse.body}`);
  }

  return loginResponse.json().accessToken;
}

export function bearerHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}
