export const withAdminAuth = (handler) => async (req, res) => {
  return handler(req, res, 'mock-admin-user-id');
};
