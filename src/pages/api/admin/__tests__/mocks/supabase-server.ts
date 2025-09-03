export const createAdminClient = jest.fn(() => ({
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'mock-admin-user-id',
          user_metadata: { role: 'admin' }
        }
      },
      error: null
    })
  }
}));
