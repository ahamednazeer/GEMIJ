import { useAuth } from './useAuth';

export const usePasswordReset = () => {
  const { requestPasswordReset, resetPassword } = useAuth();

  return { requestPasswordReset, resetPassword };
};