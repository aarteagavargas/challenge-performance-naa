import http from 'k6/http';
import { check } from 'k6';
import { bearerHeaders, login } from './utils/auth.js';

const rate = Number(__ENV.TPS || 50);

export const options = {
  scenarios: {
    constant_tps: {
      executor: 'constant-arrival-rate',
      rate,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: Math.max(20, Math.ceil(rate * 0.25)),
      maxVUs: Math.max(100, rate * 2),
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1000'],
    checks: ['rate>0.95'],
  },
};

export function setup() {
  const token = login();
  return { token };
}

export default function (auth) {
  const payload = JSON.stringify({
    title: `performance-k6-tps${rate}-vu${__VU}-iter${__ITER}-${Date.now()}-${Math.random()}`,
    price: 1.23,
  });

  const response = http.post('https://dummyjson.com/products/add', payload, {
    headers: bearerHeaders(auth.token),
    tags: { endpoint: 'add_product', operation: 'create_product', tps: String(rate) },
  });

  check(response, {
    'HTTP status is 201 or 200': (r) => r.status === 200 || r.status === 201,
    'created product title is present': (r) => {
      try {
        return Boolean(r.json().title);
      } catch (_) {
        return false;
      }
    },
  });
}
