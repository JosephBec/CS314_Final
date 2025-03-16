// Mock implementation of axios that reflects actual application usage
const mockAxios = {
  defaults: {
    baseURL: '',
    headers: {
      common: {
        'Content-Type': 'application/json'
      }
    }
  },
  get: jest.fn().mockImplementation(() => Promise.resolve({ 
    data: {} 
  })),
  post: jest.fn().mockImplementation((url, data) => {
    // Handle login requests
    if (url.includes('/api/auth/login')) {
      return Promise.resolve({
        data: {
          _id: 'test-user-id',
          username: data.username,
          profileImage: 'test-profile.jpg',
          bio: 'Test user bio'
        }
      });
    }
    // Handle registration requests
    if (url.includes('/api/auth/register')) {
      return Promise.resolve({
        data: {
          _id: 'new-user-id',
          username: data.username
        }
      });
    }
    // Default response
    return Promise.resolve({ data: {} });
  }),
  put: jest.fn().mockImplementation(() => Promise.resolve({ 
    data: {} 
  })),
  delete: jest.fn().mockImplementation(() => Promise.resolve({ 
    data: {} 
  })),
  patch: jest.fn().mockImplementation(() => Promise.resolve({ 
    data: {} 
  })),
  create: jest.fn().mockImplementation(() => mockAxios),
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn()
    },
    response: {
      use: jest.fn(),
      eject: jest.fn()
    }
  }
};

export default mockAxios;
